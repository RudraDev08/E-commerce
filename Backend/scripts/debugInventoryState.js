import mongoose from 'mongoose';
import ProductVariant from '../models/variant/productVariantSchema.js';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ========================================================================
 * INVENTORY STATE DEBUGGER
 * ========================================================================
 * Diagnoses why inventory page shows 0 records
 * ========================================================================
 */

const debugInventoryState = async () => {
    try {
        console.log('\n' + '='.repeat(70));
        console.log('🔍 INVENTORY STATE DEBUGGER');
        console.log('='.repeat(70) + '\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zeno-panel');
        console.log('✅ Connected to MongoDB\n');

        // 1. Count Variants
        console.log('📦 CHECKING VARIANTS...');
        const variantCount = await ProductVariant.countDocuments();
        console.log(`   Total Variants in DB: ${variantCount}`);

        if (variantCount > 0) {
            const sampleVariant = await ProductVariant.findOne().lean();
            console.log(`   Sample Variant SKU: ${sampleVariant?.sku || 'N/A'}`);
            console.log(`   Sample Variant ID: ${sampleVariant?._id || 'N/A'}`);
        }

        // 2. Count Inventory
        console.log('\n📊 CHECKING INVENTORY...');
        const inventoryCount = await InventoryMaster.countDocuments();
        console.log(`   Total Inventory Records: ${inventoryCount}`);

        if (inventoryCount > 0) {
            const sampleInventory = await InventoryMaster.findOne().lean();
            console.log(`   Sample Inventory SKU: ${sampleInventory?.sku || 'N/A'}`);
            console.log(`   Sample Inventory Variant ID: ${sampleInventory?.variantId || 'N/A'}`);
        }

        // 3. Gap Analysis
        console.log('\n🔍 GAP ANALYSIS...');
        const gap = variantCount - inventoryCount;

        if (gap === 0 && variantCount === 0) {
            console.log('   ⚠️  No variants exist yet. Create variants first.');
        } else if (gap === 0 && variantCount > 0) {
            console.log('   ✅ All variants have inventory records!');
        } else if (gap > 0) {
            console.log(`   ❌ PROBLEM FOUND: ${gap} variants are MISSING inventory records!`);
            console.log(`   📌 This is why your inventory page shows 0 records.`);
        } else {
            console.log(`   ⚠️  WARNING: More inventory than variants (${Math.abs(gap)} extra)`);
        }

        // 4. Find Variants Without Inventory
        if (gap > 0) {
            console.log('\n🔎 FINDING VARIANTS WITHOUT INVENTORY...');

            const allVariants = await ProductVariant.find({}, '_id sku').lean();
            const allInventories = await InventoryMaster.find({}, 'variantId').lean();

            const inventoryVariantIds = new Set(
                allInventories.map(inv => inv.variantId.toString())
            );

            const missingVariants = allVariants.filter(
                variant => !inventoryVariantIds.has(variant._id.toString())
            );

            console.log(`   Found ${missingVariants.length} variants without inventory:`);

            // Show first 5 examples
            missingVariants.slice(0, 5).forEach((variant, index) => {
                console.log(`   ${index + 1}. SKU: ${variant.sku} | ID: ${variant._id}`);
            });

            if (missingVariants.length > 5) {
                console.log(`   ... and ${missingVariants.length - 5} more`);
            }
        }

        // 5. Check Auto-Create Integration
        console.log('\n🔧 CHECKING AUTO-CREATE INTEGRATION...');
        const variantControllerPath = './controllers/variant/productVariantController.js';
        console.log(`   Check if ${variantControllerPath} calls inventoryService.autoCreateInventoryForVariant()`);
        console.log(`   ✅ If yes: Auto-create is enabled for NEW variants`);
        console.log(`   ❌ If no: Auto-create is NOT enabled`);

        // 6. Diagnosis Summary
        console.log('\n' + '='.repeat(70));
        console.log('📋 DIAGNOSIS SUMMARY');
        console.log('='.repeat(70));

        if (variantCount === 0) {
            console.log('\n🟡 STATUS: No variants exist yet');
            console.log('   ACTION: Create variants first, inventory will auto-create');
        } else if (gap === 0) {
            console.log('\n🟢 STATUS: All variants have inventory');
            console.log('   ACTION: Check API endpoint and frontend filters');
        } else if (gap > 0) {
            console.log('\n🔴 STATUS: Inventory records are MISSING');
            console.log(`   PROBLEM: ${gap} variants created BEFORE inventory module existed`);
            console.log('   ACTION: Run migration script to create missing inventory');
            console.log('\n   RUN THIS COMMAND:');
            console.log('   → node scripts/migrateInventory.js');
        }

        console.log('\n' + '='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Disconnected from MongoDB\n');
        process.exit(0);
    }
};

// Run debugger
debugInventoryState();
