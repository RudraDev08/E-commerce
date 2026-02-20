import mongoose from 'mongoose';

/**
 * ENTERPRISE COLOR MASTER (HARDENED & VALIDATION SAFE)
 * Scope: Multi-tenant global color palette registry
 */

const colorMasterSchema = new mongoose.Schema({
    tenantId: {
        type: String,
        default: 'GLOBAL',
        index: true,
        immutable: true
    },

    canonicalId: {
        type: String,
        required: true,
        uppercase: true,
        immutable: true,
        unique: true
    },

    slug: {
        type: String,
        lowercase: true,
        trim: true,
        immutable: true
    },

    // 1. SKU Code: Removed 'required: true' to allow backend auto-generation
    code: {
        type: String,
        uppercase: true,
        trim: true,
        index: true
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    displayName: {
        type: String,
        required: true,
        trim: true
    },

    hexCode: {
        type: String,
        required: true,
        uppercase: true,
        match: /^#[0-9A-F]{6}$/
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

    brightness: {
        type: String,
        enum: ['LIGHT', 'MEDIUM', 'DARK']
    },

    contrastRatio: {
        white: Number,
        black: Number
    },

    colorFamily: {
        type: String,
        required: true,
        enum: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'BLACK', 'WHITE', 'GREY', 'BROWN', 'PINK', 'BEIGE'],
        index: true
    },

    visualCategory: {
        type: String,
        enum: ['SOLID', 'METALLIC', 'PATTERN', 'GRADIENT', 'NEON', 'TRANSLUCENT', 'MATTE', 'GLOSSY'],
        default: 'SOLID',
        index: true
    },

    lifecycleState: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'DEPRECATED', 'LOCKED', 'ARCHIVED'],
        default: 'DRAFT',
        required: true,
        index: true
    },

    isActive: { type: Boolean, default: true, index: true },
    isLocked: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0, min: 0 },

    createdBy: { type: mongoose.Schema.Types.Mixed },
    updatedBy: { type: mongoose.Schema.Types.Mixed },

    auditLog: [{
        action: String,
        by: mongoose.Schema.Types.Mixed,
        at: { type: Date, default: Date.now },
        changes: mongoose.Schema.Types.Mixed
    }]

}, {
    timestamps: true,
    collection: 'colormasters',
    optimisticConcurrency: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
colorMasterSchema.index({ tenantId: 1, slug: 1 }, { unique: true, partialFilterExpression: { slug: { $exists: true } } });
colorMasterSchema.index({ tenantId: 1, hexCode: 1 }, { unique: true });
colorMasterSchema.index({ tenantId: 1, code: 1 }, { unique: true });

// Visual Calculator
const calculateVisualData = (hex) => {
    if (!hex || !/^#[0-9A-F]{6}$/.test(hex)) return null;

    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    const rAttributes = r / 255, gAttributes = g / 255, bAttributes = b / 255;
    const max = Math.max(rAttributes, gAttributes, bAttributes);
    const min = Math.min(rAttributes, gAttributes, bAttributes);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rAttributes: h = ((gAttributes - bAttributes) / d + (gAttributes < bAttributes ? 6 : 0)) / 6; break;
            case gAttributes: h = ((bAttributes - rAttributes) / d + 2) / 6; break;
            case bAttributes: h = ((rAttributes - gAttributes) / d + 4) / 6; break;
        }
    }

    const luminanceTerms = [rAttributes, gAttributes, bAttributes].map(v =>
        v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    );
    const L = 0.2126 * luminanceTerms[0] + 0.7152 * luminanceTerms[1] + 0.0722 * luminanceTerms[2];

    return {
        rgbCode: { r, g, b },
        hslCode: { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) },
        brightness: l < 0.33 ? 'DARK' : l < 0.67 ? 'MEDIUM' : 'LIGHT',
        contrastRatio: {
            white: parseFloat(((1.0 + 0.05) / (L + 0.05)).toFixed(2)),
            black: parseFloat(((L + 0.05) / (0.0 + 0.05)).toFixed(2))
        }
    };
};

// 8. Optional Auto-Detection for colorFamily from HSL Hue
const detectColorFamily = (h, s, l) => {
    if (l < 12) return 'BLACK';
    if (l > 88) return 'WHITE';
    if (s < 10) return 'GREY';

    // Hue ranges for major families
    if (h < 15 || h >= 345) return 'RED';
    if (h < 45) return 'ORANGE';
    if (h < 75) return 'YELLOW';
    if (h < 165) return 'GREEN';
    if (h < 260) return 'BLUE';
    if (h < 300) return 'PURPLE';
    if (h < 345) return 'PINK';

    return 'GREY'; // Fallback
};

