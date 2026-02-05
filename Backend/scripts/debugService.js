
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import inventoryService from '../services/inventory.service.js';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import Variant from '../models/variant/variantSchema.js';
import Product from '../models/Product/ProductSchema.js'; // Ensure Product is registered

dotenv.config();

const test = async () => {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zeno-panel');
        console.log('Connected to DB');

        console.log('Testing getAllInventoryMasters...');
        const result = await inventoryService.getAllInventoryMasters({}, 1, 10);
        console.log('Success!');
        console.log('Total:', result.total);
        console.log('First Item:', JSON.stringify(result.inventories[0], null, 2));

    } catch (error) {
        console.error('FAILED:', error);
    } finally {
        process.exit();
    }
};

test();
