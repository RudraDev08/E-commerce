// Check variant structure
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkVariantStructure = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');

        const db = mongoose.connection.db;
        const variant = await db.collection('productvariants').findOne();

        console.log('\n📋 VARIANT STRUCTURE:\n');
        console.log(JSON.stringify(variant, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

checkVariantStructure();