/**
 * PRE('VALIDATE') - Automatic Generation Hook
 */
colorMasterSchema.pre('validate', function () {
    // 1. Hex Normalization
    if (this.hexCode) {
        const hex = this.hexCode.trim().toUpperCase();
        if (/^#[0-9A-F]{3}$/.test(hex)) {
            const [, r, g, b] = hex.split('');
            this.hexCode = `#${r}${r}${g}${g}${b}${b}`;
        } else {
            this.hexCode = hex;
        }
    }

    // 2. Visual Data Generation
    let visual = null;
    if (this.hexCode && (this.isNew || this.isModified('hexCode'))) {
        visual = calculateVisualData(this.hexCode);
        if (visual) {
            this.rgbCode = visual.rgbCode;
            this.hslCode = visual.hslCode;
            this.brightness = visual.brightness;
            this.contrastRatio = visual.contrastRatio;
        }
    }

    // 3. Auto-Detect Color Family (if missing or hex changed)
    if (!this.colorFamily && visual) {
        this.colorFamily = detectColorFamily(visual.hslCode.h, visual.hslCode.s, visual.hslCode.l);
    }

    // 4. SKU Auto-Generation Strategy (Sequence based fallback to timestamp)
    if (this.isNew && !this.code) {
        const familyPrefix = (this.colorFamily || 'GEN').substring(0, 3).toUpperCase();
        const shortName = (this.name || 'CLR').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
        // Strategy: [FAMILY]-[NAME]-[TIMESTAMP_SLICE]
        // Example: RED-SCR-982341
        this.code = `${familyPrefix}-${shortName}-${Date.now().toString().slice(-6)}`;
    }

    // 5. Canonical ID
    if (this.isNew && !this.canonicalId) {
        const familyCode = (this.colorFamily || 'GEN').substring(0, 3).toUpperCase();
        const hexSuffix = (this.hexCode || '#000000').replace('#', '').substring(0, 6);
        this.canonicalId = `COLOR-${familyCode}-${hexSuffix}-${Date.now().toString().slice(-4)}`;
    }

    // 6. Auto-Slug
    if (!this.slug && this.name) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
});

/**
 * PRE('SAVE') - Async Governance
 */
colorMasterSchema.pre('save', async function () {
    let current = null;
    if (!this.isNew) {
        current = await this.constructor.findById(this._id).select('lifecycleState isLocked hexCode tenantId').lean();
    }

    if (current && this.tenantId !== current.tenantId) throw new Error('Cannot move color between tenants');

    if (current?.isLocked && this.isLocked !== false) {
        const safe = ['updatedBy', 'isLocked', 'auditLog', 'usageCount', 'lastUsedAt', 'updatedAt'];
        const modified = this.modifiedPaths().filter(p => !safe.includes(p));
        if (modified.length > 0) throw new Error(`LOCKED: Cannot modify ${modified.join(', ')}`);
    }

    if (current && this.isModified('lifecycleState')) {
        const VALID_TRANSITIONS = {
            DRAFT: ['ACTIVE', 'ARCHIVED'],
            ACTIVE: ['DEPRECATED', 'LOCKED', 'ARCHIVED'],
            DEPRECATED: ['ARCHIVED', 'ACTIVE'],
            LOCKED: ['ACTIVE'],
            ARCHIVED: ['DRAFT']
        };
        const allowed = VALID_TRANSITIONS[current.lifecycleState];
        if (!allowed?.includes(this.lifecycleState)) throw new Error(`Invalid Transition: ${current.lifecycleState} -> ${this.lifecycleState}`);
        this.isActive = this.lifecycleState === 'ACTIVE';
        if (this.lifecycleState === 'LOCKED') this.isLocked = true;
    }
});

// RAW UPDATE SECURITY
const blockRawUpdates = function () {
    const update = this.getUpdate();
    const unsafe = ['hexCode', 'lifecycleState', 'isLocked', 'name', 'slug'];
    const hasUnsafe = unsafe.some(k => (update.$set && update.$set[k]) || update[k]);
    if (hasUnsafe) throw new Error('SECURITY: Use doc.save() for content updates.');
};
colorMasterSchema.pre('findOneAndUpdate', blockRawUpdates);
colorMasterSchema.pre('updateOne', blockRawUpdates);

export default mongoose.models.ColorMaster || mongoose.model('ColorMaster', colorMasterSchema);
