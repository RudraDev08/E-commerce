const mongoose = require('mongoose');
require('dotenv').config();

// Import models
// Import models
const Variant = require('../models/masters/VariantMaster.enterprise.js').default || require('../models/masters/VariantMaster.enterprise.js');
const Color = require('../models/masters/ColorMaster.enterprise.js').default || require('../models/masters/ColorMaster.enterprise.js');

/**
 * Migration Script: Convert variant attributes from 'color' to 'colorId'
 * 
 * This script:
 * 1. Finds all variants with 'color' attribute (string name)
 * 2. Looks up the color in Color Master by name
 * 3. Replaces 'color' with 'colorId' (Color Master _id)
 * 4. Renames 'size' to 'storage' for electronics (GB/TB values)
 */

async function migrateVariantAttributes() {
    try {
        console.log('🔄 Starting variant attribute migration...\n');

        // Get all variants
        const variants = await Variant.find({});
        console.log(`Found ${variants.length} variants to migrate\n`);

        let migratedCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (const variant of variants) {
            try {
                const updates = {};
                const unset = {};
                let needsUpdate = false;

                // ================================================================
                // MIGRATION 1: 'color' (string) → 'colorId' (ObjectId)
                // ================================================================
                if (variant.attributes?.color) {
                    const colorName = variant.attributes.color;

                    // Find color in Color Master by name (case-insensitive)
                    const colorObj = await Color.findOne({
                        name: { $regex: new RegExp(`^${colorName}$`, 'i') },
                        isDeleted: false
                    });

                    if (colorObj) {
                        // Replace color name with colorId
                        updates['attributes.colorId'] = colorObj._id;
                        unset['attributes.color'] = 1;
                        needsUpdate = true;
                        console.log(`✅ ${variant.sku}: "${colorName}" → colorId: ${colorObj._id}`);
                    } else {
                        console.warn(`⚠️  ${variant.sku}: Color "${colorName}" not found in Color Master - SKIPPING`);
                        errorCount++;
                        continue; // Skip this variant
                    }
                }

                // ================================================================
                // MIGRATION 2: 'size' → 'storage' (for electronics with GB/TB)
                // ================================================================
                if (variant.attributes?.size) {
                    const sizeValue = variant.attributes.size;

                    // Check if it's storage (contains GB or TB)
                    if (sizeValue.includes('GB') || sizeValue.includes('TB')) {
                        updates['attributes.storage'] = sizeValue;
                        unset['attributes.size'] = 1;
                        needsUpdate = true;
                        console.log(`✅ ${variant.sku}: size → storage: ${sizeValue}`);
                    } else {
                        // It's actual size (S, M, L, XL) - keep as is
                        console.log(`ℹ️  ${variant.sku}: Keeping size attribute: ${sizeValue}`);
                    }
                }

                // ================================================================
                // Apply updates
                // ================================================================
                if (needsUpdate) {
                    const updateQuery = { ...updates };
                    if (Object.keys(unset).length > 0) {
                        updateQuery.$unset = unset;
                    }

                    await Variant.updateOne({ _id: variant._id }, updateQuery);
                    migratedCount++;
                } else {
                    skippedCount++;
                }

            } catch (err) {
                console.error(`❌ Error migrating variant ${variant.sku}:`, err.message);
                errorCount++;
            }
        }

        // ================================================================
        // Summary
        // ================================================================
        console.log('\n' + '='.repeat(60));
        console.log('📊 Migration Summary:');
        console.log('='.repeat(60));
        console.log(`   Total variants:     ${variants.length}`);
        console.log(`   ✅ Migrated:        ${migratedCount}`);
        console.log(`   ⚠️  Errors:          ${errorCount}`);
        console.log(`   ℹ️  Skipped:         ${skippedCount}`);
        console.log('='.repeat(60));

        if (errorCount > 0) {
            console.log('\n⚠️  Some variants could not be migrated.');
            console.log('   Please check warnings above and ensure all colors exist in Color Master.');
            return false;
        } else {
            console.log('\n✅ Migration completed successfully!');
            return true;
        }

    } catch (err) {
        console.error('❌ Migration failed:', err);
        return false;
    }
}

/**
 * Verify migration results
 */
async function verifyMigration() {
    try {
        console.log('\n🔍 Verifying migration...\n');

        // Check for any remaining 'color' attributes
        const variantsWithColor = await Variant.find({ 'attributes.color': { $exists: true } });

        if (variantsWithColor.length > 0) {
            console.log(`⚠️  Found ${variantsWithColor.length} variants still using 'color' attribute:`);
            variantsWithColor.forEach(v => {
                console.log(`   - ${v.sku}: ${v.attributes.color}`);
            });
            return false;
        }

        // Check all variants have colorId if they had color
        const variantsWithColorId = await Variant.find({ 'attributes.colorId': { $exists: true } });
        console.log(`✅ Found ${variantsWithColorId.length} variants with colorId`);

        // Check for storage vs size
        const variantsWithStorage = await Variant.find({ 'attributes.storage': { $exists: true } });
        console.log(`✅ Found ${variantsWithStorage.length} variants with storage attribute`);

        console.log('\n✅ Verification passed!');
        return true;

    } catch (err) {
        console.error('❌ Verification failed:', err);
        return false;
    }
}

/**
 * Main execution
 */
async function main() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zeno-panel';
        console.log(`🔗 Connecting to MongoDB: ${mongoUri}\n`);

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Run migration
        const migrationSuccess = await migrateVariantAttributes();

        if (migrationSuccess) {
            // Verify migration
            const verificationSuccess = await verifyMigration();

            if (verificationSuccess) {
                console.log('\n🎉 Migration and verification completed successfully!');
                process.exit(0);
            } else {
                console.log('\n⚠️  Migration completed but verification failed.');
                process.exit(1);
            }
        } else {
            console.log('\n❌ Migration failed. Please fix errors and try again.');
            process.exit(1);
        }

    } catch (err) {
        console.error('❌ Script failed:', err);
        process.exit(1);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { migrateVariantAttributes, verifyMigration };
