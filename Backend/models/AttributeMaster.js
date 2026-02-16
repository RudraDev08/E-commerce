const mongoose = require('mongoose');

const attributeValueSchema = new mongoose.Schema({
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
        default: true
    }
}, { _id: true });

const attributeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    type: {
        type: String,
        enum: ['single_select', 'multi_select', 'text', 'number'],
        default: 'single_select',
        required: true
    },
    isRequired: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    values: [attributeValueSchema]
}, {
    timestamps: true
});

// Index for active attributes - REMOVED DUPLICATE
// attributeSchema.index({ isActive: 1 });

// Method to get active values
attributeSchema.methods.getActiveValues = function () {
    return this.values.filter(v => v.isActive);
};

attributeSchema.set('toJSON', { virtuals: true });
attributeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AttributeMaster', attributeSchema);
