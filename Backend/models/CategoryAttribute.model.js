/**
 * CategoryAttribute — Junction Model
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements the Many-to-Many relationship between Category ↔ AttributeType.
 *
 * Why a junction model instead of an embedded array?
 *   ✅ Per-category ordering / isRequired overrides without touching the global
 *      AttributeType document.
 *   ✅ Supports multi-tenant extensions (tenantId) without schema migration.
 *   ✅ Indexed lookups are O(log n) on categoryId — no full-collection scans.
 *   ✅ Cascade soft-delete: when a Category is soft-deleted we can filter here.
 *
 * Schema Relationship Map:
 *   categories  ───┐
 *                  ├── category_attributes (this table)
 *   attributetypes ┘            │
 *                               ▼
 *                        attributevalues (attributeType FK)
 *
 * @module CategoryAttribute
 */

import mongoose from 'mongoose';

const categoryAttributeSchema = new mongoose.Schema(
    {
        // ── FOREIGN KEYS ────────────────────────────────────────────────────────
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'categoryId is required'],
            index: true,
        },

        attributeTypeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AttributeType',
            required: [true, 'attributeTypeId is required'],
            index: true,
        },

        // ── PER-CATEGORY OVERRIDES ──────────────────────────────────────────────
        /**
         * Override the global AttributeType.validationRules.isRequired for this
         * specific category.  e.g. "Processor" is isRequired=true for Phones but
         * might be optional for Accessories.
         */
        isRequired: {
            type: Boolean,
            default: false,
        },

        /**
         * Display order *within this category*.  Allows categories to reorder
         * attributes independently of the global AttributeType.sortingConfig.
         */
        displayOrder: {
            type: Number,
            default: 0,
            index: true,
        },

        /**
         * Visual grouping label in the frontend (e.g. "Performance", "Display").
         * Optional, purely presentational.
         */
        groupLabel: {
            type: String,
            trim: true,
            maxlength: 100,
        },

        // ── SOFT DELETE ──────────────────────────────────────────────────────────
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        deletedAt: { type: Date },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        // Collection name kept predictable for DBA queries
        collection: 'category_attributes',
    }
);

// ── INDEXES ────────────────────────────────────────────────────────────────────
// Composite unique: one attribute type per category (no duplicates)
categoryAttributeSchema.index(
    { categoryId: 1, attributeTypeId: 1 },
    { unique: true, name: 'uq_category_attribute' }
);

// Fast ordered fetch for the GET /api/attributes?categoryId endpoint
categoryAttributeSchema.index(
    { categoryId: 1, isDeleted: 1, displayOrder: 1 },
    { name: 'idx_category_active_ordered' }
);

// ── STATIC HELPERS ─────────────────────────────────────────────────────────────
/**
 * Returns all active CategoryAttribute links for a given categoryId,
 * already sorted by displayOrder.
 */
categoryAttributeSchema.statics.findActiveByCategory = function (categoryId) {
    return this.find({ categoryId, isDeleted: false }).sort({ displayOrder: 1 });
};

/**
 * Soft-delete all associations when a category is removed.
 * Call from the Category pre-remove hook or a service layer.
 */
categoryAttributeSchema.statics.softDeleteByCategory = function (categoryId, session) {
    return this.updateMany(
        { categoryId },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        session ? { session } : {}
    );
};

const CategoryAttribute =
    mongoose.models.CategoryAttribute ||
    mongoose.model('CategoryAttribute', categoryAttributeSchema);

export default CategoryAttribute;
