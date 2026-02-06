import mongoose from 'mongoose';
import InventoryMaster from './Backend/models/inventory/InventoryMaster.model.js';
import Variant from './Backend/models/variant/variantSchema.js';
import dotenv from 'dotenv';

dotenv.config({ path: './Backend/.env' });

const checkStock = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const inventories = await InventoryMaster.find().populate('productId', 'name');
        console.log(`Found ${inventories.length} inventory records\n`);

        inventories.forEach(inv => {
            const available = inv.totalStock - (inv.reservedStock || 0);
            console.log(`Product: ${inv.productId?.name || 'Unknown'}`);
            console.log(`SKU: ${inv.sku}`);
            console.log(`Total: ${inv.totalStock}, Reserved: ${inv.reservedStock}, Available: ${available}`);
            console.log(`Status: ${inv.status}`);
            if (inv.isDeleted) console.log(`[DELETED]`);
            console.log('-------------------');
        });

        const variantsWithoutInventory = await Variant.find({
            isDeleted: false
        });

        const invVariantIds = inventories.map(i => i.variantId.toString());
        const missing = variantsWithoutInventory.filter(v => !invVariantIds.includes(v._id.toString()));

        if (missing.length > 0) {
            console.log(`\n⚠️  WARNING: ${missing.length} variants have NO inventory record!`);
            missing.forEach(v => console.log(`- Missing: ${v.sku} (ID: ${v._id})`));
        } else {
            console.log('\n✅ All active variants have inventory records.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkStock();
