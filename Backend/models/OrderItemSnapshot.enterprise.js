import mongoose from 'mongoose';

/**
 * IMMUTABLE ORDER SNAPSHOT MODEL
 * Purpose: Preserve exact state of variant at time of purchase
 * Constraint: NO live references to masters (10+ year historical integrity)
 * Scale: 100M+ order items
 */

const attributeSnapshotSchema = new mongoose.Schema({
    typeId: mongoose.Schema.Types.ObjectId,
    typeName: { type: String, required: true },
    typeSlug: { type: String, required: true },
    typeDisplayName: String,

    valueId: mongoose.Schema.Types.ObjectId,
    valueName: { type: String, required: true },
    valueSlug: { type: String, required: true },
    valueDisplayName: String,

    // Visual data snapshot (for display)
    visualData: {
        hexCode: String,
        swatchImage: String,
        iconUrl: String
    },

    sortOrder: Number
}, { _id: false });

const priceSnapshotSchema = new mongoose.Schema({
    basePrice: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    compareAtPrice: Number,
    discount: {
        amount: Number,
        percentage: Number,
        code: String,
        type: String // 'COUPON', 'FLASH_SALE', 'CLEARANCE'
    },
    tax: {
        amount: Number,
        rate: Number,
        breakdown: mongoose.Schema.Types.Mixed
    },
    currency: { type: String, default: 'USD' },

    // Price components (for accounting)
    components: {
        product: Number,
        shipping: Number,
        tax: Number,
        discount: Number,
        total: Number
    }
}, { _id: false });

const orderItemSnapshotSchema = new mongoose.Schema({
    // ==================== ORDER REFERENCE ====================
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },

    orderNumber: {
        type: String,
        required: true,
        index: true
    },

    // ==================== VARIANT SNAPSHOT (IMMUTABLE) ====================
    variantSnapshot: {
        // IDs (for reconciliation only, NOT for display)
        variantId: mongoose.Schema.Types.ObjectId,
        productId: mongoose.Schema.Types.ObjectId,

        // Immutable identifiers
        sku: { type: String, required: true, index: true },
        barcode: String,
        configHash: { type: String, required: true },

        // Product info (frozen at purchase time)
        productName: { type: String, required: true },
        productDescription: String,
        brand: { type: String, required: true },
        category: { type: String, required: true },
        subcategory: String,

        // Attribute snapshot (complete configuration)
        attributes: {
            type: [attributeSnapshotSchema],
            required: true
        },

        // Human-readable variant description
        variantTitle: {
            type: String,
            required: true,
            description: "e.g., 'Nike Air Max - Black - Size 10'"
        },

        // Visual assets (frozen URLs)
        images: {
            primary: String,
            thumbnail: String,
            gallery: [String]
        },

        // Measurements (for returns/exchanges)
        measurements: mongoose.Schema.Types.Mixed,

        // Material & care (for customer reference)
        materialInfo: {
            composition: String,
            careInstructions: String,
            countryOfOrigin: String
        }
    },

    // ==================== PRICE SNAPSHOT (IMMUTABLE) ====================
    priceSnapshot: {
        type: priceSnapshotSchema,
        required: true
    },

    // ==================== QUANTITY & FULFILLMENT ====================
    quantity: {
        type: Number,
        required: true,
        min: 1
    },

    quantityFulfilled: {
        type: Number,
        default: 0,
        min: 0
    },

    quantityReturned: {
        type: Number,
        default: 0,
        min: 0
    },

    quantityRefunded: {
        type: Number,
        default: 0,
        min: 0
    },

    // ==================== STATUS ====================
    status: {
        type: String,
        enum: [
            'PENDING',
            'CONFIRMED',
            'PROCESSING',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED',
            'RETURNED',
            'REFUNDED'
        ],
        default: 'PENDING',
        index: true
    },

    // ==================== FULFILLMENT TRACKING ====================
    fulfillment: {
        warehouseId: mongoose.Schema.Types.ObjectId,
        warehouseName: String,

        pickedAt: Date,
        packedAt: Date,
        shippedAt: Date,
        deliveredAt: Date,

        trackingNumber: String,
        carrier: String,

        shippingMethod: String,
        estimatedDelivery: Date
    },

    // ==================== RETURN/REFUND INFO ====================
    returnInfo: {
        returnRequestedAt: Date,
        returnApprovedAt: Date,
        returnReceivedAt: Date,
        returnReason: String,
        returnNotes: String,

        refundAmount: Number,
        refundedAt: Date,
        refundMethod: String,
        refundTransactionId: String
    },

    // ==================== INVENTORY RESERVATION ====================
    reservationId: String,
    reservedAt: Date,
    reservationExpiry: Date,

    // ==================== METADATA ====================
    metadata: {
        // Channel info
        channel: {
            type: String,
            enum: ['WEB', 'POS', 'B2B', 'APP', 'MARKETPLACE']
        },

        // Region info
        region: String,

        // Campaign tracking
        campaignId: String,
        campaignName: String,

        // Gift options
        isGift: Boolean,
        giftMessage: String,
        giftWrap: Boolean,

        // Custom fields
        custom: mongoose.Schema.Types.Mixed
    },

    // ==================== AUDIT ====================
    createdBy: mongoose.Schema.Types.ObjectId,
    updatedBy: mongoose.Schema.Types.ObjectId,

    auditLog: [{
        action: String,
        by: mongoose.Schema.Types.ObjectId,
        at: { type: Date, default: Date.now },
        changes: mongoose.Schema.Types.Mixed
    }]

}, {
    timestamps: true,
    collection: 'orderitemsnapshots'
});

