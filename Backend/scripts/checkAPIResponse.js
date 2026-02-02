// Check API Logic directly
import mongoose from 'mongoose';
import inventoryService from '../services/inventory.service.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const checkAPI = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
        console.log('✅ Connected to MongoDB');

        // Call the exact same method the controller calls
        // getAllInventories(filters = {}, page = 1, limit = 50)
        const result = await inventoryService.getAllInventories({}, 1, 50);

        console.log('\n📊 API SIMULATION RESULT:');
        console.log(`Total Records Found: ${result.total}`);
        console.log(`Records Returned: ${result.inventories.length}`);

        console.log('\nFirst 5 Records:');
        result.inventories.slice(0, 5).forEach(inv => {
            console.log(`- SKU: ${inv.sku}, VariantId: ${inv.variantId?._id || inv.variantId}, Deleted: ${inv.isDeleted}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

checkAPI();
