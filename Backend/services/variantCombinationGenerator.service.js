import VariantMaster from '../models/VariantMaster.js';
import SizeMaster from '../models/SizeMaster.js';
import ColorMaster from '../models/ColorMaster.js';
import WarehouseMaster from '../models/WarehouseMaster.js';
import VariantInventory from '../models/VariantInventory.js';
import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * ========================================================================
 * PRODUCTION-GRADE VARIANT GENERATOR SERVICE
 * ========================================================================
 * 
 * Features:
 * - Atomic Transactions
 * - Batch Processing (No N+1)
 * - Concurrency Safe (Optimistic Locking + Retry)
 * - Memory Efficient
 * - Idempotency Support
 */

const MAX_COMBINATIONS = 500;
const MAX_RETRIES = 3;

/**
 * Generate configuration hash (Deterministic)
 */
function generateConfigHash(productGroup, sizeIds, colorId) {
    const sortedSizes = [...(sizeIds || [])].sort().join(',');
    const hashInput = `${productGroup}|${sortedSizes}|${colorId || ''}`;
    return crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 32);
}

/**
 * Generate Base SKU (Deterministic)
 */
function generateBaseSKU(brand, productGroup, sizes, colorName) {
    const brandPrefix = (brand || 'VAR').substring(0, 3).toUpperCase();
    const groupSuffix = (productGroup || 'PROD').substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Process sizes (take first 2 for SKU compactness)
    const sizePart = sizes.slice(0, 2)
        .map(s => s.value.replace(/[^a-zA-Z0-9]/g, ''))
        .join('-')
        .substring(0, 10)
        .toUpperCase() || 'STD';

    const colorPart = colorName ? colorName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') : 'STD';

    return `${brandPrefix}-${groupSuffix}-${sizePart}-${colorPart}`;
}

/**
 * Cartesian Product Generator
 */
/**
 * Cartesian Product Generator (Corrected)
 * Flattens without destroying object structure
 */
function cartesianProduct(arrays) {
    return arrays.reduce((acc, curr) => {
        return acc.flatMap(a => curr.map(b => [...a, b]));
    }, [[]]);
}

/**
 * Main Generator Function
 */
export const generateVariantCombinations = async (params) => {
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const result = await executeGeneration(params, session);
            await session.commitTransaction();
            return result;
        } catch (error) {
            await session.abortTransaction();

            // Retry only on transient errors (WriteConflict) or Duplicate Keys that might be race conditions
            const isTransient = error.errorLabels && error.errorLabels.includes('TransientTransactionError');
            const isDuplicateKey = error.code === 11000;

            if ((isTransient || isDuplicateKey) && attempts < MAX_RETRIES - 1) {
                attempts++;
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempts)));
                continue;
            }

            throw error;
        } finally {
            session.endSession();
        }
    }
};

/**
 * Core Execution Logic
 */
