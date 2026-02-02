// Clean duplicates and complete migration
import mongoose from 'mongoose';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import ProductVariant from '../models/variant/productVariantSchema.js';
import Product from '../models/Product/ProductSchema.js';
import dotenv from 'dotenv';

dotenv.config();

const cleanAndMigrate = async () => {
    try {
        console.log('\n🧹 CLEANING DUPLICATES & COMPLETING MIGRATION\n');
        console.log('='.repeat(80));

        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Find and remove duplicate inventory records
        console.log('Step 1: Checking for duplicates...\n');

        const duplicates = await InventoryMaster.aggregate([
            { $group: { _id: '$variantId', count: { $sum: 1 }, ids: { $push: '$_id' } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        if (duplicates.length > 0) {
            console.log(`Found ${duplicates.length} duplicate variantIds\n`);

            for (const dup of duplicates) {
                // Keep first, delete rest
                const idsToDelete = dup.ids.slice(1);
                await InventoryMaster.deleteMany({ _id: { $in: idsToDelete } });
                console.log(`  Removed ${idsToDelete.length} duplicate(s) for variantId: ${dup._id}`);
            }
            console.log('');
        } else {
            console.log('No duplicates found\n');
        }

        // Step 2: Get all variants
        const variants = await ProductVariant.find({}).lean();
        console.log(`Step 2: Found ${variants.length} variants\n`);

        // Step 3: Create missing inventory
        let created = 0;
        let skipped = 0;
        let failed = 0;

        for (const variant of variants) {
            try {
                // Check if inventory exists
                const exists = await InventoryMaster.findOne({ variantId: variant._id });

                if (exists) {
                    skipped++;
                    continue;
                }

                // Get productId
                const productId = variant.productId || variant.product;

                if (!productId) {
                    console.log(`⚠️  Skipped ${variant.sku} - No product reference`);
                    failed++;
                    continue;
                }

                // Get product name
                const product = await Product.findById(productId).select('name').lean();

                // Extract attributes
                const variantAttributes = {
                    size: variant.attributes?.size || null,
                    color: variant.attributes?.color || null,
                    colorwayName: variant.colorwayName || null,
                    other: variant.attributes || {}
                };

                // Create inventory
                await InventoryMaster.create({
                    variantId: variant._id,
                    productId: productId,
                    sku: variant.sku,
                    productName: product?.name || 'Unknown Product',
                    variantAttributes,
                    totalStock: 0,
                    reservedStock: 0,
                    lowStockThreshold: 10,
                    stockStatus: 'out_of_stock',
                    costPrice: variant.costPrice || 0,
                    createdBy: 'MIGRATION_SCRIPT',
                    updatedBy: 'MIGRATION_SCRIPT'
                });

                created++;
                console.log(`✅ Created inventory for ${variant.sku}`);

            } catch (error) {
                failed++;
                console.error(`❌ Failed ${variant.sku}:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('📊 FINAL SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total Variants:        ${variants.length}`);
        console.log(`Successfully Created:  ${created}`);
        console.log(`Already Existed:       ${skipped}`);
        console.log(`Failed:                ${failed}`);
        console.log('='.repeat(80) + '\n');

        // Step 4: Verify final count
        const finalCount = await InventoryMaster.countDocuments();
        console.log(`✅ FINAL INVENTORY COUNT: ${finalCount}\n`);

        if (finalCount === variants.length) {
            console.log('🎉 SUCCESS! ALL VARIANTS NOW HAVE INVENTORY!\n');
        } else {
            console.log(`⚠️  Gap: ${variants.length - finalCount} variants still missing inventory\n`);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
};

cleanAndMigrate();
