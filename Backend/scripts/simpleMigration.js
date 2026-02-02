import mongoose from 'mongoose';
import ProductVariant from '../models/variant/productVariantSchema.js';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import Product from '../models/Product/ProductSchema.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * SIMPLE, ROBUST MIGRATION - Create inventory without ledger entries
 */
const simpleMigration = async () => {
    try {
        console.log('\n🚀 Starting Simple Inventory Migration...\n');
        console.log('='.repeat(80));

        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
        console.log('✅ Connected to MongoDB\n');

        // Get all variants
        const variants = await ProductVariant.find({}).lean();
        console.log(`📦 Found ${variants.length} variants\n`);

        if (variants.length === 0) {
            console.log('⚠️  No variants found.');
            process.exit(0);
        }

        let created = 0;
        let skipped = 0;
        let failed = 0;

        for (const variant of variants) {
            try {
                // Check if inventory already exists
                const exists = await InventoryMaster.findOne({ variantId: variant._id });

                if (exists) {
                    skipped++;
                    console.log(`⏭️  Skipped ${variant.sku} - Already exists`);
                    continue;
                }

                // Get productId (handle both old and new schema)
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

                // Create inventory (WITHOUT ledger entry to avoid validation errors)
                const inventory = await InventoryMaster.create({
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
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total Variants:        ${variants.length}`);
        console.log(`Successfully Created:  ${created}`);
        console.log(`Already Existed:       ${skipped}`);
        console.log(`Failed:                ${failed}`);
        console.log('='.repeat(80) + '\n');

        if (created > 0) {
            console.log(`✅ Successfully created ${created} inventory records!`);
        }

        if (created + skipped === variants.length) {
            console.log('🎉 ALL VARIANTS NOW HAVE INVENTORY!\n');
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

simpleMigration();