async function executeGeneration(params, session) {
    const {
        productGroup, productName, brand, category,
        storageIds = [], ramIds = [], colorIds = [],
        basePrice = 0, description = '', specifications = {}, images = []
    } = params;

    // 1. Validation & Master Data Load
    if (!productGroup || !productName) throw new Error('Missing required fields');

    const [storageSizes, ramSizes, colors, defaultWarehouse] = await Promise.all([
        storageIds.length ? SizeMaster.find({ _id: { $in: storageIds }, isActive: true }).lean() : [],
        ramIds.length ? SizeMaster.find({ _id: { $in: ramIds }, isActive: true }).lean() : [],
        ColorMaster.find({ _id: { $in: colorIds }, isActive: true }).lean(),
        WarehouseMaster.findOne({ isDefault: true }).lean()
    ]);

    // Validation: Ensure found sizes match request intent
    if (storageIds.length > 0 && storageSizes.length === 0) throw new Error('Invalid storage IDs provided');
    if (ramIds.length > 0 && ramSizes.length === 0) throw new Error('Invalid RAM IDs provided');

    if (!colors.length) throw new Error('No valid colors found');

    // 2. Generate Combinations (In Memory)
    let sizeCombinations = [];
    if (storageSizes.length && ramSizes.length) {
        sizeCombinations = cartesianProduct([storageSizes, ramSizes]);
    } else if (storageSizes.length) {
        sizeCombinations = storageSizes.map(s => [s]);
    } else {
        sizeCombinations = ramSizes.map(r => [r]);
    }

    const combinations = [];
    for (const sizeCombo of sizeCombinations) {
        for (const color of colors) {
            combinations.push({ sizes: sizeCombo, color });
        }
    }

    if (combinations.length > MAX_COMBINATIONS) {
        throw new Error(`Too many combinations (${combinations.length}). Max allowed: ${MAX_COMBINATIONS}`);
    }

    // 3. Batch Duplicate Check (ConfigHash)
    // Calculate all hashes first
    const candidates = combinations.map(c => {
        const sizeIds = c.sizes.map(s => s._id.toString());
        const hash = generateConfigHash(productGroup, sizeIds, c.color._id.toString());
        const baseSKU = generateBaseSKU(brand, productGroup, c.sizes, c.color.name);
        return { ...c, configHash: hash, baseSKU };
    });

    const hashList = candidates.map(c => c.configHash);

    // Batch query existing hashes
    const existingVariants = await VariantMaster.find({
        configHash: { $in: hashList }
    }).session(session).select('configHash').lean();

    const existingHashSet = new Set(existingVariants.map(v => v.configHash));

    // Filter out duplicates
    const newCandidates = candidates.filter(c => !existingHashSet.has(c.configHash));

    if (newCandidates.length === 0) {
        return { success: true, totalGenerated: 0, message: "All combinations already exist" };
    }

    // 4. Batch SKU Collision Check & Uniqueness
    const skuList = newCandidates.map(c => c.baseSKU);
    // Find collisions with base SKUs
    const existingSKUs = await VariantMaster.find({
        sku: { $in: skuList } // Check exact matches for base
    }).session(session).select('sku').lean();

    const existingSKUSet = new Set(existingSKUs.map(v => v.sku));
    const variantsToInsert = [];

    for (const item of newCandidates) {
        let sku = item.baseSKU;

        // If base SKU exists OR we've already used it in this batch
        // We need a mechanism to ensure uniqueness within the batch too
        if (existingSKUSet.has(sku) || variantsToInsert.some(v => v.sku === sku)) {
            // Append random suffix
            const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            sku = `${sku}-${suffix}`;
        }

        variantsToInsert.push({
            productGroup,
            productName,
            brand,
            category,
            sku,
            configHash: item.configHash,
            color: item.color._id,
            sizes: item.sizes.map(s => ({
                sizeId: s._id,
                category: s.category,
                value: s.value
            })),
            price: basePrice,
            description,
            specifications,
            images: images.map((img, idx) => ({
                url: img.url || img,
                isPrimary: idx === 0,
                sortOrder: idx
            })),
            status: 'active'
        });
    }

    // 5. Bulk Insert Variants
    // We expect this to succeed because we did pre-checks, but race conditions are caught by the transaction retry loop
    const createdVariants = await VariantMaster.insertMany(variantsToInsert, { session });

    // 6. Auto-Create Inventory (Bulk)
    if (defaultWarehouse && createdVariants.length > 0) {
        const inventoryDocs = createdVariants.map(v => ({
            variant: v._id,
            warehouse: defaultWarehouse._id,
            quantity: 0,
            reservedQuantity: 0
        }));

        await VariantInventory.insertMany(inventoryDocs, { session });
    }

    return {
        success: true,
        totalGenerated: createdVariants.length,
        skipped: combinations.length - createdVariants.length,
        variants: createdVariants.map(v => ({ sku: v.sku, id: v._id }))
    };
}

/**
 * Preview Combinations (Read-only)
 */
export const previewCombinations = async (params) => {
    const { productGroup, brand, storageIds = [], ramIds = [], colorIds = [] } = params;

    const [storageSizes, ramSizes, colors] = await Promise.all([
        storageIds.length ? SizeMaster.find({ _id: { $in: storageIds } }).lean() : [],
        ramIds.length ? SizeMaster.find({ _id: { $in: ramIds } }).lean() : [],
        ColorMaster.find({ _id: { $in: colorIds } }).lean()
    ]);

    if (storageIds.length > 0 && storageSizes.length === 0) throw new Error('Invalid storage IDs provided');
    if (ramIds.length > 0 && ramSizes.length === 0) throw new Error('Invalid RAM IDs provided');

    let sizeCombinations = [];
    if (storageSizes.length && ramSizes.length) sizeCombinations = cartesianProduct([storageSizes, ramSizes]);
    else if (storageSizes.length) sizeCombinations = storageSizes.map(s => [s]);
    else sizeCombinations = ramSizes.map(r => [r]);

    const previews = [];
    for (const sizeCombo of sizeCombinations) {
        for (const color of colors) {
            const sku = generateBaseSKU(brand, productGroup, sizeCombo, color.name);
            previews.push({
                sku,
                sizes: sizeCombo.map(s => ({ category: s.category, value: s.value })),
                color: { name: color.name, hexCode: color.hexCode }
            });
        }
    }

    return { totalCombinations: previews.length, previews };
};

export default {
    generateVariantCombinations,
    previewCombinations
};
