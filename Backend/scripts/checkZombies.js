// Check for Zombie Inventory (Active Inventory for Deleted Variants)
import mongoose from 'mongoose';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import Variant from '../models/variant/variantSchema.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const checkZombies = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');

        // Get all variants (even deleted ones)
        const allVariants = await Variant.find({}, '_id isDeleted isDate isactive status').lean();

        // Get active inventory
        const activeInventory = await InventoryMaster.find({ isDeleted: false }, 'variantId sku').lean();

        console.log(`\n🧟 ZOMBIE CHECK`);
        console.log(`Total Variants: ${allVariants.length}`);
        console.log(`Active Inventory: ${activeInventory.length}`);

        let zombieCount = 0;

        for (const inv of activeInventory) {
            const variant = allVariants.find(v => v._id.toString() === inv.variantId.toString());

            if (!variant) {
                console.log(`❌ Inventory ${inv.sku} has NO matching variant! (Orphan)`);
                zombieCount++;
            } else if (variant.isDeleted || variant.status === 'deleted') {
                console.log(`🧟 Inventory ${inv.sku} is ACTIVE, but Variant is DELETED!`);
                zombieCount++;
            }
        }

        if (zombieCount === 0) {
            console.log(`✅ No zombies found. Sync is correct.`);
        } else {
            console.log(`\n❌ FOUND ${zombieCount} ZOMBIE RECORD(S).`);
            console.log(`This explains why you see more inventory rows than active variants.`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

checkZombies();
