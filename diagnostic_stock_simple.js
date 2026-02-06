import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './Backend/.env' });

const checkStock = async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        const db = mongoose.connection.db;
        const inventoryCollection = db.collection('inventorymasters');
        const variantCollection = db.collection('variants');

        const inventories = await inventoryCollection.find({}).toArray();
        console.log(`Inventory records: ${inventories.length}`);

        inventories.forEach(inv => {
            console.log(`SKU: ${inv.sku} | Total: ${inv.totalStock} | Reserved: ${inv.reservedStock} | Status: ${inv.status}`);
        });

        const activeVariants = await variantCollection.find({ isDeleted: false }).toArray();
        console.log(`Active variants: ${activeVariants.length}`);

        const invVariantIds = inventories.map(i => i.variantId.toString());
        const missing = activeVariants.filter(v => !invVariantIds.includes(v._id.toString()));

        if (missing.length > 0) {
            console.log(`Missing inventory for SKUs: ${missing.map(m => m.sku).join(', ')}`);
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
};

checkStock();
