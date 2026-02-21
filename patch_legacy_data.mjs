import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, 'Backend/.env') });

async function fixData() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/AdminPanel');
        const db = mongoose.connection.db;

        // Update records that don't have Enterprise fields
        const result = await db.collection('colors').updateMany(
            { lifecycleState: { $exists: false } },
            [
                {
                    $set: {
                        lifecycleState: { $cond: { if: { $eq: ['$status', 'active'] }, then: 'ACTIVE', else: 'DRAFT' } },
                        isActive: { $cond: { if: { $eq: ['$status', 'active'] }, then: true, else: false } },
                        tenantId: 'GLOBAL',
                        displayName: { $ifNull: ['$displayName', '$name'] }
                    }
                }
            ]
        );

        console.log(`Updated ${result.modifiedCount} records with Enterprise fields.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixData();
