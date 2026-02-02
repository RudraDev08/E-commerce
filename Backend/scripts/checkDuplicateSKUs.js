// Check for duplicate SKUs
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');

        const db = mongoose.connection.db;

        console.log('\n🔍 CHECKING FOR DUPLICATE SKUs\n');
        console.log('='.repeat(80));

        // Check variants for duplicate SKUs
        const variantDuplicates = await db.collection('productvariants').aggregate([
            { $group: { _id: '$sku', count: { $sum: 1 }, ids: { $push: '$_id' } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();

        console.log(`\nDuplicate SKUs in Variants: ${variantDuplicates.length}`);
        if (variantDuplicates.length > 0) {
            variantDuplicates.forEach(d => {
                console.log(`  - ${d._id}: ${d.count} times`);
            });
        }

        // Check inventory for duplicate SKUs
        const inventoryDuplicates = await db.collection('inventorymasters').aggregate([
            { $group: { _id: '$sku', count: { $sum: 1 }, ids: { $push: '$_id' } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();

        console.log(`\nDuplicate SKUs in Inventory: ${inventoryDuplicates.length}`);
        if (inventoryDuplicates.length > 0) {
            inventoryDuplicates.forEach(d => {
                console.log(`  - ${d._id}: ${d.count} times`);
            });
        }

        // List all inventory SKUs
        const allInventory = await db.collection('inventorymasters').find({}, { sku: 1, variantId: 1 }).toArray();
        console.log(`\n📋 ALL INVENTORY RECORDS (${allInventory.length}):\n`);
        allInventory.forEach((inv, i) => {
            console.log(`${i + 1}. SKU: ${inv.sku}, variantId: ${inv.variantId}`);
        });

        // List all variant SKUs
        const allVariants = await db.collection('productvariants').find({}, { sku: 1, _id: 1 }).toArray();
        console.log(`\n📦 ALL VARIANT SKUs (${allVariants.length}):\n`);
        allVariants.forEach((v, i) => {
            console.log(`${i + 1}. SKU: ${v.sku}, _id: ${v._id}`);
        });

        // Find variants without inventory
        const variantIds = allVariants.map(v => v._id.toString());
        const inventoryVariantIds = allInventory.map(inv => inv.variantId.toString());
        const missing = variantIds.filter(id => !inventoryVariantIds.includes(id));

        console.log(`\n❌ VARIANTS WITHOUT INVENTORY (${missing.length}):\n`);
        missing.forEach(id => {
            const variant = allVariants.find(v => v._id.toString() === id);
            console.log(`  - ${variant.sku} (${id})`);
        });

        console.log('\n' + '='.repeat(80) + '\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

checkDuplicates();
