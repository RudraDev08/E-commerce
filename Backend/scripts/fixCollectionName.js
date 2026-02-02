// Auto-fix collection name mismatch
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixCollectionName = async () => {
    try {
        console.log('\n🔧 FIXING COLLECTION NAME MISMATCH\n');
        console.log('='.repeat(80));

        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Check if 'variants' collection exists
        const collections = await db.listCollections({ name: 'variants' }).toArray();

        if (collections.length === 0) {
            console.log('❌ Collection "variants" not found');
            console.log('   Your variants might already be in "productvariants"');

            // Check productvariants
            const prodVariants = await db.listCollections({ name: 'productvariants' }).toArray();
            if (prodVariants.length > 0) {
                const count = await db.collection('productvariants').countDocuments();
                console.log(`✅ Found "productvariants" collection with ${count} documents`);
                console.log('\n   No fix needed! Run migration script next:');
                console.log('   → node scripts/migrateInventory.js\n');
            }

            await mongoose.connection.close();
            process.exit(0);
        }

        // Count documents in variants
        const variantCount = await db.collection('variants').countDocuments();
        console.log(`📊 Found ${variantCount} documents in "variants" collection\n`);

        if (variantCount === 0) {
            console.log('⚠️  Collection is empty, nothing to rename\n');
            await mongoose.connection.close();
            process.exit(0);
        }

        // Check if productvariants already exists
        const prodVariantsColl = await db.listCollections({ name: 'productvariants' }).toArray();

        if (prodVariantsColl.length > 0) {
            const prodCount = await db.collection('productvariants').countDocuments();
            console.log(`⚠️  "productvariants" collection already exists with ${prodCount} documents`);
            console.log('\n   Options:');
            console.log('   1. If productvariants is empty, drop it first:');
            console.log('      db.productvariants.drop()');
            console.log('   2. If it has data, you may have duplicates\n');

            if (prodCount === 0) {
                console.log('   Dropping empty "productvariants" collection...');
                await db.collection('productvariants').drop();
                console.log('   ✅ Dropped\n');
            } else {
                console.log('   ❌ Cannot auto-fix - manual intervention required\n');
                await mongoose.connection.close();
                process.exit(1);
            }
        }

        // Rename collection
        console.log('🔄 Renaming "variants" → "productvariants"...');
        await db.collection('variants').rename('productvariants');
        console.log('✅ Renamed successfully!\n');

        // Verify
        const newCount = await db.collection('productvariants').countDocuments();
        console.log(`✅ Verified: "productvariants" now has ${newCount} documents\n`);

        console.log('='.repeat(80));
        console.log('\n🎉 FIX COMPLETE!\n');
        console.log('Next steps:');
        console.log('1. Run migration to create inventory:');
        console.log('   → node scripts/migrateInventory.js\n');
        console.log('2. Verify inventory created:');
        console.log('   → node scripts/emergencyInventoryDiagnostic.js\n');
        console.log('3. Check Inventory Master page in UI\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

fixCollectionName();
