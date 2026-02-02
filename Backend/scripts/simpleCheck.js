import mongoose from 'mongoose';
import inventoryService from '../services/inventory.service.js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const simpleCheck = async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
    const result = await inventoryService.getAllInventories({}, 1, 50);
    console.log(`\n\nCOUNT: ${result.total}\n\n`);
    await mongoose.connection.close();
};

simpleCheck();