// ==================== INDEXES ====================

// Order lookup
orderItemSnapshotSchema.index({ orderId: 1, status: 1 });

// SKU tracking
orderItemSnapshotSchema.index({ 'variantSnapshot.sku': 1, createdAt: -1 });

// Fulfillment queries
orderItemSnapshotSchema.index({ status: 1, 'fulfillment.shippedAt': 1 });

// Return processing
orderItemSnapshotSchema.index({ 'returnInfo.returnRequestedAt': 1, status: 1 });

// Analytics
orderItemSnapshotSchema.index({
    'variantSnapshot.brand': 1,
    'variantSnapshot.category': 1,
    createdAt: -1
});

// ==================== VIRTUALS ====================

orderItemSnapshotSchema.virtual('totalPrice').get(function () {
    return this.priceSnapshot.finalPrice * this.quantity;
});

orderItemSnapshotSchema.virtual('isFullyFulfilled').get(function () {
    return this.quantityFulfilled === this.quantity;
});

orderItemSnapshotSchema.virtual('isReturnable').get(function () {
    const daysSincePurchase = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);
    return this.status === 'DELIVERED' && daysSincePurchase <= 30;
});

// ==================== STATIC METHODS ====================

/**
 * Create snapshot from variant
 */
orderItemSnapshotSchema.statics.createFromVariant = async function (variant, orderInfo) {
    // Build attribute snapshot
    const attributeSnapshots = variant.normalizedAttributes.map(attr => ({
        typeId: attr.typeId,
        typeName: attr.typeName || attr.typeSlug,
        typeSlug: attr.typeSlug,
        typeDisplayName: attr.typeDisplayName,

        valueId: attr.valueId,
        valueName: attr.valueName,
        valueSlug: attr.valueSlug,
        valueDisplayName: attr.valueDisplayName,

        visualData: attr.visualData || {},
        sortOrder: attr.sortOrder
    }));

    // Build variant title
    const variantTitle = `${variant.productName} - ${attributeSnapshots
        .map(a => a.valueDisplayName || a.valueName)
        .join(' - ')}`;

    // Calculate price
    const basePrice = variant.currentPrice.amount;
    const discount = orderInfo.discount || {};
    const discountAmount = discount.type === 'PERCENTAGE'
        ? (basePrice * discount.value / 100)
        : (discount.value || 0);
    const finalPrice = basePrice - discountAmount;

    return {
        orderId: orderInfo.orderId,
        orderNumber: orderInfo.orderNumber,

        variantSnapshot: {
            variantId: variant._id,
            productId: variant.productId,
            sku: variant.sku,
            barcode: variant.barcode,
            configHash: variant.configHash,

            productName: variant.productName,
            productDescription: variant.searchProjection?.description,
            brand: variant.brand,
            category: variant.category,
            subcategory: variant.subcategory,

            attributes: attributeSnapshots,
            variantTitle,

            images: {
                primary: variant.searchProjection?.primaryImage,
                thumbnail: variant.searchProjection?.thumbnailImage,
                gallery: variant.searchProjection?.galleryImages || []
            },

            measurements: variant.measurements,
            materialInfo: variant.materialData
        },

        priceSnapshot: {
            basePrice,
            finalPrice,
            compareAtPrice: variant.currentPrice.compareAt,
            discount: {
                amount: discountAmount,
                percentage: discount.type === 'PERCENTAGE' ? discount.value : 0,
                code: discount.code,
                type: discount.type
            },
            currency: variant.currentPrice.currency,
            components: {
                product: finalPrice,
                shipping: orderInfo.shippingCost || 0,
                tax: orderInfo.taxAmount || 0,
                discount: discountAmount,
                total: finalPrice + (orderInfo.shippingCost || 0) + (orderInfo.taxAmount || 0)
            }
        },

        quantity: orderInfo.quantity,
        status: 'PENDING',

        metadata: {
            channel: orderInfo.channel,
            region: orderInfo.region,
            campaignId: orderInfo.campaignId,
            isGift: orderInfo.isGift || false
        }
    };
};

