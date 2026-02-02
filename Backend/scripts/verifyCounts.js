// Verify Actual Database Counts
import mongoose from 'mongoose';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import ProductVariant from '../models/variant/productVariantSchema.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const verifyCounts = async () => {
    try {
        console.log('\n📊 DATABASE COUNT VERIFICATION\n');
        console.log('='.repeat(50));

        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
        console.log('✅ Connected to MongoDB\n');

        const variantCount = await ProductVariant.countDocuments();
        const inventoryCount = await InventoryMaster.countDocuments();

        // Check for duplicates/phantom data in inventory
        const inventoryDuplicates = await InventoryMaster.aggregate([
            { $group: { _id: "$variantId", count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        console.log(`Variants (productvariants):   ${variantCount}`);
        console.log(`Inventory (inventorymasters): ${inventoryCount}`);
        console.log('='.repeat(50));

        if (variantCount !== inventoryCount) {
            console.log(`❌ MISMATCH DETECTED: Gap of ${Math.abs(inventoryCount - variantCount)}`);
        } else {
            console.log(`✅ MATCH: Counts are synced.`);
        }

        if (inventoryDuplicates.length > 0) {
            console.log(`\n❌ DUPLICATES FOUND IN INVENTORY: ${inventoryDuplicates.length}`);
            console.log(inventoryDuplicates);
        } else {
            console.log(`\n✅ NO duplicates found in inventory.`);
        }

        console.log('\nSample Inventory Records (First 5):');
        const samples = await InventoryMaster.find().limit(5).select('sku productName totalStock variantId').lean();
        console.table(samples);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

verifyCounts();
