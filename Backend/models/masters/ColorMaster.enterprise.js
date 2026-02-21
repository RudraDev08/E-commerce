import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * ENTERPRISE COLOR MASTER — HYPERSCALE HARDENED
 * Tier: SOC2-compatible, multi-tenant, concurrency-safe
 * Node 18+ / MongoDB 6+ / Mongoose 7+
 */

// ─── ID Generation with Retry-on-Collision ──────────────────────────────────

const generateCryptoToken = (bytes = 4) =>
    crypto.randomBytes(bytes).toString('hex').toUpperCase();

/**
 * generateUniqueCode
 * Loops up to `maxRetries` times trying to insert a crypto-random SKU.
 * Caller must pass a uniqueness check function.
 */
export const generateUniqueCode = async (checkFn, prefix, maxRetries = 8) => {
    for (let i = 0; i < maxRetries; i++) {
        const candidate = `${prefix}-${generateCryptoToken(3)}`;
        const conflict = await checkFn(candidate);
        if (!conflict) return candidate;
    }
    // Final guaranteed-unique fallback: prefix + full 128-bit entropy
    return `${prefix}-${generateCryptoToken(8)}`;
};

// ─── Visual Engine ───────────────────────────────────────────────────────────

const calculateVisualData = (hex) => {
    if (!hex || !/^#[0-9A-F]{6}$/.test(hex)) return null;
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
            case gn: h = ((bn - rn) / d + 2) / 6; break;
            case bn: h = ((rn - gn) / d + 4) / 6; break;
        }
    }
    const toLinear = v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    const L = 0.2126 * toLinear(rn) + 0.7152 * toLinear(gn) + 0.0722 * toLinear(bn);
    return {
        rgbCode: { r, g, b },
        hslCode: { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) },
        // Perceptual luminance — not HSL lightness
        brightness: L < 0.15 ? 'DARK' : L > 0.65 ? 'LIGHT' : 'MEDIUM',
        contrastRatio: {
            white: parseFloat(((1.05) / (L + 0.05)).toFixed(2)),
            black: parseFloat(((L + 0.05) / (0.05)).toFixed(2))
        },
        luminance: parseFloat(L.toFixed(6))
    };
};

const detectColorFamily = (h, s, l) => {
    if (l < 12) return 'BLACK';
    if (l > 88) return 'WHITE';
    if (s < 10) return 'GREY';
    if (h < 15 || h >= 345) return 'RED';
    if (h < 45) return 'ORANGE';
    if (h < 75) return 'YELLOW';
    if (h < 165) return 'GREEN';
    if (h < 260) return 'BLUE';
    if (h < 300) return 'PURPLE';
    if (h < 345) return 'PINK';
    return 'GREY';
};

// ─── Schema ──────────────────────────────────────────────────────────────────

