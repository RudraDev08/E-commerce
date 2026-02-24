import mongoose from 'mongoose';

const ProductGroupSnapshotSchema = new mongoose.Schema({
    productGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductGroupMaster',
        required: true,
        unique: true,
        index: true
    },
    // The pre-computed matrix for the configurator
    // Format: { "colorId:sizeId:attrId": { stock: 10, price: 99.99, ... } }
    // 3.3 Snapshot Validation — Aligned with N-dimensional engine
    dimensions: {
        sizes: Array,
        colors: Array,
        attributes: Array
    },
    variantMap: { type: mongoose.Schema.Types.Mixed, default: {} }, // Alias for availabilityMatrix
    availability: {
        lastStockSyncAt: Date,
        isAnyInStock: Boolean
    },

    // Legacy fields for backward compatibility
    availabilityMatrix: { type: mongoose.Schema.Types.Mixed, default: {} },
    selectors: {
        sizes: Array,
        colors: Array,
        attributes: Array
    },

    priceRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 }
    },

    totalActiveVariants: { type: Number, default: 0 },
    lastComputedAt: { type: Date, default: Date.now },

}, {
    timestamps: true
});

export default mongoose.model('ProductGroupSnapshot', ProductGroupSnapshotSchema);
