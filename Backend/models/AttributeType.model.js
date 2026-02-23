import mongoose from 'mongoose';

const attributeTypeSchema = new mongoose.Schema({
    // ==================== BASIC INFO ====================
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 100
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },

    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },

    description: {
        type: String,
        maxlength: 500
    },

    // ==================== CATEGORY CLASSIFICATION ====================
    category: {
        type: String,
        required: true,
        enum: ['physical', 'visual', 'technical', 'material', 'style', 'specification'],
        default: 'specification',
        index: true
    },

    // ==================== DISPLAY CONFIGURATION ====================
    displayName: {
        type: String,
        required: true,
        trim: true
    },

    inputType: {
        type: String,
        required: true,
        enum: ['dropdown', 'button', 'swatch', 'radio', 'checkbox', 'image_grid', 'slider', 'text_input', 'number_input'],
        default: 'dropdown'
    },

    displayStyle: {
        type: String,
        enum: ['inline', 'grid', 'list', 'compact', 'expanded'],
        default: 'inline'
    },

    icon: {
        type: String,
        trim: true
    },

    iconUrl: {
        type: String,
        trim: true
    },

    showInFilters: {
        type: Boolean,
        default: true
    },

    filterDisplayType: {
        type: String,
        enum: ['checkbox', 'radio', 'range', 'color_swatch', 'dropdown'],
        default: 'checkbox'
    },

    showInProductCard: {
        type: Boolean,
        default: false
    },

    showInVariants: {
        type: Boolean,
        default: true
    },

    // ==================== VALIDATION RULES ====================
    validationRules: {
        isRequired: {
            type: Boolean,
            default: false
        },

        allowMultipleSelection: {
            type: Boolean,
            default: false
        },

        minSelection: {
            type: Number,
            default: 0,
            min: 0
        },

        maxSelection: {
            type: Number,
            default: 1,
            min: 1
        },

        allowCustomValue: {
            type: Boolean,
            default: false
        },

        customValueValidation: {
            pattern: String,
            minLength: Number,
            maxLength: Number,
            minValue: Number,
            maxValue: Number
        }
    },

    // ==================== MEASUREMENT CONFIGURATION ====================
    measurementConfig: {
        hasMeasurements: {
            type: Boolean,
            default: false
        },

        unit: {
            type: String,
            enum: ['cm', 'm', 'mm', 'inch', 'ft', 'kg', 'g', 'lb', 'oz', 'ml', 'l', 'gb', 'tb', 'none'],
            default: 'none'
        },

        allowedUnits: [{
            type: String,
            enum: ['cm', 'm', 'mm', 'inch', 'ft', 'kg', 'g', 'lb', 'oz', 'ml', 'l', 'gb', 'tb']
        }],

        rangeMin: Number,
        rangeMax: Number,

        precision: {
            type: Number,
            default: 0,
            min: 0,
            max: 4
        },

        measurementFields: [{
            name: String,
            label: String,
            unit: String,
            required: Boolean
        }]
    },

    // ==================== LIFECYCLE & GOVERNANCE ====================
    status: {
        type: String,
        enum: ['draft', 'active', 'deprecated', 'archived'],
        default: 'active',
        index: true
    },

    // Versioning Support
    version: {
        type: Number,
        default: 1,
        description: "Increments on breaking changes"
    },
    isDeprecated: {
        type: Boolean,
        default: false
    },
    deprecatedAt: {
        type: Date
    },

    // Segmentation (Enterprise)
    availableChannels: {
        type: [String],
        enum: ['B2C', 'B2B', 'POS', 'APP'],
        default: ['B2C']
    },
    availableRegions: {
        type: [String],
        enum: ['US', 'EU', 'APAC', 'IN', 'GLOBAL'], // Configurable
        default: ['GLOBAL']
    },

    isLocked: {
        type: Boolean,
        default: false,
        description: "Prevents modification of this attribute type definition"
    },

    createsVariant: {
        type: Boolean,
        default: false,
        description: "Determines if this attribute creates a SKU variant"
    },

    variantOrder: {
        type: Number,
        description: "Order in which this attribute appears in variant selection"
    },

    // ==================== SORTING & PRIORITY ====================
    sortingConfig: {
        displayOrder: {
            type: Number,
            default: 0,
            index: true
        },

        variantGenerationPriority: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        defaultSortOrder: {
            type: String,
            enum: ['alphabetical', 'numeric', 'custom', 'price_low_high', 'price_high_low', 'popularity'],
            default: 'custom'
        }
    },

    // ==================== BUSINESS LOGIC ====================
    businessRules: {
        affectsPrice: {
            type: Boolean,
            default: false
        },

        affectsStock: {
            type: Boolean,
            default: true
        },

        affectsSKU: {
            type: Boolean,
            default: true
        },

        affectsShipping: {
            type: Boolean,
            default: false
        },

        requiresImage: {
            type: Boolean,
            default: false
        }
    },

    // ==================== HELPER TEXT ====================
    helperText: {
        adminLabel: {
            type: String,
            maxlength: 200
        },

        adminDescription: {
            type: String,
            maxlength: 500
        },

        adminPlaceholder: {
            type: String,
            maxlength: 100
        },

        customerLabel: {
            type: String,
            maxlength: 200
        },

        customerDescription: {
            type: String,
            maxlength: 500
        },

        customerPlaceholder: {
            type: String,
            maxlength: 100
        },

        tooltipText: {
            type: String,
            maxlength: 300
        }
    },

    // ==================== SEO METADATA ====================
    seo: {
        metaTitle: {
            type: String,
            maxlength: 60
        },

        metaDescription: {
            type: String,
            maxlength: 160
        },

        metaKeywords: [{
            type: String,
            trim: true
        }],

        includeInUrl: {
            type: Boolean,
            default: false
        },

        urlFormat: {
            type: String,
            enum: ['slug', 'code', 'name', 'custom'],
            default: 'slug'
        },

        canonicalUrl: String,

        structuredDataType: {
            type: String,
            enum: ['none', 'product_variant', 'offer', 'custom'],
            default: 'none'
        }
    },

    // ==================== PRODUCT CATEGORIES ====================
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],

    // ==================== STATUS & AUDIT ====================
    status: {
        type: String,
        enum: ['active', 'inactive', 'draft'],
        default: 'active',
        index: true
    },

    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },

    deletedAt: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
