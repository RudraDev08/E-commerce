
// ============================================================================
// Migration Script: Backfill `finalPrice` and `indexedPrice`
// Also updates `filterIndex`.
// Usage: node scripts/migrateVariantPrices.js
// ============================================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Variant from '../models/variant/variantSchema.js';
import connectDB from '../config/db.js'; // Adjust path
import AttributeValue from '../models/AttributeValue.model.js'; // Adjust path

dotenv.config();

const migrate = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to DB');

        const variants = await Variant.find({}).populate('variantAttributes.attributeValue');
        console.log(`Found ${variants.length} variants to process...`);

        let count = 0;
        for (const v of variants) {
            // Recalculate Price
            // Note: v.calculatePrice is synchronous now, but requires populated data
            // We populated `variantAttributes.attributeValue` above.

            const newFinalPrice = v.calculatePrice(); // Uses `this.price` as base if not passed

            // Generate Filter Index
            v.generateFilterIndex();

            // Set fields directly (bypass hook if we save with strict validation off, but let's use save())
            v.finalPrice = newFinalPrice;
            v.indexedPrice = newFinalPrice;

            // Generate Combination Key if missing (Legacy)
            if (!v.combinationKey) {
                // ... same logic as Pre-Save hook or Service ...
                // For simplicity, just triggering save() runs the hook we wrote earlier!
                // The hook handles key generation.
            }

            await v.save();
            count++;
            if (count % 100 === 0) console.log(`Processed ${count}...`);
        }

        console.log('✅ Migration Complete');
        process.exit();
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
};

migrate();
