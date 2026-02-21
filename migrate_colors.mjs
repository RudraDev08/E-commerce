import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, 'Backend/.env') });

// Import the model to ensure hooks run
// Using dynamic import because of ESM
const { default: Color } = await import('./Backend/models/masters/ColorMaster.enterprise.js');

async function migrateColors() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI || process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

        const db = mongoose.connection.db;
        const legacyColors = await db.collection('colors').find({}).toArray();
        console.log(`Found ${legacyColors.length} legacy colors.`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const legacy of legacyColors) {
            // Check if already exists in new collection
            const existing = await Color.findOne({ hexCode: legacy.hexCode.toUpperCase() });

            if (existing) {
                console.log(`Skipping ${legacy.name} (${legacy.hexCode}) - already exists.`);
                skippedCount++;
                continue;
            }

            // Create new Enterprise record
            // The pre('validate') hook will fill in RGB, HSL, Contrast, CanonicalId, etc.
            const newColor = new Color({
                name: legacy.name,
                displayName: legacy.name,
                hexCode: legacy.hexCode,
                priority: legacy.priority || 0,
                description: legacy.description || '',
                lifecycleState: 'ACTIVE', // Mark as Active so they show up
                isActive: true,
                createdBy: 'migration-script'
            });

            await newColor.save();
            console.log(`Migrated: ${legacy.name}`);
            migratedCount++;
        }

        console.log(`\nMigration complete!`);
        console.log(`Migrated: ${migratedCount}`);
        console.log(`Skipped: ${skippedCount}`);

        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrateColors();
