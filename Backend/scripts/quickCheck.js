// Quick check
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const quickCheck = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');

        const db = mongoose.connection.db;

        const variantCount = await db.collection('productvariants').countDocuments();
        const inventoryCount = await db.collection('inventorymasters').countDocuments();

        console.log('\n📊 QUICK CHECK:\n');
        console.log(`Variants:   ${variantCount}`);
        console.log(`Inventory:  ${inventoryCount}`);
        console.log(`Gap:        ${variantCount - inventoryCount}\n`);

        if (inventoryCount > 0) {
            console.log('✅ Inventory exists! Checking Inventory Master page...\n');
        } else {
            console.log('❌ No inventory created yet\n');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

quickCheck();
