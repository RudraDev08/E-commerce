import mongoose from 'mongoose';

const colorSchema = new mongoose.Schema({
    // ==================== IDENTITY ====================
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        description: "Official color name (e.g., 'Midnight Blue', 'Charcoal Grey')",
        maxlength: 100
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },

    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        description: "Internal color code (e.g., 'BLU-MID', 'GRY-CHR')"
    },

    isActive: {
        type: Boolean,
        default: true
    },

    // ==================== VISUAL DATA ====================
    hexCode: {
        type: String,
        required: true,
        uppercase: true,
        match: /^#[0-9A-Fa-f]{6}$/,
        description: "Standard hex value for web display",
        index: true
    },

    rgbCode: {
        r: { type: Number, min: 0, max: 255 },
        g: { type: Number, min: 0, max: 255 },
        b: { type: Number, min: 0, max: 255 }
    },

    hslCode: {
        h: { type: Number, min: 0, max: 360 },
        s: { type: Number, min: 0, max: 100 },
        l: { type: Number, min: 0, max: 100 }
    },

    pantoneCode: {
        type: String,
        trim: true,
        uppercase: true,
        description: "Closest PMS match (e.g., 'PMS 289 C')"
    },

    // ==================== FAMILY & GROUPING ====================
    category: {
        type: String,
        required: true,
        enum: ['solid', 'metallic', 'pattern', 'gradient', 'neon', 'translucent'],
        default: 'solid',
        index: true
    },

    colorFamily: {
        type: String,
        enum: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'black', 'white', 'grey', 'brown', 'pink'],
        description: "High-level grouping for filtering",
        required: true,
        index: true
    },

    // ==================== GOVERNANCE & LIFECYCLE ====================
    status: {
        type: String,
        enum: ['draft', 'active', 'deprecated', 'locked'],
        default: 'active',
        index: true
    },

    isLocked: {
        type: Boolean,
        default: false,
        description: "Prevents accidental modification"
    },

    isGlobal: {
        type: Boolean,
        default: true,
        description: "If true, available across all regions globally"
    },

    previousSlugs: [{
        type: String,
        lowercase: true
    }],

    usageCount: {
        type: Number,
        default: 0,
        description: "Auto-incremented count of SKUs using this color",
        index: true
    },

    // ==================== AUDIT ====================
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
// Performance lookup
colorSchema.index({ slug: 1, status: 1 });
colorSchema.index({ colorFamily: 1, isActive: 1 });

// Uniqueness Enforcement (beyond simple unique constraints)
colorSchema.index({ hexCode: 1 }, { unique: true });

// ==================== VIRTUALS & METHODS ====================
colorSchema.virtual('rgbaString').get(function () {
    if (this.rgbCode && this.rgbCode.r !== undefined) {
        return `rgba(${this.rgbCode.r}, ${this.rgbCode.g}, ${this.rgbCode.b}, 1)`;
    }
    return '';
});

// Auto-generate RGB from Hex
colorSchema.pre('save', function (next) {
    if (this.hexCode && (!this.rgbCode || !this.rgbCode.r)) {
        const hex = this.hexCode.replace('#', '');
        this.rgbCode = {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }
    // Auto-slug
    if (!this.slug && this.name) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    next();
});

export default mongoose.models.ColorMaster || mongoose.model('ColorMaster', colorSchema);
