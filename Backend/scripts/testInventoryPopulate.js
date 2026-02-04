import mongoose from 'mongoose';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import Product from '../models/Product/ProductSchema.js';
import ProductVariant from '../models/variant/productVariantSchema.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

async function testInventoryPopulate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Count total records
        const totalInventory = await InventoryMaster.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalVariants = await ProductVariant.countDocuments();

        console.log('📊 DATABASE OVERVIEW:');
        console.log(`   Inventory Records: ${totalInventory}`);
        console.log(`   Products: ${totalProducts}`);
        console.log(`   Variants: ${totalVariants}\n`);

        // 2. Check soft-deleted records
        const deletedProducts = await Product.countDocuments({ isDeleted: true });
        const deletedVariants = await ProductVariant.countDocuments({ isDeleted: true });
        const activeProducts = await Product.countDocuments({ isDeleted: false });
        const activeVariants = await ProductVariant.countDocuments({ isDeleted: false });

        console.log('🗑️  SOFT-DELETED RECORDS:');
        console.log(`   Deleted Products: ${deletedProducts}`);
        console.log(`   Deleted Variants: ${deletedVariants}`);
        console.log(`   Active Products: ${activeProducts}`);
        console.log(`   Active Variants: ${activeVariants}\n`);

        // 3. Test inventory populate
        console.log('🔍 TESTING INVENTORY POPULATE (First 10 records):\n');

        const inventories = await InventoryMaster.find()
            .populate('productId')
            .populate('variantId')
            .limit(10)
            .lean();

        if (inventories.length === 0) {
            console.log('❌ No inventory records found!\n');
        } else {
            inventories.forEach((inv, index) => {
                const hasProduct = inv.productId && typeof inv.productId === 'object';
                const hasVariant = inv.variantId && typeof inv.variantId === 'object';

                console.log(`${index + 1}. SKU: ${inv.sku}`);
                console.log(`   Product: ${hasProduct ? `✅ ${inv.productId.name}` : '❌ NULL (Not found or deleted)'}`);
                console.log(`   Variant: ${hasVariant ? `✅ ${inv.variantId.sku}` : '❌ NULL (Not found or deleted)'}`);
                console.log(`   Stock: ${inv.totalStock} (Available: ${inv.availableStock})`);
                console.log(`   Status: ${inv.stockStatus}\n`);
            });
        }

        // 4. Check for broken references
        const brokenRefs = inventories.filter(inv =>
            !inv.productId || typeof inv.productId !== 'object' ||
            !inv.variantId || typeof inv.variantId !== 'object'
        );

        console.log(`⚠️  BROKEN REFERENCES: ${brokenRefs.length}/${inventories.length}\n`);

        if (brokenRefs.length > 0) {
            console.log('❌ Inventory records with broken references:');
            brokenRefs.forEach(inv => {
                console.log(`   SKU: ${inv.sku}`);
                console.log(`   ProductId exists: ${!!inv.productId}`);
                console.log(`   VariantId exists: ${!!inv.variantId}\n`);
            });
        }

        // 5. Check if referenced products/variants are deleted
        if (brokenRefs.length > 0) {
            console.log('🔍 CHECKING IF REFERENCED RECORDS ARE SOFT-DELETED:\n');

            for (const inv of brokenRefs) {
                if (inv.productId && typeof inv.productId === 'string') {
                    const product = await Product.findById(inv.productId);
                    if (product && product.isDeleted) {
                        console.log(`   ⚠️  Product ${product.name} (${inv.productId}) is SOFT-DELETED`);
                    }
                }

                if (inv.variantId && typeof inv.variantId === 'string') {
                    const variant = await ProductVariant.findById(inv.variantId);
                    if (variant && variant.isDeleted) {
                        console.log(`   ⚠️  Variant ${variant.sku} (${inv.variantId}) is SOFT-DELETED`);
                    }
                }
            }
            console.log('');
        }

        // 6. Summary
        console.log('📋 SUMMARY:');
        console.log(`   Total Inventory: ${totalInventory}`);
        console.log(`   Valid Populates: ${inventories.length - brokenRefs.length}/${inventories.length}`);
        console.log(`   Broken References: ${brokenRefs.length}`);
        console.log(`   Soft-Deleted Products: ${deletedProducts}`);
        console.log(`   Soft-Deleted Variants: ${deletedVariants}\n`);

        if (deletedProducts > 0 || deletedVariants > 0) {
            console.log('💡 RECOMMENDATION:');
            console.log('   Products/Variants are soft-deleted. To fix:');
            console.log('   1. Restore them in admin panel, OR');
            console.log('   2. Run: node scripts/restoreSoftDeleted.js\n');
        }

        await mongoose.disconnect();
        console.log('✅ Diagnostic complete\n');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testInventoryPopulate();
