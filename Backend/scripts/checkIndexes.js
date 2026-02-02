// Check database indexes
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');

        const db = mongoose.connection.db;

        console.log('\n📋 INVENTORY MASTER INDEXES:\n');
        const indexes = await db.collection('inventorymasters').indexes();
        indexes.forEach(idx => {
            console.log(`Index: ${idx.name}`);
            console.log(`  Keys: ${JSON.stringify(idx.key)}`);
            console.log(`  Unique: ${idx.unique || false}`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

checkIndexes();
