// Find mismatch between Inventory and Variants
import mongoose from 'mongoose';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import ProductVariant from '../models/variant/productVariantSchema.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const diagnose = async () => {
    try {
        console.log('\n🕵️ DATA MISMATCH DIAGNOSTIC\n');
        console.log('='.repeat(50));

        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');

        // 1. Get all IDs
        const allVariants = await ProductVariant.find({}, '_id sku').lean();
        const allInventory = await InventoryMaster.find({}, '_id variantId sku').lean();

        const variantIds = new Set(allVariants.map(v => v._id.toString()));
        const inventoryVariantIds = new Set(allInventory.map(i => i.variantId.toString()));

        console.log(`\n📦 VARIANTS (${allVariants.length}):`);
        // allVariants.forEach(v => console.log(`  - ${v.sku} (${v._id})`));

        console.log(`\n📋 INVENTORY (${allInventory.length}):`);
        // allInventory.forEach(i => console.log(`  - ${i.sku} (${i.variantId})`));

        // 2. Find Orphans (Inventory has ID, but Variant doesn't exist)
        const orphans = allInventory.filter(i => !variantIds.has(i.variantId.toString()));

        if (orphans.length > 0) {
            console.log(`\n❌ ORPHAN INVENTORY RECORDS (${orphans.length}):`);
            console.log(`(These exists in Inventory but NOT in Variants - User deleted variant manually?)`);
            orphans.forEach(i => console.log(`  - SKU: ${i.sku}, VariantId: ${i.variantId}`));
        } else {
            console.log(`\n✅ No orphan inventory records.`);
        }

        // 3. Find Missing (Variant exists, but Inventory doesn't)
        const missing = allVariants.filter(v => !inventoryVariantIds.has(v._id.toString()));

        if (missing.length > 0) {
            console.log(`\n❌ MISSING INVENTORY RECORDS (${missing.length}):`);
            console.log(`(These Variants have NO Inventory record)`);
            missing.forEach(v => console.log(`  - SKU: ${v.sku}, ID: ${v._id}`));
        } else {
            console.log(`\n✅ No missing inventory records.`);
        }

        // 4. Duplicate Check
        const inventoryByVariant = {};
        allInventory.forEach(i => {
            const vid = i.variantId.toString();
            inventoryByVariant[vid] = (inventoryByVariant[vid] || 0) + 1;
        });

        const duplicates = Object.entries(inventoryByVariant).filter(([k, v]) => v > 1);

        if (duplicates.length > 0) {
            console.log(`\n❌ DUPLICATE INVENTORY FOR SAME VARIANT (${duplicates.length}):`);
            duplicates.forEach(([vid, count]) => console.log(`  - VariantId ${vid}: ${count} records`));
        } else {
            console.log(`\n✅ No duplicate inventory records.`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

diagnose();
