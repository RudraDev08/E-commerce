const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ['storage', 'ram', 'clothing', 'shoe', 'display', 'other'],
        required: true,
        index: true
    },
    value: {
        type: String,
        required: true,
        trim: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate sizes
sizeSchema.index({ category: 1, value: 1 }, { unique: true });

// Index for active sizes lookup
sizeSchema.index({ category: 1, isActive: 1 });

// Virtual for formatted display
sizeSchema.virtual('label').get(function () {
    return this.displayName || this.value;
});

// Ensure virtuals are included in JSON
sizeSchema.set('toJSON', { virtuals: true });
sizeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SizeMaster', sizeSchema);
