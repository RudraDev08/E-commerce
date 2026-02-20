import mongoose from 'mongoose';

/**
 * ENTERPRISE COLOR MASTER (HARDENED & VALIDATION SAFE)
 * Scope: Multi-tenant global color palette registry
 * Scale: 100k+ color definitions (High Concurrency)
 * Constraints: OCC, Immutable Identity, Schema-Level Governance, Audit Trails
 */

const colorMasterSchema = new mongoose.Schema({
    // ==================== TENANCY ====================
    tenantId: {
        type: String,
        default: 'GLOBAL',
        index: true,
        immutable: true,
        description: "Partition key for multi-tenant support"
    },

    // ==================== IDENTIFIERS ====================
    canonicalId: {
        type: String,
        // REQUIRED but generated in pre('validate')
        // We keep required: true to ensure it exists before DB save
        required: true,
        uppercase: true,
        immutable: true,
        unique: true
    },

    slug: {
        type: String,
        lowercase: true,
        trim: true,
        immutable: true,
        unique: true
    },

    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        description: "Internal SKU segment (e.g., 'BLU-MID-001')"
    },

    // ==================== DISPLAY & INPUT ====================
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

    // ==================== DERIVED VISUAL DATA (Auto-Generated) ====================
    // Note: NOT required because they are computed from hexCode
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

    // ==================== CATEGORIZATION ====================
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

    // ==================== GOVERNANCE ====================
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

    // ==================== AUDIT ====================
    createdBy: {
        type: mongoose.Schema.Types.Mixed, // Relaxed to allow "admin" string or ObjectId
        description: "User ID or System Identifier"
    },
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

// ==================== INDEXES ====================
colorMasterSchema.index({ tenantId: 1, slug: 1 }, { unique: true, partialFilterExpression: { slug: { $exists: true } } });
colorMasterSchema.index({ tenantId: 1, hexCode: 1 }, { unique: true });
colorMasterSchema.index({ tenantId: 1, code: 1 }, { unique: true });
colorMasterSchema.index({ canonicalId: 1 }, { unique: true }); // Global unique ID

// ==================== HELPER: VISUAL CALCULATION ====================
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

    // Luminance & Contrast
    const luminanceTerms = [rAttributes, gAttributes, bAttributes].map(v =>
        v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    );
    const L = 0.2126 * luminanceTerms[0] + 0.7152 * luminanceTerms[1] + 0.0722 * luminanceTerms[2];

    const whiteRatio = (1.0 + 0.05) / (L + 0.05);
    const blackRatio = (L + 0.05) / (0.0 + 0.05);

    return {
        rgbCode: { r, g, b },
        hslCode: { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) },
        brightness: l < 0.33 ? 'DARK' : l < 0.67 ? 'MEDIUM' : 'LIGHT',
        contrastRatio: {
            white: parseFloat(whiteRatio.toFixed(2)),
            black: parseFloat(blackRatio.toFixed(2))
        }
    };
};

// ==================== CRITICAL: PRE-VALIDATION HOOK (Auto-Generation) ====================
// Runs BEFORE 'required' checks. Solves the "Chicken & Egg" problem.
colorMasterSchema.pre('validate', function (next) {
    // 1. Generate Canonical ID if missing
    if (this.isNew && !this.canonicalId) {
        // Fallback for missing name/family to prevent crash, though validations will catch them later
        const familyCode = (this.colorFamily || 'GEN').substring(0, 3).toUpperCase();
        const nameCode = (this.name || 'UNKNOWN').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
        this.canonicalId = `COLOR-${familyCode}-${nameCode}-${Date.now().toString().slice(-6)}`;
    }

    // 2. Generate Visual Data
    if (this.hexCode && (this.isNew || this.isModified('hexCode'))) {
        const visual = calculateVisualData(this.hexCode);
        if (visual) {
            this.rgbCode = visual.rgbCode;
            this.hslCode = visual.hslCode;
            this.brightness = visual.brightness;
            this.contrastRatio = visual.contrastRatio;
        }
    }

    // 3. Auto-Slug (optional but good for URL safety)
    if (!this.slug && this.name) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    next();
});

// ==================== GOVERNANCE: PRE-SAVE HOOK ====================
// Runs AFTER validation. Handles locks, transitions, and isolation.
colorMasterSchema.pre('save', async function (next) {
    // Only fetch for updates
    let current = null;
    if (!this.isNew) {
        current = await this.constructor.findById(this._id).select('lifecycleState isLocked hexCode tenantId').lean();
    }

    // 1. Tenant Isolation
    if (current && this.tenantId !== current.tenantId) throw new Error('Cannot move color between tenants');

    // 2. Lock Enforcement
    if (current?.isLocked && this.isLocked !== false) {
        const safe = ['updatedBy', 'isLocked', 'auditLog', 'usageCount', 'lastUsedAt', 'updatedAt'];
        const modified = this.modifiedPaths().filter(p => !safe.includes(p));
        if (modified.length > 0) throw new Error(`LOCKED: Cannot modify ${modified.join(', ')}`);
    }

    // 3. Lifecycle Validation
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

// ==================== SAFE DELETION ====================
colorMasterSchema.pre('deleteOne', { document: true, query: false }, async function () {
    if (this.usageCount > 0) throw new Error(`Dependency Error: Used by ${this.usageCount} variants.`);
    if (this.lifecycleState !== 'ARCHIVED' && this.lifecycleState !== 'DRAFT') throw new Error('Only ARCHIVED/DRAFT colors can be deleted.');
    if (this.isLocked) throw new Error('Locked colors cannot be deleted.');
});

// ==================== RAW UPDATE SECURITY ====================
// Prevents bypassing validation via findOneAndUpdate
const blockRawUpdates = function (next) {
    const update = this.getUpdate();
    const unsafe = ['hexCode', 'lifecycleState', 'isLocked', 'name', 'slug'];
    const hasUnsafe = unsafe.some(k => (update.$set && update.$set[k]) || update[k]);

    // Whitelist $inc for usageCount
    if (hasUnsafe) throw new Error('SECURITY: Use doc.save() for content updates.');
    next();
};
colorMasterSchema.pre('findOneAndUpdate', blockRawUpdates);
colorMasterSchema.pre('updateOne', blockRawUpdates);

export default mongoose.models.ColorMaster || mongoose.model('ColorMaster', colorMasterSchema);
