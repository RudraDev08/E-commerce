import mongoose from 'mongoose';

/**
 * ENTERPRISE COLOR MASTER
 * Scope: Global color palette registry
 * Scale: 1k-5k color definitions
 * Constraints: Immutable slugs, visual uniqueness, governance locks
 */

const colorMasterSchema = new mongoose.Schema({
    // ==================== CANONICAL IDENTITY ====================
    canonicalId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        immutable: true,
        description: "Immutable global identifier (e.g., COLOR-BLU-MIDNIGHT)"
    },

    // ==================== IMMUTABLE SLUG ====================
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        immutable: true,
        description: "Permanent URL-safe identifier (never changes)"
    },

    previousSlugs: [{
        type: String,
        lowercase: true,
        description: "Historical slugs for redirect mapping"
    }],

    // ==================== DISPLAY ====================
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        description: "Official color name (e.g., 'Midnight Blue')"
    },

    displayName: {
        type: String,
        required: true,
        trim: true,
        description: "User-facing label"
    },

    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        description: "Internal color code (e.g., 'BLU-MID-001')"
    },

    // ==================== VISUAL DATA ====================
    hexCode: {
        type: String,
        required: true,
        uppercase: true,
        match: /^#[0-9A-F]{6}$/,
        description: "Standard hex value for web display"
    },

    rgbCode: {
        r: { type: Number, required: true, min: 0, max: 255 },
        g: { type: Number, required: true, min: 0, max: 255 },
        b: { type: Number, required: true, min: 0, max: 255 }
    },

    hslCode: {
        h: { type: Number, required: true, min: 0, max: 360 },
        s: { type: Number, required: true, min: 0, max: 100 },
        l: { type: Number, required: true, min: 0, max: 100 }
    },

    cmykCode: {
        c: { type: Number, min: 0, max: 100 },
        m: { type: Number, min: 0, max: 100 },
        y: { type: Number, min: 0, max: 100 },
        k: { type: Number, min: 0, max: 100 }
    },

    pantoneCode: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true,
        description: "Closest PMS match (e.g., 'PMS 289 C')"
    },

    // ==================== CATEGORIZATION ====================
    visualCategory: {
        type: String,
        required: true,
        enum: ['SOLID', 'METALLIC', 'PATTERN', 'GRADIENT', 'NEON', 'TRANSLUCENT', 'MATTE', 'GLOSSY'],
        default: 'SOLID',
        index: true
    },

    colorFamily: {
        type: String,
        required: true,
        enum: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'BLACK', 'WHITE', 'GREY', 'BROWN', 'PINK', 'BEIGE'],
        index: true
    },

    brightness: {
        type: String,
        enum: ['LIGHT', 'MEDIUM', 'DARK'],
        description: "Auto-calculated from HSL lightness"
    },

    // ==================== ASSETS ====================
    swatchImage: {
        type: String,
        description: "URL to swatch image for patterns/textures"
    },

    previewImage: {
        type: String,
        description: "URL to larger preview image"
    },

    // ==================== LIFECYCLE STATE MACHINE ====================
    lifecycleState: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'DEPRECATED', 'LOCKED', 'ARCHIVED'],
        default: 'DRAFT',
        required: true,
        index: true
    },

    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    // ==================== GOVERNANCE ====================
    isLocked: {
        type: Boolean,
        default: false,
        description: "Prevents modification (brand colors)"
    },

    isBrandColor: {
        type: Boolean,
        default: false,
        description: "Official brand palette color"
    },

    isGlobal: {
        type: Boolean,
        default: true,
        description: "Available across all regions"
    },

    approvalStatus: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    approvedAt: Date,

    // ==================== USAGE TRACKING ====================
    usageCount: {
        type: Number,
        default: 0,
        min: 0,
        index: true,
        description: "Number of active variants using this color (event-driven)"
    },

    lastUsedAt: Date,

    // ==================== DEPRECATION ====================
    deprecatedAt: Date,
    deprecationReason: String,

    replacedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ColorMaster',
        sparse: true
    },

    // ==================== SEGMENTATION ====================
    availableChannels: {
        type: [String],
        enum: ['WEB', 'POS', 'B2B', 'APP', 'MARKETPLACE'],
        default: ['WEB']
    },

    availableRegions: {
        type: [String],
        enum: ['US', 'EU', 'APAC', 'GLOBAL'],
        default: ['GLOBAL']
    },

    // ==================== AUDIT ====================
    version: {
        type: Number,
        default: 1,
        min: 1
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    auditLog: [{
        action: { type: String, enum: ['CREATED', 'UPDATED', 'DEPRECATED', 'LOCKED', 'APPROVED', 'REJECTED'] },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        changes: mongoose.Schema.Types.Mixed
    }]

}, {
    timestamps: true,
    collection: 'colormasters',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== COMPOUND INDEXES ====================
// Uniqueness enforcement
colorMasterSchema.index({ slug: 1 }, { unique: true, name: 'idx_color_slug' });
colorMasterSchema.index({ hexCode: 1 }, { unique: true, name: 'idx_color_hex' });
colorMasterSchema.index({ code: 1 }, { unique: true, name: 'idx_color_code' });

// Lookup performance
colorMasterSchema.index(
    { colorFamily: 1, lifecycleState: 1, isActive: 1 },
    { name: 'idx_color_lookup' }
);

// Brand colors
colorMasterSchema.index(
    { isBrandColor: 1, isLocked: 1 },
    { name: 'idx_color_brand' }
);

// Usage tracking
colorMasterSchema.index(
    { usageCount: -1, lastUsedAt: -1 },
    { name: 'idx_color_usage' }
);

// ==================== VIRTUALS ====================
colorMasterSchema.virtual('rgbaString').get(function () {
    return `rgba(${this.rgbCode.r}, ${this.rgbCode.g}, ${this.rgbCode.b}, 1)`;
});

colorMasterSchema.virtual('hslString').get(function () {
    return `hsl(${this.hslCode.h}, ${this.hslCode.s}%, ${this.hslCode.l}%)`;
});

colorMasterSchema.virtual('canDelete').get(function () {
    return this.usageCount === 0 && !this.isLocked && this.lifecycleState === 'ARCHIVED';
});

// ==================== STATIC METHODS ====================
colorMasterSchema.statics.findActive = function () {
    return this.find({
        lifecycleState: 'ACTIVE',
        isActive: true
    }).sort({ colorFamily: 1, name: 1 });
};

colorMasterSchema.statics.findByFamily = function (family) {
    return this.find({
        colorFamily: family,
        lifecycleState: 'ACTIVE',
        isActive: true
    }).sort({ name: 1 });
};

colorMasterSchema.statics.validateTransition = function (currentState, newState) {
    const allowedTransitions = {
        'DRAFT': ['ACTIVE', 'ARCHIVED'],
        'ACTIVE': ['DEPRECATED', 'LOCKED', 'ARCHIVED'],
        'DEPRECATED': ['ARCHIVED'],
        'LOCKED': ['ACTIVE', 'ARCHIVED'],
        'ARCHIVED': []
    };

    return allowedTransitions[currentState]?.includes(newState) || false;
};

// ==================== MIDDLEWARE ====================
colorMasterSchema.pre('save', async function () {
    // Generate canonical ID
    if (this.isNew && !this.canonicalId) {
        const familyCode = this.colorFamily.substring(0, 3);
        const nameCode = this.name.replace(/[^a-zA-Z]/g, '').substring(0, 8).toUpperCase();
        this.canonicalId = `COLOR-${familyCode}-${nameCode}`;
    }

    // Auto-generate RGB from Hex
    if (this.isModified('hexCode') && !this.isModified('rgbCode.r')) {
        const hex = this.hexCode.replace('#', '');
        this.rgbCode = {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }

    // Auto-generate HSL from RGB
    if (this.isModified('rgbCode') && !this.isModified('hslCode.h')) {
        const r = this.rgbCode.r / 255;
        const g = this.rgbCode.g / 255;
        const b = this.rgbCode.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;

        let h = 0, s = 0;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        this.hslCode = {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };

        // Auto-calculate brightness
        if (l < 0.33) this.brightness = 'DARK';
        else if (l < 0.67) this.brightness = 'MEDIUM';
        else this.brightness = 'LIGHT';
    }

    // Lifecycle validation
    if (this.isModified('lifecycleState')) {
        const oldState = this._original?.lifecycleState || 'DRAFT';
        if (!this.constructor.validateTransition(oldState, this.lifecycleState)) {
            throw new Error(`Invalid lifecycle transition: ${oldState} → ${this.lifecycleState}`);
        }
    }

    // Lock enforcement
    if (this.isLocked && !this.isNew && this.isModified()) {
        const allowedFields = ['updatedBy', 'isLocked', 'auditLog', 'usageCount', 'lastUsedAt'];
        const modifiedFields = this.modifiedPaths().filter(p => !allowedFields.includes(p));
        if (modifiedFields.length > 0) {
            throw new Error(`Cannot modify locked color. Modified fields: ${modifiedFields.join(', ')}`);
        }
    }
});

// Prevent deletion if in use
colorMasterSchema.pre('remove', async function (next) {
    if (this.usageCount > 0) {
        throw new Error(`Cannot delete color with ${this.usageCount} active references. Deprecate instead.`);
    }
    if (this.isLocked) {
        throw new Error('Cannot delete locked color');
    }
    next();
});

export default mongoose.models.ColorMaster || mongoose.model('ColorMaster', colorMasterSchema);
