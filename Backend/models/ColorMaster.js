const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    hexCode: {
        type: String,
        required: true,
        match: /^#[0-9A-Fa-f]{6}$/,
        trim: true
    },
    category: {
        type: String,
        enum: ['solid', 'metallic', 'gradient', 'pattern'],
        default: 'solid'
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

// Index for active colors
colorSchema.index({ isActive: 1 });

// Virtual for display
colorSchema.virtual('displayLabel').get(function () {
    return `${this.name} (${this.hexCode})`;
});

colorSchema.set('toJSON', { virtuals: true });
colorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ColorMaster', colorSchema);
