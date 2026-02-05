import mongoose from 'mongoose';
import slugify from 'slugify';

const sizeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Size name is required'],
            trim: true,
            maxlength: [50, 'Size name cannot exceed 50 characters']
        },
        slug: {
            type: String,
            required: [true, 'Size slug is required'],
            unique: true,
            lowercase: true,
            index: true
        },
        code: {
            type: String,
            required: [true, 'Size code is required'],
            unique: true,
            uppercase: true,
            trim: true,
            maxlength: [50, 'Size code cannot exceed 50 characters'],
            index: true
        },
        value: {
            type: String,
            trim: true,
            maxlength: [50, 'Size value cannot exceed 50 characters']
        },
        // NEW: Structured Dimensions for Electronics
        ram: {
            type: Number, // e.g. 8, 12, 16
            default: 0
        },
        storage: {
            type: Number, // e.g. 128, 256, 512, 1024
            default: 0
        },
        storageUnit: {
            type: String,
            enum: ['MB', 'GB', 'TB'],
            default: 'GB'
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
sizeSchema.index({ code: 1, isDeleted: 1 });
sizeSchema.index({ status: 1, isDeleted: 1 });
sizeSchema.index({ priority: 1 });

// Virtual for product count
sizeSchema.virtual('productCount', {
    ref: 'Variant',
    localField: '_id',
    foreignField: 'size',
    count: true
});

// Auto-generate slug middleware removed - Logic moved to controller

// Static method to find active sizes
sizeSchema.statics.findActive = function () {
    return this.find({ status: 'active', isDeleted: false }).sort({ priority: 1, name: 1 });
};

// Static method to find by category
sizeSchema.statics.findByCategory = function (categoryId) {
    return this.find({
        applicableCategories: categoryId,
        status: 'active',
        isDeleted: false
    }).sort({ priority: 1, name: 1 });
};

// Instance method to soft delete
sizeSchema.methods.softDelete = function (userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    // Rename slug and code to allow reuse
    const timestamp = new Date().getTime();
    this.slug = `${this.slug}-deleted-${timestamp}`;
    this.code = `${this.code}-DEL-${timestamp.toString().slice(-4)}`; // Keep code sort of short
    return this.save();
};

// Instance method to restore
sizeSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

const Size = mongoose.model('Size', sizeSchema);

export default Size;
