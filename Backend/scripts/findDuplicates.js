// Find and fix duplicates
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const findDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');

        const db = mongoose.connection.db;

        console.log('\n🔍 CHECKING FOR DUPLICATES\n');
        console.log('='.repeat(80));

        // Check for duplicate SKUs in inventory
        const duplicateSKUs = await db.collection('inventorymasters').aggregate([
            { $group: { _id: '$sku', count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();

        console.log(`\nDuplicate SKUs in inventory: ${duplicateSKUs.length}`);
        if (duplicateSKUs.length > 0) {
            duplicateSKUs.forEach(d => console.log(`  - ${d._id} (${d.count} times)`));
        }

        // Check for duplicate variantIds in inventory
        const duplicateVariants = await db.collection('inventorymasters').aggregate([
            { $group: { _id: '$variantId', count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();

        console.log(`\nDuplicate variantIds in inventory: ${duplicateVariants.length}`);
        if (duplicateVariants.length > 0) {
            duplicateVariants.forEach(d => console.log(`  - ${d._id} (${d.count} times)`));
        }

        // Check for duplicate productIds in inventory
        const duplicateProducts = await db.collection('inventorymasters').aggregate([
            { $group: { _id: '$productId', count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();

        console.log(`\nDuplicate productIds in inventory: ${duplicateProducts.length}`);

        // List all inventory records
        const allInventory = await db.collection('inventorymasters').find({}, { sku: 1, variantId: 1, productId: 1 }).toArray();
        console.log(`\n📋 ALL INVENTORY RECORDS (${allInventory.length}):\n`);
        allInventory.forEach((inv, i) => {
            console.log(`${i + 1}. SKU: ${inv.sku}, variantId: ${inv.variantId}, productId: ${inv.productId}`);
        });

        console.log('\n' + '='.repeat(80) + '\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

findDuplicates();
