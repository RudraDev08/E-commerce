import mongoose from 'mongoose';
import ProductVariant from '../models/variant/productVariantSchema.js';
import inventoryService from '../services/inventory.service.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ========================================================================
 * INVENTORY MIGRATION SCRIPT
 * ========================================================================
 * 
 * PURPOSE:
 * - Auto-create inventory records for existing variants
 * - Ensures backward compatibility when adding inventory system
 * - Safe to run multiple times (skips variants that already have inventory)
 * 
 * USAGE:
 * node scripts/migrateInventory.js
 * ========================================================================
 */

const migrateInventory = async () => {
    try {
        console.log('🚀 Starting Inventory Migration...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zeno-panel');
        console.log('✅ Connected to MongoDB\n');

        // Get all variants
        const variants = await ProductVariant.find({}).lean();
        console.log(`📦 Found ${variants.length} variants\n`);

        if (variants.length === 0) {
            console.log('⚠️  No variants found. Nothing to migrate.');
            process.exit(0);
        }

        // Check which variants already have inventory
        const results = {
            total: variants.length,
            alreadyExists: 0,
            created: 0,
            failed: 0,
            details: []
        };

        console.log('🔄 Processing variants...\n');

        for (const variant of variants) {
            try {
                // Check if inventory already exists
                const hasInventory = await inventoryService.hasInventory(variant._id);

                if (hasInventory) {
                    results.alreadyExists++;
                    console.log(`⏭️  Skipped ${variant.sku} - Inventory already exists`);
                    continue;
                }

                // Create inventory
                await inventoryService.autoCreateInventoryForVariant(variant, 'MIGRATION_SCRIPT');
                results.created++;
                console.log(`✅ Created inventory for ${variant.sku}`);

                results.details.push({
                    sku: variant.sku,
                    status: 'created'
                });

            } catch (error) {
                results.failed++;
                console.error(`❌ Failed to create inventory for ${variant.sku}:`, error.message);

                results.details.push({
                    sku: variant.sku,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Variants:        ${results.total}`);
        console.log(`Already Exists:        ${results.alreadyExists}`);
        console.log(`Successfully Created:  ${results.created}`);
        console.log(`Failed:                ${results.failed}`);
        console.log('='.repeat(60) + '\n');

        if (results.failed > 0) {
            console.log('⚠️  Some inventories failed to create. Details:');
            results.details
                .filter(d => d.status === 'failed')
                .forEach(d => {
                    console.log(`   - ${d.sku}: ${d.error}`);
                });
            console.log('');
        }

        if (results.created > 0) {
            console.log(`✅ Successfully created ${results.created} inventory records!`);
        }

        if (results.alreadyExists === results.total) {
            console.log('✅ All variants already have inventory. Nothing to do!');
        }

        console.log('\n🎉 Migration completed!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
};

// Run migration
migrateInventory();
