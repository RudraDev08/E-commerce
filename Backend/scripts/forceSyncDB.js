// FORCE SYNC DB - Retry with robust handling
import mongoose from 'mongoose';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import ProductVariant from '../models/variant/productVariantSchema.js';
import Product from '../models/Product/ProductSchema.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const forceSync = async () => {
    try {
        console.log('\n🧹 FORCE SYNC OPERATION (RETRY)\n');

        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
        console.log('✅ Connected to MongoDB\n');

        // 1. Get all variants
        const allVariants = await ProductVariant.find({}).sort({ createdAt: -1 });
        console.log(`Found ${allVariants.length} total variants in DB.`);

        let remainingVariants = [];

        if (allVariants.length <= 2) {
            console.log('✅ Count is already 2 or less.');
            remainingVariants = allVariants;
        } else {
            // 2. Identify variants to keep and delete
            const toKeep = allVariants.slice(0, 2);
            const toDelete = allVariants.slice(2);

            const deleteIds = toDelete.map(v => v._id);

            console.log(`Keeping 2 newest variants:`);
            toKeep.forEach(v => console.log(`  - ${v.sku} (${v._id})`));

            console.log(`\nDeleting ${deleteIds.length} old variants...`);
            await ProductVariant.deleteMany({ _id: { $in: deleteIds } });
            console.log('✅ Variants deleted.');

            remainingVariants = toKeep;
        }

        // 3. Clear Inventory
        console.log('\nCleaning Inventory...');
        await InventoryMaster.deleteMany({});
        console.log('✅ Inventory cleared.');

        // 4. Re-create Inventory
        console.log(`\nRe-creating inventory for ${remainingVariants.length} variants...`);

        let created = 0;
        for (const variant of remainingVariants) {
            // Handle both ID naming conventions
            let pid = variant.productId || variant.product;

            // If still missing, try to find ANY product to link content to (Emergency fallback)
            if (!pid) {
                const anyProduct = await Product.findOne();
                if (anyProduct) {
                    console.log(`⚠️  Variant ${variant.sku} missing productId. Linking to fallback: ${anyProduct.name}`);
                    pid = anyProduct._id;
                } else {
                    console.error(`❌ CANNOT CREATE STOCK: No products exist in DB!`);
                    continue;
                }
            }

            const product = await Product.findById(pid).select('name');

            const variantAttributes = {
                size: variant.attributes?.size || null,
                color: variant.attributes?.color || null,
                other: variant.attributes || {}
            };

            try {
                await InventoryMaster.create({
                    variantId: variant._id,
                    productId: pid,
                    sku: variant.sku,
                    productName: product?.name || 'Unknown Product',
                    variantAttributes,
                    totalStock: 0,
                    reservedStock: 0,
                    stockStatus: 'out_of_stock',
                    createdBy: 'FORCE_SYNC'
                });
                created++;
                console.log(`✅ Created: ${variant.sku}`);
            } catch (err) {
                console.error(`❌ Failed to create ${variant.sku}: ${err.message}`);
            }
        }

        // 5. Final Verification
        const finalV = await ProductVariant.countDocuments();
        const finalI = await InventoryMaster.countDocuments();

        console.log('\n' + '='.repeat(50));
        console.log(`🎉 FINAL STATE:`);
        console.log(`Variants:  ${finalV}`);
        console.log(`Inventory: ${finalI}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

forceSync();
