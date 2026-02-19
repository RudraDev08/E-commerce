import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import SizeMaster from '../models/masters/SizeMaster.enterprise.js';
import Variant from '../models/variant/variantSchema.js';
import slugify from 'slugify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Connection Error:', error);
        process.exit(1);
    }
};

const fixData = async () => {
    // This script is legacy and heavily tied to the old Size model structure (RAM/Storage).
    // The new SizeMaster.enterprise.js uses 'value', 'category', 'lifecycleState'.
    // We will archive this script's meaningful logic or adapt it.
    // For now, let's just inspect what it was doing:
    // 1. disabling partial/invalid sizes (missing slash for RAM/Storage)
    // 2. inferring RAM/Storage
    // 3. cleaning bad variants

    // Since we moved to SizeMaster, loop over SizeMaster instead.
    // However, if we wiped the collection and re-seeded, there is nothing to fix yet.

    await connectDB();
    console.log('--- STARTING SIZE MASTER CHECK ---');

    const sizes = await SizeMaster.find({});
    console.log(`Found ${sizes.length} sizes in Enterprise Master.`);

    // No specific fix needed for new seed data.
    // We can check for duplicates or invalid states.

    for (const size of sizes) {
        if (!size.canonicalId) {
            console.log(`Generating canonicalId for ${size._id}`);
            size.canonicalId = await SizeMaster.generateCanonicalId();
            await size.save();
        }
    }

    console.log('--- DONE ---');
    process.exit();
};

fixData();
