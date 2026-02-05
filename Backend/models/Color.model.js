import mongoose from 'mongoose';

const colorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Color name is required'],
            trim: true,
            maxlength: [50, 'Color name cannot exceed 50 characters']
        },
        slug: {
            type: String,
            required: [true, 'Color slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        hexCode: {
            type: String,
            required: [true, 'Hex code is required'],
            unique: true,
            uppercase: true,
            trim: true,
            match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color code'],
            index: true
        },
        rgbCode: {
            type: String,
            trim: true,
            match: [/^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/i, 'Please provide a valid RGB color code']
        },
        applicableCategories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        }],
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
            index: true
        },
        priority: {
            type: Number,
            default: 0,
            min: 0
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters']
        },
        // Color swatch image (optional)
        swatchImage: {
            type: String,
            default: null
        },
        // Soft delete
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        },
        deletedAt: {
            type: Date,
            default: null
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        // Audit fields
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Indexes for performance
colorSchema.index({ hexCode: 1, isDeleted: 1 });
colorSchema.index({ slug: 1, isDeleted: 1 });
colorSchema.index({ status: 1, isDeleted: 1 });
colorSchema.index({ priority: 1 });

// Virtual for product count
colorSchema.virtual('productCount', {
    ref: 'Variant',
    localField: '_id',
    foreignField: 'color',
    count: true
});

// Pre-save middleware removed due to next() issues with ES module environment
// Logic moved to controller

// Static method to find active colors
colorSchema.statics.findActive = function () {
    return this.find({ status: 'active', isDeleted: false }).sort({ priority: 1, name: 1 });
};

// Static method to find by category
colorSchema.statics.findByCategory = function (categoryId) {
    return this.find({
        applicableCategories: categoryId,
        status: 'active',
        isDeleted: false
    }).sort({ priority: 1, name: 1 });
};

// Static method to convert hex to RGB
colorSchema.statics.hexToRgb = function (hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
        : null;
};

// Instance method to soft delete
colorSchema.methods.softDelete = function (userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    return this.save();
};

// Instance method to restore
colorSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

const Color = mongoose.model('Color', colorSchema);

export default Color;
