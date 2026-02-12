import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

// Ensure only one default warehouse
warehouseSchema.pre('save', async function (next) {
    if (this.isDefault && this.isModified('isDefault')) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

export default mongoose.model('WarehouseMaster', warehouseSchema);
