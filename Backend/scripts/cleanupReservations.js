
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import inventoryService from '../services/inventory.service.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name';

async function runCleanup() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        console.log('🧹 Starting cleanup of expired reservations...');
        const results = await inventoryService.cleanupExpiredReservations();

        if (results.length > 0) {
            console.log(`✅ Released stock for ${results.length} variants:`);
            results.forEach(r => {
                console.log(`   - SKU: ${r.sku}, Released: ${r.released}`);
            });
        } else {
            console.log('✅ No expired reservations found.');
        }

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected.');
        process.exit(0);
    }
}

runCleanup();
