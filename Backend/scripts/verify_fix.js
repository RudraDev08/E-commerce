
import 'dotenv/config';
import mongoose from 'mongoose';
import '../models/masters/VariantMaster.enterprise.js';
import '../models/inventory/InventoryMaster.model.js';

async function verify() {
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri);

    const VM = mongoose.models.VariantMaster;
    const IM = mongoose.models.InventoryMaster;

    const [variantCount, inventoryCount] = await Promise.all([
        VM.countDocuments({ status: { $ne: 'ARCHIVED' } }),
        IM.countDocuments({ isDeleted: false }),
    ]);

    console.log(`[VERIFY] Variants: ${variantCount}, Inventory: ${inventoryCount}`);
    if (variantCount === inventoryCount) {
        console.log('✅ INVARIANT OK');
    } else {
        console.log('❌ INVARIANT VIOLATED');
    }

    await mongoose.disconnect();
}

verify().catch(console.error);
