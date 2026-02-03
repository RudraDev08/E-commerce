
import mongoose from 'mongoose';

/**
 * ========================================================================
 * WAREHOUSE MASTER SCHEMA
 * ========================================================================
 * Defines physical storage locations for inventory.
 */

const warehouseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Warehouse name is required'],
        trim: true,
        unique: true
    },
    code: {
        type: String,
        required: [true, 'Warehouse code is required'],
        uppercase: true,
        trim: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['PHYSICAL', 'VIRTUAL', 'STORE', '3PL'],
        default: 'PHYSICAL'
    },
    address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String
    },
    contact: {
        name: String,
        phone: String,
        email: String
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Ensure only one default warehouse
warehouseSchema.pre('save', async function () {
    if (this.isDefault) {
        const Warehouse = this.constructor;
        await Warehouse.updateMany(
            { _id: { $ne: this._id } },
            { $set: { isDefault: false } }
        );
    }
});

const Warehouse = mongoose.model('Warehouse', warehouseSchema);
export default Warehouse;
