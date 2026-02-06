import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './Backend/.env' });

const inventoryMasterSchema = new mongoose.Schema({
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
    sku: { type: String, required: true },
    totalStock: { type: Number, default: 0 },
    reservedStock: { type: Number, default: 0 },
    status: { type: String, default: 'OUT_OF_STOCK' }
});

const variantSchema = new mongoose.Schema({
    sku: String,
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    isDeleted: { type: Boolean, default: false }
});

const InventoryMaster = mongoose.models.InventoryMaster || mongoose.model('InventoryMaster', inventoryMasterSchema);
const Variant = mongoose.models.Variant || mongoose.model('Variant', variantSchema);

const heal = async () => {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        const activeVariants = await Variant.find({ isDeleted: false });
        console.log(`Found ${activeVariants.length} active variants.`);

        let healed = 0;
        for (const v of activeVariants) {
            const existing = await InventoryMaster.findOne({ variantId: v._id });
            if (!existing) {
                await InventoryMaster.create({
                    variantId: v._id,
                    productId: v.product,
                    sku: v.sku || 'UNKNOWN',
                    totalStock: 0,
                    reservedStock: 0,
                    status: 'OUT_OF_STOCK'
                });
                healed++;
            }
        }

        console.log(`Healed ${healed} missing inventory records.`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

heal();
