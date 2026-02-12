import mongoose from 'mongoose';
import Variant from '../models/variant/variantSchema.js';
import inventoryService from '../services/inventory.service.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateInventory = async () => {
    try {
        console.log('🚀 Starting Inventory Migration...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
        console.log('✅ Connected to MongoDB\n');

        // Get all variants
        const variants = await Variant.find({}).lean();
        console.log(`📦 Found ${variants.length} variants\n`);

        if (variants.length === 0) {
            console.log('⚠️  No variants found. Nothing to migrate.');
            process.exit(0);
        }

        const results = {
            total: variants.length,
            processed: 0,
            failed: 0
        };

        console.log('🔄 Processing variants...\n');

        for (const variant of variants) {
            try {
                // initializeInventory is self-healing: creates if missing, returns existing if found
                await inventoryService.initializeInventory(variant._id);
                results.processed++;
                if (results.processed % 10 === 0) {
                    console.log(`  Processed ${results.processed}/${variants.length}...`);
                }
            } catch (error) {
                results.failed++;
                console.error(`❌ Failed for ${variant.sku || variant._id}:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Variants:        ${results.total}`);
        console.log(`Processed:             ${results.processed}`);
        console.log(`Failed:                ${results.failed}`);
        console.log('='.repeat(60) + '\n');

        console.log('\n🎉 Migration completed!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

migrateInventory();
