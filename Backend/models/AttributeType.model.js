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

    // ==================== IMMUTABLE IDENTITY ====================
    internalKey: {
        type: String,
        immutable: true,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        description: "Deterministic internal identifier (e.g. ATTR_COLOR, ATTR_SIZE). Never changes."
    },

    canonicalId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        description: "Standardized ID for cross-system syncing."
    },

    // ==================== CATEGORY CLASSIFICATION ====================
    attributeRole: {
        type: String,
        enum: ['VARIANT', 'SPECIFICATION'],
        default: 'VARIANT',
        description: 'VARIANT attributes create UI selectors and affect SLA/SKU. SPECIFICATION attributes display as static tables.'
    },

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

    // applicableCategories is used for categoryId scoping in junction-based attribute management
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],

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
    optimisticConcurrency: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Comprehensive Indexes
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

// ==================== IMMUTABILITY GUARDS ====================
attributeTypeSchema.pre('save', async function () {
    if (this.isNew) return;

    const modifiedPaths = this.modifiedPaths();

    // internalKey, allowMultipleSelection, affectsPrice are permanently immutable
    const hardImmutablePaths = ['internalKey', 'validationRules.allowMultipleSelection', 'businessRules.affectsPrice'];
    const hardViolations = modifiedPaths.filter(path => hardImmutablePaths.includes(path));
    if (hardViolations.length > 0) {
        throw new Error(`IMMUTABILITY VIOLATION: The following structural fields cannot be modified after creation: ${hardViolations.join(', ')}`);
    }

    // attributeRole is conditionally immutable:
    // It CAN be changed ONLY if no ACTIVE variants currently use this attribute type.
    // This allows the migration script to reclassify unattached or SPECIFICATION-only attributes.
    if (modifiedPaths.includes('attributeRole')) {
        const VariantMaster = mongoose.models.VariantMaster;
        if (VariantMaster) {
            // Find any AttributeValue for this AttributeType
            const AttributeValue = mongoose.models.AttributeValue;
            const attrValueIds = AttributeValue
                ? (await AttributeValue.find({ attributeType: this._id }, '_id').lean()).map(av => av._id)
                : [];

            if (attrValueIds.length > 0) {
                const isUsedInActiveVariant = await VariantMaster.exists({
                    attributeValueIds: { $elemMatch: { $in: attrValueIds } },
                    status: 'ACTIVE'
                });
                if (isUsedInActiveVariant) {
                    throw new Error(
                        `GOVERNANCE VIOLATION: Cannot change attributeRole on '${this.name}' because it is referenced by ACTIVE variants. ` +
                        `Archive all dependent variants before changing the role.`
                    );
                }
            }
        }
    }
});

attributeTypeSchema.pre('findOneAndUpdate', async function () {
    const update = this.getUpdate();
    const docToUpdate = await this.model.findOne(this.getQuery()).lean();

    if (!docToUpdate) return;

    const updateObj = update.$set || update;

    // Hard immutable fields (never changeable)
    const hardImmutableFields = ['internalKey', 'validationRules.allowMultipleSelection', 'businessRules.affectsPrice'];
    const hardViolations = hardImmutableFields.filter(field => {
        if (field.includes('.')) {
            const parts = field.split('.');
            let value = updateObj;
            for (const part of parts) {
                if (value && typeof value === 'object') value = value[part];
                else break;
            }
            return value !== undefined && JSON.stringify(value) !== JSON.stringify(docToUpdate[parts[0]]?.[parts[1]]);
        }
        return updateObj[field] !== undefined && updateObj[field] !== docToUpdate[field];
    });
    if (hardViolations.length > 0) {
        throw new Error(`IMMUTABILITY VIOLATION: Mutation blocked for structural fields: ${hardViolations.join(', ')}`);
    }

    // attributeRole: conditionally immutable — block if active variants depend on this attribute
    if (updateObj.attributeRole && updateObj.attributeRole !== docToUpdate.attributeRole) {
        const VariantMaster = mongoose.models.VariantMaster;
        const AttributeValue = mongoose.models.AttributeValue;
        if (VariantMaster && AttributeValue) {
            const attrValueIds = (await AttributeValue.find({ attributeType: docToUpdate._id }, '_id').lean()).map(av => av._id);
            if (attrValueIds.length > 0) {
                const isUsedInActiveVariant = await VariantMaster.exists({
                    attributeValueIds: { $elemMatch: { $in: attrValueIds } },
                    status: 'ACTIVE'
                });
                if (isUsedInActiveVariant) {
                    throw new Error(
                        `GOVERNANCE VIOLATION: Cannot change attributeRole on '${docToUpdate.name}' because it is referenced by ACTIVE variants. ` +
                        `Archive all dependent variants before changing the role.`
                    );
                }
            }
        }
    }

    // Lock check
    if (docToUpdate.isLocked) {
        if (update.isLocked === false || update?.$set?.isLocked === false) {
            return; // Unlocking is permitted
        }
        throw new Error('LOCKED: This AttributeType is locked and cannot be modified.');
    }
});

const AttributeType = mongoose.models.AttributeType || mongoose.model('AttributeType', attributeTypeSchema);

export default AttributeType;
