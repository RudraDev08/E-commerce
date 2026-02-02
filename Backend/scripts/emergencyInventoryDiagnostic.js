// ========================================================================
// EMERGENCY DIAGNOSTIC: Why is Inventory ALWAYS Empty?
// ========================================================================
// Run this: node scripts/emergencyInventoryDiagnostic.js

import mongoose from 'mongoose';
import ProductVariant from '../models/variant/productVariantSchema.js';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import dotenv from 'dotenv';

dotenv.config();

const emergencyDiagnostic = async () => {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('🚨 EMERGENCY INVENTORY DIAGNOSTIC');
        console.log('='.repeat(80) + '\n');

        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zeno-panel');
        console.log('✅ Connected to MongoDB\n');

        // ========================================================================
        // 1. VERIFY DATABASE REALITY
        // ========================================================================
        console.log('📊 DATABASE STATE CHECK');
        console.log('-'.repeat(80));

        const variantCount = await ProductVariant.countDocuments();
        const inventoryCount = await InventoryMaster.countDocuments();

        console.log(`Variants in DB:     ${variantCount}`);
        console.log(`Inventory in DB:    ${inventoryCount}`);
        console.log(`Gap:                ${variantCount - inventoryCount} variants WITHOUT inventory\n`);

        if (variantCount === 0) {
            console.log('🟡 NO VARIANTS EXIST - Create variants first!\n');
            process.exit(0);
        }

        if (inventoryCount === variantCount) {
            console.log('🟢 ALL VARIANTS HAVE INVENTORY - Check API filters!\n');
            process.exit(0);
        }

        // ========================================================================
        // 2. SAMPLE DATA INSPECTION
        // ========================================================================
        console.log('🔍 SAMPLE DATA INSPECTION');
        console.log('-'.repeat(80));

        const sampleVariant = await ProductVariant.findOne().lean();
        console.log('\nSample Variant:');
        console.log(`  _id:        ${sampleVariant._id} (${typeof sampleVariant._id})`);
        console.log(`  SKU:        ${sampleVariant.sku}`);
        console.log(`  productId:  ${sampleVariant.productId} (${typeof sampleVariant.productId})`);
        console.log(`  sizeId:     ${sampleVariant.sizeId} (${typeof sampleVariant.sizeId})`);
        console.log(`  colorId:    ${sampleVariant.colorId} (${typeof sampleVariant.colorId})`);

        if (inventoryCount > 0) {
            const sampleInventory = await InventoryMaster.findOne().lean();
            console.log('\nSample Inventory:');
            console.log(`  _id:        ${sampleInventory._id}`);
            console.log(`  variantId:  ${sampleInventory.variantId} (${typeof sampleInventory.variantId})`);
            console.log(`  SKU:        ${sampleInventory.sku}`);
        }

        // ========================================================================
        // 3. FIND VARIANTS WITHOUT INVENTORY
        // ========================================================================
        console.log('\n🔎 FINDING VARIANTS WITHOUT INVENTORY');
        console.log('-'.repeat(80));

        const allVariantIds = await ProductVariant.find({}, '_id sku').lean();
        const allInventoryVariantIds = await InventoryMaster.find({}, 'variantId').lean();

        const inventoryVariantIdSet = new Set(
            allInventoryVariantIds.map(inv => inv.variantId.toString())
        );

        const missingInventory = allVariantIds.filter(
            v => !inventoryVariantIdSet.has(v._id.toString())
        );

        console.log(`\nVariants WITHOUT inventory: ${missingInventory.length}`);
        if (missingInventory.length > 0) {
            console.log('\nFirst 10 missing:');
            missingInventory.slice(0, 10).forEach((v, i) => {
                console.log(`  ${i + 1}. ${v.sku} (ID: ${v._id})`);
            });
        }

        // ========================================================================
        // 4. CHECK AUTO-CREATE INTEGRATION
        // ========================================================================
        console.log('\n🔧 AUTO-CREATE INTEGRATION CHECK');
        console.log('-'.repeat(80));

        const fs = await import('fs');
        const variantControllerPath = './controllers/variant/productVariantController.js';

        try {
            const controllerContent = fs.readFileSync(variantControllerPath, 'utf8');

            const hasInventoryImport = controllerContent.includes('inventoryService');
            const hasAutoCreate = controllerContent.includes('autoCreateInventoryForVariant');

            console.log(`\nVariant Controller Analysis:`);
            console.log(`  File exists:              ✅`);
            console.log(`  Imports inventoryService: ${hasInventoryImport ? '✅' : '❌'}`);
            console.log(`  Calls autoCreate:         ${hasAutoCreate ? '✅' : '❌'}`);

            if (!hasInventoryImport || !hasAutoCreate) {
                console.log('\n🔴 AUTO-CREATE NOT INTEGRATED!');
                console.log('   → New variants will NOT create inventory automatically');
            }
        } catch (err) {
            console.log(`  ⚠️  Could not read controller file`);
        }

        // ========================================================================
        // 5. CHECK MIGRATION SCRIPT
        // ========================================================================
        console.log('\n📦 MIGRATION SCRIPT CHECK');
        console.log('-'.repeat(80));

        const migrationPath = './scripts/migrateInventory.js';
        try {
            fs.accessSync(migrationPath);
            console.log(`\nMigration script exists: ✅ ${migrationPath}`);
            console.log(`Has it been run? ${inventoryCount > 0 ? 'Partially' : 'NO ❌'}`);
        } catch {
            console.log(`\nMigration script: ❌ NOT FOUND`);
            console.log(`  Expected location: ${migrationPath}`);
        }

        // ========================================================================
        // 6. ROOT CAUSE DETERMINATION
        // ========================================================================
        console.log('\n' + '='.repeat(80));
        console.log('🎯 ROOT CAUSE ANALYSIS');
        console.log('='.repeat(80) + '\n');

        if (variantCount > 0 && inventoryCount === 0) {
            console.log('🔴 ROOT CAUSE: VARIANTS CREATED BEFORE INVENTORY MODULE');
            console.log('\nExplanation:');
            console.log('  • Variants exist in database');
            console.log('  • Inventory collection is EMPTY');
            console.log('  • Auto-create only works for NEW variants');
            console.log('  • Old variants were never migrated');
            console.log('\n💡 SOLUTION: Run migration script to create inventory for existing variants');
            console.log('\n📝 COMMAND:');
            console.log('   node scripts/migrateInventory.js');
        } else if (variantCount > 0 && inventoryCount < variantCount) {
            console.log('🟡 ROOT CAUSE: PARTIAL MIGRATION');
            console.log('\nExplanation:');
            console.log(`  • ${inventoryCount} variants have inventory`);
            console.log(`  • ${variantCount - inventoryCount} variants are missing inventory`);
            console.log('  • Migration was incomplete or some variants added after migration');
            console.log('\n💡 SOLUTION: Re-run migration script (safe to run multiple times)');
            console.log('\n📝 COMMAND:');
            console.log('   node scripts/migrateInventory.js');
        }

        // ========================================================================
        // 7. VERIFICATION QUERIES
        // ========================================================================
        console.log('\n' + '='.repeat(80));
        console.log('📋 MONGODB VERIFICATION QUERIES');
        console.log('='.repeat(80) + '\n');

        console.log('// Check variant count');
        console.log('db.productvariants.countDocuments()\n');

        console.log('// Check inventory count');
        console.log('db.inventorymasters.countDocuments()\n');

        console.log('// Find variants without inventory');
        console.log(`db.productvariants.find({
  _id: { 
    $nin: db.inventorymasters.distinct('variantId') 
  }
}).limit(5)\n`);

        console.log('// Check for ObjectId type mismatches');
        console.log('db.inventorymasters.findOne({}, { variantId: 1 })\n');

        console.log('='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

emergencyDiagnostic();