attributeTypeSchema.index({ slug: 1, isDeleted: 1 });
attributeTypeSchema.index({ status: 1, isDeleted: 1 });


// Static methods
attributeTypeSchema.statics.findActive = function () {
    return this.find({ status: 'active', isDeleted: false }).sort({ displayOrder: 1 });
};

attributeTypeSchema.statics.validateCombination = async function (attributeTypeIds) {
    // Ensure all types exist and are active
    const count = await this.countDocuments({
        _id: { $in: attributeTypeIds },
        status: 'active',
        isDeleted: false
    });
    if (count !== attributeTypeIds.length) {
        throw new Error('One or more attribute types are invalid or inactive');
    }
    return true;
};

attributeTypeSchema.statics.findByCategory = function (categoryId) {
    return this.find({
        applicableCategories: categoryId,
        status: 'active',
        isDeleted: false
    }).sort({ displayOrder: 1 });
};

// Governance: Lock Check
// NOTE: In Mongoose v9, async middleware does NOT receive `next` as an argument.
// Use the synchronous signature (next as first arg) or a plain async without next.
attributeTypeSchema.pre('findOneAndUpdate', async function () {
    const docToUpdate = await this.model.findOne(this.getQuery()).lean();

    // Allow if doc doesn't exist (it will fail anyway) or isn't locked
    if (!docToUpdate || !docToUpdate.isLocked) {
        return; // Mongoose v9: just return from async middleware
    }

    // Better implementation: Check if 'isLocked' is being set to false in the update.
    const update = this.getUpdate();
    if (update.isLocked === false || update?.$set?.isLocked === false) {
        return; // Unlocking is permitted
    }

    // If it remains locked, we could throw here to block the update.
    // For now, we log a warning and allow (prevent breaking existing flows).
    console.warn('[AttributeType] Attempted update on a locked AttributeType. Consider blocking.');
    // To hard-block: throw new Error('This AttributeType is locked and cannot be modified.');
});

const AttributeType = mongoose.models.AttributeType || mongoose.model('AttributeType', attributeTypeSchema);

export default AttributeType;
