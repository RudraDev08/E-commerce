// Drop incorrect unique index on productId
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dropBadIndex = async () => {
    try {
        console.log('\n🔧 DROPPING INCORRECT UNIQUE INDEX ON productId\n');
        console.log('='.repeat(80));

        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Drop the incorrect unique index on productId
        try {
            await db.collection('inventorymasters').dropIndex('productId_1');
            console.log('✅ Dropped unique index on productId\n');
        } catch (error) {
            console.log('⚠️  Index may not exist or already dropped\n');
        }

        // Verify indexes
        console.log('📋 REMAINING INDEXES:\n');
        const indexes = await db.collection('inventorymasters').indexes();
        indexes.forEach(idx => {
            if (idx.name.includes('productId')) {
                console.log(`  ${idx.name}: ${JSON.stringify(idx.key)} (Unique: ${idx.unique || false})`);
            }
        });

        console.log('\n' + '='.repeat(80));
        console.log('✅ Index cleanup complete!\n');
        console.log('Now run: node scripts/finalMigration.js\n');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Disconnected from MongoDB\n');
        process.exit(0);
    }
};

dropBadIndex();
