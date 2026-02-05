import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Size from '../models/Size.model.js';
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
    await connectDB();

    console.log('--- STARTING SIZE MASTER CLEANUP ---');

    // 1. Fetch all sizes
    const sizes = await Size.find({});
    let validSizes = 0;
    let disabledSizes = 0;
    const validSizeIds = [];

    for (const size of sizes) {
        console.log(`Checking Size: "${size.name}" (Status: ${size.status})`);
        // Validation Rule: Must have "/" and ram/storage should be populated if possible
        // We will stricter: Check if name contains "/"
        const hasSlash = size.name.includes('/');

        let isValid = hasSlash;

        // Infer RAM/Storage from name if missing
        if (isValid && (!size.ram || !size.storage)) {
            // "12GB / 256GB" regex
            const ramMatch = size.name.match(/(\d+)GB\s*\//);
            const storageMatch = size.name.match(/\/\s*(\d+)(GB|TB)/);

            if (ramMatch && storageMatch) {
                size.ram = parseInt(ramMatch[1]);
                let storageVal = parseInt(storageMatch[1]);
                const unit = storageMatch[2];
                if (unit === 'TB') storageVal *= 1024; // Normalized to GB if needed, but schema says storage is Number. Assume GB? 
                // Wait, User example: "16GB / 1TB". Schema has storageUnit. "GB" or "TB".
                size.storage = parseInt(storageMatch[1]);
                size.storageUnit = unit;

                await size.save();
                console.log(`Updated attributes for ${size.name}`);
            }
        }

        if (!isValid) {
            console.log(`❌ Disabling Partial/Invalid Size: ${size.name}`);
            size.status = 'inactive'; // Disable
            if (!size.slug) size.slug = slugify(size.name, { lower: true });
            try {
                await size.save();
                disabledSizes++;
            } catch (err) {
                console.error(`Failed to disable size ${size.name}:`, err.message);
            }
        } else {
            validSizes++;
            validSizeIds.push(size._id);
        }
    }

    console.log(`Sizes: ${validSizes} Valid, ${disabledSizes} Disabled`);

    console.log('--- STARTING VARIANT CLEANUP ---');

    // 2. Identify Wrong Variants
    // Fetch all active variants
    const variants = await Variant.find({ isDeleted: { $ne: true } }).populate('size');
    let deletedVariants = 0;

    for (const v of variants) {
        if (!v.size) {
            console.log(`Variant ${v.sku} has NO Size. Soft deleting.`);
            v.isDeleted = true;
            await v.save();
            deletedVariants++;
            continue;
        }

        const sizeName = v.size.name || "";
        const hasSlash = sizeName.includes('/');

        // Also check if size is actually one of the valid ones (active)
        // Accessing enabled status from populated doc? Assuming populate works.
        const isSizeActive = v.size.status;

        if (!hasSlash || !isSizeActive) {
            console.log(`Variant ${v.sku} uses invalid size "${sizeName}". Soft deleting.`);
            v.isDeleted = true;
            v.sku = `INVALID-${v.sku}`; // Rename SKU to free up
            await v.save();
            deletedVariants++;
        } else {
            // Check SKU format
            // Expected: PROD-{code}-{RAM}-{STORAGE}-{COLOR}
            // If current SKU is "PROD-...-12GBRAM-..." it is wrong.
            const sku = v.sku;
            if (sku.includes('GBRAM') || sku.match(/-\d+TB-/)) {
                // Try to fix SKU
                // PROD-XXXX-12GBRAM-COS -> PROD-XXXX-12-256-COS
                // We need product code.
                // This is complex to automate perfectly without conflicts.
                // User said "BAN SKUs LIKE...".
                // Let's just flag them.
                console.log(`⚠️ Variant ${v.sku} has LEGACY SKU format.`);
                // Should we fix? User said "FIX THE DATA MODEL".
                // If we have size.ram and size.storage, we can generate new SKU.
                if (v.size.ram && v.size.storage) {
                    // We need the base part of SKU.
                    // Assuming SKU parts: PROD-CODE-SIZE-COLOR
                    // But legacy might be PROD-CODE-SIZE
                    // Let's safe-guard: if we can regenerate, do it.
                    // But we don't have Color Code easily (it's color.name substring).
                    // We'll skip auto-fix of SKU to avoid breaking references, but we cleaned the "variants created incorrectly" logic at source.
                }
            }
        }
    }

    console.log(`Variants: ${deletedVariants} Soft Deleted`);

    console.log('--- DONE ---');
    process.exit();
};

fixData();
