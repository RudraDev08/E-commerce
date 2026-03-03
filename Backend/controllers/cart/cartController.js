/**
 * Cart Controller — FIX 3
 * POST /api/cart/validate
 *
 * Validates cart items server-side before the customer proceeds to checkout.
 * Checks:
 *   1. Variant still ACTIVE (not ARCHIVED / OUT_OF_STOCK)
 *   2. Requested qty <= availableStock in InventoryMaster
 *   3. Client price matches current VariantMaster.price (priceVersion drift)
 *
 * Returns:
 *   removedItems  — variantIds that are OOS / delisted
 *   priceChanges  — variantIds whose price changed, with old/new prices
 *   updatedItems  — valid items with confirmed data (stock, price)
 *
 * Design: FAIL-OPEN (network errors never block checkout, frontend handles gracefully)
 */
import mongoose from 'mongoose';

const PRICE_TOLERANCE = 0.01; // Allow ±₹0.01 floating point drift

export const validateCart = async (req, res) => {
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'items array is required',
            });
        }

        // Lazy-load models to avoid circular import issues at startup
        const VariantMaster = mongoose.model('VariantMaster');
        const InventoryMaster = mongoose.model('InventoryMaster');

        const variantIds = items.map(i => {
            try { return new mongoose.Types.ObjectId(i.variantId); }
            catch { return null; }
        }).filter(Boolean);

        // Batch fetch both in parallel — single round-trip per collection
        const [variants, inventories] = await Promise.all([
            VariantMaster.find(
                { _id: { $in: variantIds } },
                { _id: 1, status: 1, price: 1, priceVersion: 1, sku: 1 }
            ).lean(),
            InventoryMaster.find(
                { variantId: { $in: variantIds } },
                { variantId: 1, availableStock: 1, totalStock: 1, reservedStock: 1 }
            ).lean(),
        ]);

        // Build lookup maps
        const variantMap = Object.fromEntries(variants.map(v => [v._id.toString(), v]));
        const inventoryMap = Object.fromEntries(inventories.map(i => [i.variantId.toString(), i]));

        const removedItems = [];
        const priceChanges = [];
        const updatedItems = [];

        for (const item of items) {
            const vid = item.variantId;
            const variant = variantMap[vid];
            const inventory = inventoryMap[vid];
            const clientPrice = parseFloat(item.clientPrice) || 0;
            const requestedQty = parseInt(item.quantity) || 1;

            // ── 1. Variant not found or ARCHIVED/LOCKED —— remove it
            if (!variant || variant.status === 'ARCHIVED' || variant.status === 'LOCKED') {
                removedItems.push({ variantId: vid, reason: 'DELISTED' });
                continue;
            }

            const serverPrice = parseFloat(variant.price?.toString() || '0');
            const availableStock = inventory?.availableStock ?? 0;

            // ── 2. OOS — not enough stock for requested qty
            if (availableStock < requestedQty) {
                if (availableStock <= 0) {
                    // Fully OOS — remove
                    removedItems.push({ variantId: vid, reason: 'OUT_OF_STOCK' });
                    continue;
                }
                // Partially available — we'll cap qty in updatedItems; price-change flow handles warn
            }

            // ── 3. Price mismatch (stale cart)
            if (Math.abs(serverPrice - clientPrice) > PRICE_TOLERANCE) {
                priceChanges.push({
                    variantId: vid,
                    oldPrice: clientPrice,
                    newPrice: serverPrice,
                    priceVersion: variant.priceVersion,
                });
            }

            // ── Valid item (may have capped qty)
            const confirmedQty = Math.min(requestedQty, availableStock);
            updatedItems.push({
                variantId: vid,
                sku: variant.sku,
                confirmedPrice: serverPrice,
                priceVersion: variant.priceVersion,
                availableStock,
                confirmedQty,
                status: variant.status,
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                removedItems,  // frontend removes these
                priceChanges,  // frontend updates prices, shows toast
                updatedItems,  // frontend may cap quantities
                validatedAt: new Date().toISOString(),
            },
        });

    } catch (err) {
        // Fail-open: return 200 with empty arrays so the frontend can proceed
        console.error('[CartValidate] Error:', err.message);
        return res.status(200).json({
            success: true,
            data: { removedItems: [], priceChanges: [], updatedItems: [], error: err.message },
        });
    }
};