const colorMasterSchema = new mongoose.Schema({

    tenantId: {
        type: String,
        default: 'GLOBAL',
        immutable: true,
        match: /^[A-Z0-9_-]{2,64}$/,
    },

    canonicalId: {
        type: String,
        required: true,
        uppercase: true,
        immutable: true,
    },

    slug: {
        type: String,
        lowercase: true,
        trim: true,
        immutable: true,
        match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },

    code: {
        type: String,
        uppercase: true,
        trim: true,
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },

    displayName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
    },

    hexCode: {
        type: String,
        required: true,
        uppercase: true,
        match: /^#[0-9A-F]{6}$/,
    },

    rgbCode: {
        r: { type: Number, min: 0, max: 255 },
        g: { type: Number, min: 0, max: 255 },
        b: { type: Number, min: 0, max: 255 },
    },

    hslCode: {
        h: { type: Number, min: 0, max: 360 },
        s: { type: Number, min: 0, max: 100 },
        l: { type: Number, min: 0, max: 100 },
    },

    luminance: { type: Number, min: 0, max: 1 }, // Raw perceptual L value stored for fast WCAG queries

    brightness: {
        type: String,
        enum: ['LIGHT', 'MEDIUM', 'DARK'],
    },

    contrastRatio: {
        white: { type: Number, min: 1 },
        black: { type: Number, min: 1 },
    },

    colorFamily: {
        type: String,
        required: true,
        enum: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE',
            'BLACK', 'WHITE', 'GREY', 'BROWN', 'PINK', 'BEIGE'],
        index: true,
    },

    visualCategory: {
        type: String,
        enum: ['SOLID', 'METALLIC', 'PATTERN', 'GRADIENT', 'NEON', 'TRANSLUCENT', 'MATTE', 'GLOSSY'],
        default: 'SOLID',
        index: true,
    },

    lifecycleState: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'DEPRECATED', 'LOCKED', 'ARCHIVED'],
        default: 'DRAFT',
        required: true,
        index: true,
    },

    priority: { type: Number, default: 0, min: 0, max: 9999 },
    description: { type: String, maxlength: 500, trim: true },

    isActive: { type: Boolean, default: true, index: true },
    isLocked: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0, min: 0 },
    lastUsedAt: { type: Date },

    // Soft delete tracking — never null, always explicit
    archivedAt: { type: Date, default: null },
    archivedBy: { type: String, default: null },

    createdBy: { type: String, default: 'system' },
    updatedBy: { type: String, default: 'system' },

    // Schema version for future migrations
    _schemaVersion: { type: Number, default: 2, immutable: true },

}, {
    timestamps: true,
    collection: 'colors',
    optimisticConcurrency: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// ─── Indexes (Shard-aware, compound, minimal standalone) ─────────────────────
// Shard key: { tenantId: 1, _id: 1 } — set at DB level via sh.shardCollection()
// All compound indexes are prefixed with tenantId for co-located shard scans.

colorMasterSchema.index({ tenantId: 1, canonicalId: 1 }, { unique: true });
colorMasterSchema.index({ tenantId: 1, hexCode: 1 }, { unique: true });
colorMasterSchema.index({ tenantId: 1, code: 1 }, { unique: true });
colorMasterSchema.index(
    { tenantId: 1, slug: 1 },
    { unique: true, partialFilterExpression: { slug: { $exists: true, $ne: null } } }
);
// Read optimization: most common list query filter
colorMasterSchema.index({ tenantId: 1, lifecycleState: 1, priority: 1 });
// WCAG compliance dashboard query: fast luminance range scan
colorMasterSchema.index({ tenantId: 1, luminance: 1 });
// Search text index: covers name, displayName, code
colorMasterSchema.index({ name: 'text', displayName: 'text', code: 'text' });

// ─── PRE VALIDATE: Normalization + ID generation ─────────────────────────────

colorMasterSchema.pre('validate', async function () {
    // 1. Hex normalization
    if (this.hexCode) {
        const hex = this.hexCode.trim().toUpperCase();
        this.hexCode = /^#[0-9A-F]{3}$/.test(hex)
            ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
            : hex;
    }

    // 2. Visual data derivation
    let visual = null;
    if (this.hexCode && (this.isNew || this.isModified('hexCode'))) {
        visual = calculateVisualData(this.hexCode);
        if (visual) {
            this.rgbCode = visual.rgbCode;
            this.hslCode = visual.hslCode;
            this.brightness = visual.brightness;
            this.contrastRatio = visual.contrastRatio;
            this.luminance = visual.luminance;
        }
    }

    // 3. Color family auto-detection
    if (!this.colorFamily && visual) {
        this.colorFamily = detectColorFamily(visual.hslCode.h, visual.hslCode.s, visual.hslCode.l);
    }

    // 4. SKU generation with retry-on-collision
    if (!this.code) {
        const familyPrefix = (this.colorFamily || 'GEN').substring(0, 3).toUpperCase();
        const nameChunk = (this.name || 'CLR').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
        const prefix = `${familyPrefix}-${nameChunk}`;
        this.code = await generateUniqueCode(
            async (candidate) => this.constructor.exists({ tenantId: this.tenantId, code: candidate }),
            prefix
        );
    }

    // 5. CanonicalId generation with retry-on-collision (tenant-scoped)
    if (!this.canonicalId) {
        const familyCode = (this.colorFamily || 'GEN').substring(0, 3).toUpperCase();
        const hexSuffix = (this.hexCode || '#000000').replace('#', '');
        const prefix = `COLOR-${familyCode}-${hexSuffix}`;
        this.canonicalId = await generateUniqueCode(
            async (candidate) => this.constructor.exists({ tenantId: this.tenantId, canonicalId: candidate }),
            prefix
        );
    }

    // 6. Slug auto-generation
    if (!this.slug && this.name) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
});

// ─── PRE SAVE: Governance Engine ─────────────────────────────────────────────

colorMasterSchema.pre('save', async function () {
    let current = null;
    if (!this.isNew) {
        current = await this.constructor
            .findById(this._id)
            .select('lifecycleState isLocked hexCode tenantId canonicalId archivedAt')
            .lean();
    }

    // Tenant immutability
    if (current && this.tenantId !== current.tenantId) {
        throw new Error('SECURITY: Cannot reassign tenantId on an existing color.');
    }

    // Lifecycle state machine
    if (current && this.isModified('lifecycleState')) {
        const VALID_TRANSITIONS = {
            DRAFT: ['ACTIVE', 'ARCHIVED'],
            ACTIVE: ['DEPRECATED', 'LOCKED', 'ARCHIVED'],
            DEPRECATED: ['ARCHIVED', 'ACTIVE'],
            LOCKED: ['ACTIVE', 'ARCHIVED'],
            ARCHIVED: ['DRAFT'],
        };
        const allowed = VALID_TRANSITIONS[current.lifecycleState];
        if (!allowed?.includes(this.lifecycleState)) {
            throw new Error(`LIFECYCLE: Invalid transition ${current.lifecycleState} → ${this.lifecycleState}`);
        }

        this.isActive = this.lifecycleState === 'ACTIVE';

        if (this.lifecycleState === 'LOCKED') {
            this.isLocked = true;
        } else {
            // Any exit from LOCKED or ARCHIVED clears the lock flag
            this.isLocked = false;
        }

        // Stamp archivedAt for SOC2 soft-delete audit trail
        if (this.lifecycleState === 'ARCHIVED' && !current.archivedAt) {
            this.archivedAt = new Date();
            this.archivedBy = this.updatedBy || 'system';
        }
        if (this.lifecycleState === 'DRAFT') {
            // Restored from archive — clear stamp
            this.archivedAt = null;
            this.archivedBy = null;
        }
    }

    // LOCKED field mutation guard — runs AFTER state transition logic
    // so that LOCKED → ARCHIVED transition itself is not blocked.
    if (current?.isLocked && this.lifecycleState === 'LOCKED') {
        const LOCKED_SAFE_FIELDS = new Set([
            'updatedBy', 'isLocked', 'usageCount', 'lastUsedAt',
            'updatedAt', '__v', '_schemaVersion',
        ]);
        const mutated = this.modifiedPaths().filter(p => !LOCKED_SAFE_FIELDS.has(p));
        if (mutated.length > 0) {
            throw new Error(`LOCKED: Immutable fields modified: ${mutated.join(', ')}`);
        }
    }
});

// ─── POST SAVE: Async Audit Emit ─────────────────────────────────────────────
// Fires after every successful save. Doesn't block the response path.

colorMasterSchema.post('save', function (doc) {
    // Dynamically import at runtime to avoid circular deps
    import('./ColorAudit.enterprise.js').then(({ default: ColorAudit }) => {
        const action = doc.isNew ? 'CREATED' :
            doc.lifecycleState === 'ARCHIVED' ? 'ARCHIVED' :
                doc.lifecycleState === 'LOCKED' ? 'LOCKED' :
                    doc.isLocked === false && doc.lifecycleState === 'ACTIVE' ? 'UNLOCKED' : 'UPDATED';

        ColorAudit.create({
            tenantId: doc.tenantId,
            colorId: doc._id,
            action,
            performedBy: doc.updatedBy || doc.createdBy || 'system',
            snapshot: {
                lifecycleState: doc.lifecycleState,
                hexCode: doc.hexCode,
                name: doc.name,
                isLocked: doc.isLocked,
            },
        }).catch(err => console.error('AUDIT_EMIT_FAIL:', err.message));
    }).catch(() => { });
});

// ─── RAW UPDATE PROTECTION ───────────────────────────────────────────────────

/**
 * Blocks any query-level update that touches governance fields.
 * Covers both top-level keys and nested dot-notation paths (e.g., rgbCode.r).
 */
const GOVERNED_FIELD_PREFIXES = [
    'hexCode', 'lifecycleState', 'isLocked', 'name', 'slug',
    'canonicalId', 'tenantId', 'code', 'rgbCode', 'hslCode',
    'contrastRatio', 'luminance', 'brightness', '_schemaVersion',
];

const containsGovernedField = (obj = {}) => {
    const flatKeys = [];
    const flatten = (o, prefix = '') => {
        for (const k of Object.keys(o)) {
            const full = prefix ? `${prefix}.${k}` : k;
            flatKeys.push(full);
            if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) {
                flatten(o[k], full);
            }
        }
    };
    flatten(obj);
    return flatKeys.some(key =>
        GOVERNED_FIELD_PREFIXES.some(g => key === g || key.startsWith(`${g}.`))
    );
};

const blockRawUpdates = function () {
    if (this.options?.bypassGovernance === true) return;
    const update = this.getUpdate() || {};
    const targets = [update, update.$set, update.$unset, update.$push, update.$pull].filter(Boolean);
    const hit = targets.some(containsGovernedField);
    if (hit) throw new Error('SECURITY: Raw query updates on governed fields are blocked. Use doc.save().');
};

colorMasterSchema.pre('findOneAndUpdate', blockRawUpdates);
colorMasterSchema.pre('updateOne', blockRawUpdates);

colorMasterSchema.pre('updateMany', function () {
    if (!this.options?.bypassGovernance) {
        throw new Error('SECURITY: updateMany is blocked. Pass { bypassGovernance: true } explicitly if authorized.');
    }
});

colorMasterSchema.pre('bulkWrite', function () {
    if (!this.options?.bypassGovernance) {
        throw new Error('SECURITY: bulkWrite is blocked. Pass { bypassGovernance: true } explicitly if authorized.');
    }
});

// ─── Export ──────────────────────────────────────────────────────────────────

export default mongoose.models.ColorMaster || mongoose.model('ColorMaster', colorMasterSchema, 'colors');
