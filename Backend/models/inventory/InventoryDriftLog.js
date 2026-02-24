import mongoose from 'mongoose';

const InventoryDriftLogSchema = new mongoose.Schema({
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'VariantMaster', required: true, index: true },
    sku: { type: String, index: true },
    expectedStock: { type: Number, required: true }, // From InventoryMaster
    actualStockFromLedger: { type: Number, required: true }, // Sum of transactions
    drift: { type: Number, required: true }, // expectedStock - actualStockFromLedger
    reconciledAt: { type: Date, default: Date.now },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    status: { type: String, enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'IGNORED'], default: 'OPEN' },
    notes: String
}, {
    timestamps: true
});

export default mongoose.model('InventoryDriftLog', InventoryDriftLogSchema);
