import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import InventoryMaster from './models/inventory/InventoryMaster.model.js';
import VariantMaster from './models/masters/VariantMaster.enterprise.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '.env') });

async function cleanOrphanedData() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AdminPanel');

        console.log('Finding all variants...');
        const allVariants = await VariantMaster.find({}, '_id').lean();
        const variantIds = allVariants.map(v => v._id.toString());
        console.log(`Found ${variantIds.length} valid variants.`);

        console.log('Finding orphaned inventory...');
        const allInventory = await InventoryMaster.find({}, '_id variantId').lean();

        const orphanedInventoryIds = allInventory
            .filter(inv => inv.variantId && !variantIds.includes(inv.variantId.toString()))
            .map(inv => inv._id);

        console.log(`Found ${orphanedInventoryIds.length} orphaned inventory records.`);

        if (orphanedInventoryIds.length > 0) {
            console.log('Deleting orphaned inventory records...');
            const result = await InventoryMaster.deleteMany({ _id: { $in: orphanedInventoryIds } });
            console.log(`Successfully deleted ${result.deletedCount} orphaned inventory records.`);
        } else {
            console.log('No orphaned inventory records to delete.');
        }

    } catch (error) {
        console.error('Error cleaning orphaned data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Done.');
        process.exit(0);
    }
}

cleanOrphanedData();
