import mongoose from 'mongoose';

const attributeValueSchema = new mongoose.Schema({
    // ==================== REFERENCE ====================
    attributeType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttributeType',
        required: true,
        index: true
    },

    // ==================== BASIC FIELDS ====================
    name: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: 100
    },

    slug: {
        type: String,
        required: true,
        lowercase: true,
        index: true
    },

    code: {
        type: String,
        required: true,
        uppercase: true,
        index: true
    },

    displayName: {
        type: String,
        trim: true,
        maxlength: 200
    },

    value: mongoose.Schema.Types.Mixed,

    description: {
        type: String,
        maxlength: 1000
    },

    displayOrder: {
        type: Number,
        default: 0,
        index: true
    },

    // ==================== VISUAL DATA ====================
    visualData: {
        // Colors
        hexCode: String,
        rgbCode: String,
        cmykCode: String,
        pantoneCode: String,
        colorFamily: {
            type: String,
            enum: ['warm', 'cool', 'neutral', 'pastel', 'vibrant', 'dark', 'light']
        },

        // Patterns
        patternType: {
            type: String,
            enum: ['solid', 'striped', 'checked', 'floral', 'geometric', 'abstract', 'printed', 'embroidered']
        },
        patternImage: String,

        // Images
        primaryImage: String,
        thumbnailImage: String,
        hoverImage: String,
        galleryImages: [String],

        // Swatch
        swatchType: {
            type: String,
            enum: ['color', 'image', 'text', 'pattern', 'none'],
            default: 'none'
        },
        swatchValue: String,
        swatchImage: String,

        // Display
        iconUrl: String,
        badgeUrl: String,
        labelColor: String,
        backgroundColor: String
    },

    // ==================== TECHNICAL DATA ====================
    technicalData: {
        // Numeric Values
        numericValue: Number,
        unit: String,
        precision: Number,

        // Specifications
        specifications: mongoose.Schema.Types.Mixed,

        // Electronics
        processor: String,
        ram: Number,
        storage: Number,
        storageUnit: String,
        batteryCapacity: Number,
        screenSize: Number,
        resolution: String,

        // Performance
        performanceRating: Number,
        energyRating: String,
        certifications: [String],

        // Technical Specs
        technicalSpecs: [{
            key: String,
            value: String,
            unit: String
        }]
    },

    // ==================== MEASUREMENTS ====================
    measurements: {
        // Clothing Measurements (in cm)
        chest: Number,
        waist: Number,
        hip: Number,
        length: Number,
        shoulder: Number,
        sleeve: Number,
        inseam: Number,
        rise: Number,
        neck: Number,

        // Footwear Measurements
        footLength: Number,
        footWidth: Number,
        heelHeight: Number,
        platformHeight: Number,

        // General Dimensions
        height: Number,
        width: Number,
        depth: Number,
        diameter: Number,

        // Weight
        weight: Number,
        weightUnit: String,

        // Volume
        volume: Number,
        volumeUnit: String,

        // Size Group & Gender
        sizeGroup: String,
        gender: {
            type: String,
            enum: ['men', 'women', 'unisex', 'boys', 'girls', 'kids', 'toddler', 'infant']
        },

        // International Conversions
        conversions: {
            uk: String,
            us: String,
            eu: String,
            jp: String,
            au: String,
            cn: String,
            cm: Number,
            inch: Number
        },

        // Size Chart
        sizeChart: {
            recommendedHeight: { min: Number, max: Number },
            recommendedWeight: { min: Number, max: Number },
            recommendedAge: { min: Number, max: Number },
            fitNotes: String,
            fitType: {
                type: String,
                enum: ['tight', 'slim', 'regular', 'relaxed', 'oversized']
            },
            ageGroup: String
        }
    },

    // ==================== MATERIAL DATA ====================
    materialData: {
        // Composition
        primaryMaterial: String,
        composition: String,
        fabricType: String,
        fabricWeight: Number,
        fabricWeightUnit: String,

        // Blend
        materialBlend: [{
            material: String,
            percentage: Number
        }],

        // Properties
        properties: {
            breathable: Boolean,
            waterproof: Boolean,
            stretchable: Boolean,
            wrinkleResistant: Boolean,
            fadeResistant: Boolean,
            hypoallergenic: Boolean,
            organic: Boolean,
            recycled: Boolean,
            sustainable: Boolean
        },

        // Care Instructions
        careInstructions: {
            washing: String,
            drying: String,
            ironing: String,
            bleaching: String,
            dryCleaning: String,
            specialCare: String
        },

        // Certifications
        certifications: [{
            name: String,
            code: String,
            issuedBy: String,
            validUntil: Date
        }],

        // Origin
        countryOfOrigin: String,
        manufacturer: String,

        // Quality
        qualityGrade: {
            type: String,
            enum: ['premium', 'standard', 'economy', 'luxury']
        },
        durabilityRating: Number
    },

    // ==================== STYLE DATA ====================
    styleData: {
        // Fit
        fitType: {
            type: String,
            enum: ['tight', 'slim', 'regular', 'relaxed', 'oversized', 'custom']
        },
        fitDescription: String,

        // Occasion
        occasions: [{
            type: String,
            enum: ['casual', 'formal', 'business', 'party', 'sports', 'outdoor', 'wedding', 'beach', 'gym', 'lounge']
        }],

        // Season
        seasons: [{
            type: String,
            enum: ['spring', 'summer', 'autumn', 'winter', 'all-season']
        }],

        // Style Category
        styleCategory: {
            type: String,
            enum: ['classic', 'modern', 'vintage', 'bohemian', 'minimalist', 'streetwear', 'athletic', 'elegant']
        },

        // Trend
        trendLevel: {
            type: String,
            enum: ['timeless', 'trending', 'seasonal', 'limited-edition']
        },

        // Target Audience
        targetAudience: {
            ageGroup: String,
            lifestyle: String,
            pricePoint: String
        }
    },

    // ==================== PRICING MODIFIERS ====================
    pricingModifiers: {
        modifierType: {
            type: String,
            enum: ['none', 'fixed', 'percentage'],
            default: 'none'
        },

        priceModifier: {
            type: {
                type: String,
                enum: ['fixed', 'percentage']
            },
            value: Number
        },

        value: {
            type: Number,
            default: 0
        },

        // Advanced Pricing
        basePriceAdjustment: Number,

        costModifierType: {
            type: String,
            enum: ['none', 'fixed', 'percentage'],
            default: 'none'
        },
        costValue: Number,

        // Tiered Pricing
        tieredPricing: [{
            minQuantity: Number,
            maxQuantity: Number,
            priceModifier: Number,
            modifierType: String
        }],

        // Dynamic Pricing
        dynamicPricing: {
            enabled: Boolean,
            rules: mongoose.Schema.Types.Mixed
        }
    },

    // ==================== INVENTORY MODIFIERS ====================
    inventoryModifiers: {
        stockModifier: {
            type: Number,
            default: 0
        },

        minStockLevel: Number,
        maxStockLevel: Number,
        reorderPoint: Number,
        reorderQuantity: Number,

        // Lead Time
        leadTimeDays: Number,

        // Availability
        isBackorderable: {
            type: Boolean,
            default: false
        },

        isPreorderable: {
            type: Boolean,
            default: false
        },

        // Stock Alerts
        lowStockThreshold: Number,
        outOfStockBehavior: {
            type: String,
            enum: ['hide', 'show_disabled', 'show_notify', 'show_preorder'],
            default: 'show_disabled'
        }
    },

    // ==================== POPULARITY & ANALYTICS ====================
    analytics: {
        viewCount: {
            type: Number,
            default: 0
        },

        purchaseCount: {
            type: Number,
            default: 0
        },

        cartAddCount: {
            type: Number,
            default: 0
        },

        returnRate: {
            type: Number,
            default: 0
        },

        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        reviewCount: {
            type: Number,
            default: 0
        },

        popularityScore: {
            type: Number,
            default: 0
        },

        trendingScore: {
            type: Number,
            default: 0
        },

        lastPurchaseDate: Date,

        // Conversion Metrics
        conversionRate: Number,
        clickThroughRate: Number
    },

    // ==================== AVAILABILITY RULES ====================
    availabilityRules: {
        isAvailable: {
            type: Boolean,
            default: true
        },

        availableFrom: Date,
        availableUntil: Date,

        // Geographic Availability
        availableCountries: [String],
        excludedCountries: [String],

        availableRegions: [String],
        excludedRegions: [String],

        // Channel Availability
        availableChannels: [{
            type: String,
            enum: ['web', 'mobile', 'pos', 'marketplace', 'wholesale']
        }],

        // Customer Segment
        availableForSegments: [String],

        // Seasonal Availability
        seasonalAvailability: {
            enabled: Boolean,
            startMonth: Number,
            endMonth: Number
        },

        // Minimum Order Quantity
        minOrderQuantity: {
            type: Number,
            default: 1
        },

        maxOrderQuantity: Number,

        // Bundle Rules
        canBeBundled: {
            type: Boolean,
            default: true
        },

        bundleOnly: {
            type: Boolean,
            default: false
        }
    },

    // ==================== COMPATIBILITY RULES ====================
    compatibilityRules: {
        // Compatible with other attribute values
        compatibleWith: [{
            attributeType: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AttributeType'
            },
            attributeValues: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AttributeValue'
            }]
        }],

        // Incompatible with other attribute values
        incompatibleWith: [{
            attributeType: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AttributeType'
            },
            attributeValues: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AttributeValue'
            }]
        }],

        // Requires other attributes
        requires: [{
            attributeType: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AttributeType'
            },
            required: Boolean
        }],

        // Dependency Rules
        dependencyRules: mongoose.Schema.Types.Mixed
    },

    // ==================== DISPLAY ASSETS ====================
    displayAssets: {
        // Images
        images: [{
            url: String,
            alt: String,
            title: String,
            isPrimary: Boolean,
            sortOrder: Number,
            tags: [String]
        }],

        // Videos
        videos: [{
            url: String,
            thumbnail: String,
            duration: Number,
            videoType: {
                type: String,
                enum: ['product_demo', 'how_to_use', '360_view', 'lifestyle', 'unboxing']
            },
            sortOrder: Number
        }],

        // 3D & AR
        threeDModel: {
            url: String,
            format: String,
            fileSize: Number
        },

        arModel: {
            url: String,
            format: String,
            iosUrl: String,
            androidUrl: String
        },

        // Interactive
        interactiveAssets: [{
            assetType: String,
            url: String,
            metadata: mongoose.Schema.Types.Mixed
        }]
    },

    // ==================== SEO & TRANSLATIONS ====================
    seo: {
        metaTitle: {
            type: String,
            maxlength: 60
        },

        metaDescription: {
            type: String,
            maxlength: 160
        },

        metaKeywords: [String],

        urlSlug: String,

        canonicalUrl: String,

        ogTitle: String,
        ogDescription: String,
        ogImage: String,

        twitterTitle: String,
        twitterDescription: String,
        twitterImage: String,

        structuredData: mongoose.Schema.Types.Mixed,

        searchKeywords: [String],

        seoScore: Number
    },

    translations: [{
        language: {
            type: String,
            required: true
        },

        name: String,
        displayName: String,
        description: String,

        seo: {
            metaTitle: String,
            metaDescription: String,
            metaKeywords: [String]
        },

        customFields: mongoose.Schema.Types.Mixed
    }],

    // ==================== PRODUCT CATEGORIES ====================
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],

    // ==================== CUSTOM FIELDS ====================
    customFields: mongoose.Schema.Types.Mixed,

    // ==================== STATUS & AUDIT ====================
    status: {
        type: String,
        enum: ['active', 'inactive', 'draft', 'archived'],
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

// ==================== INDEXES ====================
attributeValueSchema.index({ attributeType: 1, code: 1 }, { unique: true });
attributeValueSchema.index({ attributeType: 1, slug: 1 });
attributeValueSchema.index({ attributeType: 1, status: 1, isDeleted: 1 });
attributeValueSchema.index({ attributeType: 1, displayOrder: 1 });
attributeValueSchema.index({ 'measurements.sizeGroup': 1, 'measurements.gender': 1 });
attributeValueSchema.index({ 'visualData.colorFamily': 1 });
attributeValueSchema.index({ 'analytics.popularityScore': -1 });
attributeValueSchema.index({ 'analytics.purchaseCount': -1 });
attributeValueSchema.index({ 'availabilityRules.isAvailable': 1 });

// ==================== VIRTUALS ====================
attributeValueSchema.virtual('fullDisplayName').get(function () {
    return this.displayName || this.name;
});

attributeValueSchema.virtual('isPopular').get(function () {
    return this.analytics?.popularityScore > 70;
});

attributeValueSchema.virtual('isTrending').get(function () {
    return this.analytics?.trendingScore > 70;
});

// ==================== STATIC METHODS ====================
attributeValueSchema.statics.findByType = function (attributeTypeId, filters = {}) {
    const query = {
        attributeType: attributeTypeId,
        status: 'active',
        isDeleted: false
    };

    if (filters.sizeGroup) query['measurements.sizeGroup'] = filters.sizeGroup;
    if (filters.gender) query['measurements.gender'] = filters.gender;
    if (filters.colorFamily) query['visualData.colorFamily'] = filters.colorFamily;
    if (filters.category) query.applicableCategories = filters.category;

    return this.find(query).sort({ displayOrder: 1, name: 1 });
};

attributeValueSchema.statics.findByCategory = function (attributeTypeId, categoryId) {
    return this.find({
        attributeType: attributeTypeId,
        applicableCategories: categoryId,
        status: 'active',
        isDeleted: false
    }).sort({ displayOrder: 1 });
};

attributeValueSchema.statics.findPopular = function (attributeTypeId, limit = 10) {
    return this.find({
        attributeType: attributeTypeId,
        status: 'active',
        isDeleted: false
    })
        .sort({ 'analytics.popularityScore': -1 })
        .limit(limit);
};

attributeValueSchema.statics.findTrending = function (attributeTypeId, limit = 10) {
    return this.find({
        attributeType: attributeTypeId,
        status: 'active',
        isDeleted: false
    })
        .sort({ 'analytics.trendingScore': -1 })
        .limit(limit);
};

// ==================== INSTANCE METHODS ====================
attributeValueSchema.methods.softDelete = function (userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    const timestamp = new Date().getTime();
    this.slug = `${this.slug}-deleted-${timestamp}`;
    this.code = `${this.code}-DEL-${timestamp.toString().slice(-4)}`;
    return this.save();
};

attributeValueSchema.methods.incrementView = function () {
    this.analytics.viewCount += 1;
    return this.save();
};

attributeValueSchema.methods.incrementPurchase = function () {
    this.analytics.purchaseCount += 1;
    this.analytics.lastPurchaseDate = new Date();
    return this.save();
};

attributeValueSchema.methods.isCompatibleWith = function (otherAttributeValue) {
    if (!this.compatibilityRules?.compatibleWith) return true;

    const compatible = this.compatibilityRules.compatibleWith.find(rule =>
        rule.attributeValues.some(id => id.toString() === otherAttributeValue._id.toString())
    );

    return !!compatible;
};

attributeValueSchema.methods.isIncompatibleWith = function (otherAttributeValue) {
    if (!this.compatibilityRules?.incompatibleWith) return false;

    const incompatible = this.compatibilityRules.incompatibleWith.find(rule =>
        rule.attributeValues.some(id => id.toString() === otherAttributeValue._id.toString())
    );

    return !!incompatible;
};

attributeValueSchema.statics.validateActive = async function (ids) {
    const count = await this.countDocuments({
        _id: { $in: ids },
        isDeleted: false,
        status: 'active'
    });
    return count === ids.length;
};

const AttributeValue = mongoose.models.AttributeValue || mongoose.model('AttributeValue', attributeValueSchema);

export default AttributeValue;
