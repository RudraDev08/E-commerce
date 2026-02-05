
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';

dotenv.config();

const clean = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zeno-panel');
        console.log('Cleaning InventoryMaster...');
        await InventoryMaster.collection.drop(); // Drop the whole collection to remove indexes and data
        console.log('✅ Dropped collection.');
    } catch (e) {
        console.log('Error dropping (maybe didn\'t exist):', e.message);
    } finally {
        process.exit();
    }
};

clean();
