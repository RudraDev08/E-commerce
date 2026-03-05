import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
    label: { type: String, default: 'Home' },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false }
}, { _id: true });

// ── Enterprise permission constants ─────────────────────────────────────────
export const ALL_PERMISSIONS = [
    'product.create', 'product.update', 'product.delete', 'product.publish',
    'category.create', 'category.update', 'category.delete',
    'brand.create', 'brand.update', 'brand.delete',
    'inventory.view', 'inventory.adjust', 'inventory.transfer',
    'order.view', 'order.update', 'order.refund', 'order.cancel',
    'user.view', 'user.create', 'user.update', 'user.block',
    'analytics.view',
    'system.view', 'system.configure'
];

// Default permission bundles per role
export const ROLE_PERMISSIONS = {
    super_admin: ALL_PERMISSIONS,
    admin: [
        'product.create', 'product.update', 'product.delete', 'product.publish',
        'category.create', 'category.update', 'category.delete',
        'brand.create', 'brand.update', 'brand.delete',
        'inventory.view', 'inventory.adjust', 'inventory.transfer',
        'order.view', 'order.update', 'order.refund', 'order.cancel',
        'user.view', 'analytics.view', 'system.view'
    ],
    manager: [
        'product.create', 'product.update', 'product.publish',
        'category.create', 'category.update',
        'brand.create', 'brand.update',
        'inventory.view', 'inventory.adjust', 'inventory.transfer',
        'order.view', 'order.update', 'analytics.view'
    ],
    staff: [
        'product.update',
        'inventory.view', 'inventory.adjust',
        'order.view', 'order.update'
    ],
    customer: []
};

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
        index: true
    },
    passwordHash: {
        type: String,
        required: true,
        select: false   // Never returned in queries by default
    },
    role: {
        type: String,
        enum: ['customer', 'staff', 'manager', 'admin', 'super_admin'],
        default: 'customer',
        index: true
    },

    // ── Enterprise: granular permissions ─────────────────────────────────────
    // When empty, the role's default ROLE_PERMISSIONS bundle is used.
    // Populate this array to OVERRIDE or EXTEND the role defaults.
    permissions: {
        type: [String],
        enum: ALL_PERMISSIONS,
        default: []
    },

    addresses: [addressSchema],

    // Account state
    isBlocked: { type: Boolean, default: false, index: true },
    blockReason: { type: String, default: '' },
    blockedAt: { type: Date },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Auth helpers
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },

    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, {
    timestamps: true
});

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ role: 1, isBlocked: 1 });
userSchema.index({ createdAt: -1 });

// ── Pre-save: hash password on create / change ─────────────────────────────
userSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) return;
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    this.passwordChangedAt = new Date();
});

// ── Instance: compare plain password ─────────────────────────────────────────
userSchema.methods.comparePassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.passwordHash);
};

// ── Instance: check if password changed after JWT was issued ─────────────────
userSchema.methods.passwordChangedAfter = function (jwtIssuedAt) {
    if (this.passwordChangedAt) {
        return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIssuedAt;
    }
    return false;
};

// ── Instance: resolve effective permissions ───────────────────────────────────
// Returns the union of role defaults + any custom overrides on this user.
userSchema.methods.getPermissions = function () {
    const defaults = ROLE_PERMISSIONS[this.role] || [];
    if (!this.permissions || this.permissions.length === 0) return defaults;
    return [...new Set([...defaults, ...this.permissions])];
};

// ── Instance: permission check helper ────────────────────────────────────────
userSchema.methods.hasPermission = function (permission) {
    return this.getPermissions().includes(permission);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;

