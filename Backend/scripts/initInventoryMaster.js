import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Variant from '../models/Variant/VariantSchema.js';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import Product from '../models/Product/ProductSchema.js'; // Ensure connection

dotenv.config();

const initInventory = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zeno-panel');
        console.log('✅ Connected.');

        console.log('📦 Fetching all Variants...');
        const variants = await Variant.find().populate('product');
        console.log(`🔍 Found ${variants.length} variants.`);

        let created = 0;
        let existing = 0;
        let errors = 0;

        for (const v of variants) {
            try {
                if (!v.product) {
                    console.warn(`⚠️ Variant ${v.sku} has no product! Skipping.`);
                    continue;
                }

                const exists = await InventoryMaster.findOne({ variantId: v._id });
                if (exists) {
                    existing++;
                    // Optionally update metadata if needed
                    continue;
                }

                // Create new InventoryMaster
                // We initialize stock to 0 as we don't have legacy stock source anymore (safest bet)
                // OR we could check if v.stock exists in the raw document if we really wanted to, but let's stick to 0 for Clean Architecture.

                await InventoryMaster.create({
                    variantId: v._id,
                    productId: v.product._id,
                    sku: v.sku,
                    totalStock: 0,
                    reservedStock: 0,
                    status: 'OUT_OF_STOCK'
                });

                created++;
                process.stdout.write('.');
            } catch (err) {
                console.error(`\n❌ Error processing ${v.sku}:`, err.message);
                errors++;
            }
        }

        console.log('\n\n📊 Summary:');
        console.log(`   Existing: ${existing}`);
        console.log(`   Created:  ${created}`);
        console.log(`   Errors:   ${errors}`);

        console.log('🎉 Done.');
        process.exit(0);

    } catch (err) {
        console.error('Fatal Error:', err);
        process.exit(1);
    }
};

initInventory();
