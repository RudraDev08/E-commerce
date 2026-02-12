// FINAL MIGRATION - Create inventory for all missing variants
import mongoose from 'mongoose';
import InventoryMaster from '../src/modules/inventory/inventory.model.js';
import ProductVariant from '../models/variant/variantSchema.js';
import Product from '../src/modules/product/product.model.js';
import dotenv from 'dotenv';

dotenv.config();

const finalMigration = async () => {
    try {
        console.log('\n🚀 FINAL MIGRATION - Creating Inventory for All Variants\n');
        console.log('='.repeat(80));

        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
        console.log('✅ Connected to MongoDB\n');

        // Get all variants
        const variants = await ProductVariant.find({}).lean();
        console.log(`📦 Total Variants: ${variants.length}\n`);

        let created = 0;
        let skipped = 0;
        let errors = [];

        for (const variant of variants) {
            try {
                // Check if inventory already exists for this variant
                const exists = await InventoryMaster.findOne({ variantId: variant._id });

                if (exists) {
                    skipped++;
                    continue;
                }

                // Get productId (handle both old and new schema)
                const productId = variant.productId || variant.product;

                if (!productId) {
                    errors.push({ sku: variant.sku, error: 'No product reference' });
                    continue;
                }

                // Get product name
                const product = await Product.findById(productId).select('name').lean();

                // Extract attributes (handle both Map and plain object)
                const variantAttributes = {
                    size: variant.attributes?.size || null,
                    color: variant.attributes?.color || null,
                    colorwayName: variant.colorwayName || null,
                    other: variant.attributes || {}
                };

                // Create inventory record
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
                    createdBy: 'FINAL_MIGRATION',
                    updatedBy: 'FINAL_MIGRATION'
                });

                created++;
                console.log(`✅ ${created}. Created: ${variant.sku}`);

            } catch (error) {
                // Handle duplicate key errors gracefully
                if (error.code === 11000) {
                    // Duplicate - check if it's SKU or variantId
                    if (error.message.includes('sku')) {
                        errors.push({ sku: variant.sku, error: 'Duplicate SKU in inventory' });
                    } else if (error.message.includes('variantId')) {
                        skipped++; // Already exists
                    } else {
                        errors.push({ sku: variant.sku, error: error.message });
                    }
                } else {
                    errors.push({ sku: variant.sku, error: error.message });
                }
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('📊 MIGRATION RESULTS');
        console.log('='.repeat(80));
        console.log(`Total Variants:       ${variants.length}`);
        console.log(`Created:              ${created}`);
        console.log(`Already Existed:      ${skipped}`);
        console.log(`Errors:               ${errors.length}`);
        console.log('='.repeat(80));

        if (errors.length > 0) {
            console.log('\n❌ ERRORS:\n');
            errors.forEach((err, i) => {
                console.log(`${i + 1}. ${err.sku}: ${err.error}`);
            });
            console.log('');
        }

        // Final verification
        const inventoryCount = await InventoryMaster.countDocuments();
        const variantCount = await ProductVariant.countDocuments();

        console.log('='.repeat(80));
        console.log('✅ FINAL STATUS');
        console.log('='.repeat(80));
        console.log(`Variants:   ${variantCount}`);
        console.log(`Inventory:  ${inventoryCount}`);
        console.log(`Gap:        ${variantCount - inventoryCount}`);
        console.log('='.repeat(80) + '\n');

        if (inventoryCount === variantCount) {
            console.log('🎉 SUCCESS! ALL VARIANTS NOW HAVE INVENTORY!\n');
        } else {
            console.log(`⚠️  ${variantCount - inventoryCount} variants still need inventory\n`);
        }

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Disconnected from MongoDB\n');
        process.exit(0);
    }
};

finalMigration();
