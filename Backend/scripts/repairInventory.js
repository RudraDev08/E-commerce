/**
 * ============================================================
 * INVENTORY REPAIR SCRIPT — Phase 2
 * ============================================================
 * Finds every VariantMaster that has no InventoryMaster record
 * and creates a zero-stock placeholder so the Inventory UI
 * always shows all variants.
 *
 * SAFE: idempotent — uses updateOne with upsert so re-running
 * never duplicates records or resets existing stock.
 *
 * Usage:
 *   node scripts/repairInventory.js
 *   node scripts/repairInventory.js --productGroupId=<id>   (scope to one product)
 *   node scripts/repairInventory.js --dryRun                (preview only, no writes)
 * ============================================================
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import VariantMaster from '../models/masters/VariantMaster.enterprise.js';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
    process.argv.slice(2)
        .filter(a => a.startsWith('--'))
        .map(a => {
            const [k, v] = a.slice(2).split('=');
            return [k, v ?? true];
        })
);

const DRY_RUN = args.dryRun === true || args.dryRun === 'true';
const SCOPE_PRODUCT = args.productGroupId || null;

async function run() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(uri);
    console.log(`✅  Connected to MongoDB`);
    if (DRY_RUN) console.warn(`⚠️   DRY RUN MODE — no writes will be performed`);
    if (SCOPE_PRODUCT) console.log(`🔍  Scoped to productGroupId: ${SCOPE_PRODUCT}`);

    // 1. Fetch all variants (optionally scoped)
    // Use $ne: true to also catch docs without the isDeleted field (legacy variants)
    const variantFilter = { isDeleted: { $ne: true } };
    if (SCOPE_PRODUCT) variantFilter.productGroupId = new mongoose.Types.ObjectId(SCOPE_PRODUCT);

    const variants = await VariantMaster.find(variantFilter)
        .select('_id productGroupId sku status')
        .lean();

    console.log(`\n📦  Total variants found: ${variants.length}`);

    // 2. Fetch all existing inventory IDs in one shot (O(n) lookup)
    const variantIds = variants.map(v => v._id);
    const existingInventory = await InventoryMaster.find({
        variantId: { $in: variantIds },
    }).select('variantId').lean();

    const existingSet = new Set(existingInventory.map(i => i.variantId.toString()));

    // 3. Find orphaned variants
    const orphans = variants.filter(v => !existingSet.has(v._id.toString()));
    console.log(`🚨  Orphaned variants (missing InventoryMaster): ${orphans.length}`);

    if (orphans.length === 0) {
        console.log('\n✅  All variants have InventoryMaster records. Nothing to repair.');
        await mongoose.disconnect();
        process.exit(0);
    }

    // 4. Print orphans
    orphans.forEach(v => {
        console.log(`   → Variant ${v._id} | SKU: ${v.sku || 'N/A'} | Status: ${v.status}`);
    });

    if (DRY_RUN) {
        console.log(`\n⚠️   DRY RUN: Would create ${orphans.length} InventoryMaster records.`);
        await mongoose.disconnect();
        process.exit(0);
    }

    // 5. Create missing inventory records using upsert (safe to re-run)
    let created = 0;
    let failed = 0;

    for (const variant of orphans) {
        try {
            const result = await InventoryMaster.updateOne(
                { variantId: variant._id },          // filter
                {
                    $setOnInsert: {
                        variantId: variant._id,
                        // productId is required by schema — use productGroupId as fallback
                        productId: variant.productGroupId,
                        sku: variant.sku || `REPAIR-${variant._id}`,
                        totalStock: 0,
                        reservedStock: 0,
                        availableStock: 0,
                        lowStockThreshold: 5,
                        status: 'OUT_OF_STOCK',
                        isDeleted: false,
                        locations: [],
                    }
                },
                { upsert: true }                     // create if not exists, skip if exists
            );

            if (result.upsertedCount > 0) {
                console.log(`   ✅ Created inventory for variant ${variant._id} (SKU: ${variant.sku || 'N/A'})`);
                created++;
            } else {
                console.log(`   ⏭️  Inventory already existed for variant ${variant._id} (race condition — skipped)`);
            }
        } catch (err) {
            console.error(`   ❌ Failed for variant ${variant._id}: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n═══════════════════════════════════════`);
    console.log(`✅  Created : ${created}`);
    console.log(`❌  Failed  : ${failed}`);
    console.log(`⏭️  Skipped  : ${orphans.length - created - failed}`);
    console.log(`═══════════════════════════════════════\n`);

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
