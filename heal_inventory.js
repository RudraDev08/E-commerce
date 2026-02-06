import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load models first to avoid populate errors
import './Backend/models/Product/ProductSchema.js';
import './Backend/models/Category/CategorySchema.js';
import './Backend/models/Brands/BrandsSchema.js';
import './Backend/models/variant/variantSchema.js';
import './Backend/models/Size.model.js';
import './Backend/models/Color.model.js';
import './Backend/models/inventory/InventoryMaster.model.js';

import inventoryService from './Backend/services/inventory.service.js';
import Variant from './Backend/models/variant/variantSchema.js';

dotenv.config({ path: './Backend/.env' });

const heal = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const activeVariants = await Variant.find({ isDeleted: false });
        console.log(`Found ${activeVariants.length} active variants.`);

        let healedCount = 0;

        for (const variant of activeVariants) {
            try {
                await inventoryService.initializeInventory(variant._id);
                healedCount++;
                if (healedCount % 5 === 0) console.log(`Processed ${healedCount}/${activeVariants.length}...`);
            } catch (innerErr) {
                console.error(`Failed for variant ${variant._id} (${variant.sku}):`, innerErr.message);
            }
        }

        console.log(`\nHealing complete!`);
        console.log(`Total variants processed: ${healedCount}`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('HEAL ERROR:', err);
        process.exit(1);
    }
};

heal();