/**
 * Get sales history for variant (analytics)
 */
orderItemSnapshotSchema.statics.getSalesHistory = function (variantId, dateRange = {}) {
    const query = { 'variantSnapshot.variantId': variantId };

    if (dateRange.from) query.createdAt = { $gte: dateRange.from };
    if (dateRange.to) query.createdAt = { ...query.createdAt, $lte: dateRange.to };

    return this.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                totalQuantity: { $sum: '$quantity' },
                totalRevenue: { $sum: { $multiply: ['$priceSnapshot.finalPrice', '$quantity'] } },
                avgPrice: { $avg: '$priceSnapshot.finalPrice' },
                orderCount: { $sum: 1 }
            }
        }
    ]);
};

/**
 * Validate snapshot integrity
 */
orderItemSnapshotSchema.methods.validateIntegrity = function () {
    const errors = [];

    // Check required fields
    if (!this.variantSnapshot.sku) errors.push('Missing SKU');
    if (!this.variantSnapshot.configHash) errors.push('Missing config hash');
    if (!this.variantSnapshot.attributes || this.variantSnapshot.attributes.length === 0) {
        errors.push('Missing attributes');
    }

    // Check price consistency
    if (this.priceSnapshot.finalPrice < 0) errors.push('Invalid final price');
    if (this.quantity < 1) errors.push('Invalid quantity');

    return {
        valid: errors.length === 0,
        errors
    };
};

// ==================== MIDDLEWARE ====================

// Prevent modification of snapshot after creation
orderItemSnapshotSchema.pre('save', function (next) {
    if (!this.isNew) {
        const immutableFields = [
            'variantSnapshot',
            'priceSnapshot',
            'orderId',
            'orderNumber'
        ];

        const modifiedImmutable = this.modifiedPaths().filter(path =>
            immutableFields.some(field => path.startsWith(field))
        );

        if (modifiedImmutable.length > 0) {
            return next(new Error(`Cannot modify immutable fields: ${modifiedImmutable.join(', ')}`));
        }
    }

    next();
});

export default mongoose.models.OrderItemSnapshot || mongoose.model('OrderItemSnapshot', orderItemSnapshotSchema);
