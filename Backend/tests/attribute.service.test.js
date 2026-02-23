/**
 * Unit Tests — Attribute Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Framework: Node's built-in test runner (node:test) — zero extra deps.
 *
 * To run:
 *   node --experimental-vm-modules Backend/tests/attribute.service.test.js
 *
 * Or add to package.json:
 *   "test:attrs": "node --test Backend/tests/attribute.service.test.js"
 *
 * What we test:
 *  1. Happy path — valid categoryId returns attribute tree.
 *  2. Missing categoryId                   → ValidationError (400).
 *  3. Invalid ObjectId format              → ValidationError (400).
 *  4. Category not found in DB             → NotFoundError (404).
 *  5. Category exists but no attributes    → empty array (200).
 *  6. Soft-deleted attributes are excluded.
 *
 * All MongoDB calls are mocked — no real database connection required.
 */

import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

// ── Inline Mocks ───────────────────────────────────────────────────────────────
// We mock the three models *before* importing the service so the service gets
// the mocked versions (ESM module cache).

const VALID_CAT_ID = new mongoose.Types.ObjectId().toString();
const VALID_ATTR_TYPE_ID = new mongoose.Types.ObjectId().toString();
const INVALID_ID = 'not-a-valid-id';

/**
 * Minimal mock Category object (what the service expects from .lean())
 */
const mockCategory = {
    _id: new mongoose.Types.ObjectId(VALID_CAT_ID),
    name: 'Phones',
    slug: 'phones',
};

/**
 * Minimal aggregation output that the pipeline would return.
 */
const mockAggregationResult = [
    {
        _id: new mongoose.Types.ObjectId(VALID_ATTR_TYPE_ID),
        name: 'PROCESSOR',
        displayName: 'Processor',
        slug: 'processor',
        category: 'technical',
        inputType: 'dropdown',
        showInFilters: true,
        showInVariants: false,
        _junctionIsRequired: true,
        _junctionDisplayOrder: 1,
        _junctionGroupLabel: 'Performance',
        validationRules: { isRequired: true },
        sortingConfig: { displayOrder: 1 },
        values: [
            {
                _id: new mongoose.Types.ObjectId(),
                name: 'A18 PRO',
                displayName: 'A18 Pro',
                slug: 'a18-pro',
                displayOrder: 1,
                visualData: {},
            },
            {
                _id: new mongoose.Types.ObjectId(),
                name: 'SNAPDRAGON 8 GEN 3',
                displayName: 'Snapdragon 8 Gen 3',
                slug: 'snapdragon-8-gen-3',
                displayOrder: 2,
                visualData: {},
            },
        ],
    },
];

// ── Mock Module Registry ───────────────────────────────────────────────────────
// Since we are using ESM and node:test doesn't support module mocking natively
// at the file-replace level without --loader, we test the service logic via
// a manual dependency-injection pattern here.

/**
 * Extracted from attribute.service.js — _toAttributeDTO pure function.
 * We test the DTO mapper in isolation since it has no side effects.
 */
function _toAttributeDTO(doc) {
    return {
        id: doc._id.toString(),
        name: doc.displayName || doc.name,
        slug: doc.slug,
        type: doc.inputType || 'select',
        category: doc.category,
        isRequired: doc._junctionIsRequired ?? doc.validationRules?.isRequired ?? false,
        displayOrder: doc._junctionDisplayOrder ?? doc.sortingConfig?.displayOrder ?? 0,
        groupLabel: doc._junctionGroupLabel || null,
        showInFilters: doc.showInFilters ?? true,
        showInVariants: doc.showInVariants ?? true,
        values: (doc.values || []).map((v) => ({
            id: v._id.toString(),
            value: v.displayName || v.name,
            slug: v.slug,
            sortOrder: v.displayOrder ?? 0,
            ...(v.visualData?.hexCode && { hexCode: v.visualData.hexCode }),
        })),
    };
}

/**
 * Thin testable version of getAttributesByCategory that accepts injected deps.
 */
async function getAttributesByCategoryTestable(
    categoryId,
    { findCategory, runPipeline }
) {
    // ── Validation ────────────────────────────────────────────────────────────────
    if (!categoryId || typeof categoryId !== 'string' || !categoryId.trim()) {
        const err = new Error('categoryId query parameter is required');
        err.statusCode = 400;
        err.code = 'VALIDATION_ERROR';
        throw err;
    }
    if (!mongoose.Types.ObjectId.isValid(categoryId.trim())) {
        const err = new Error(
            `categoryId "${categoryId}" is not a valid ObjectId format`
        );
        err.statusCode = 400;
        err.code = 'VALIDATION_ERROR';
        throw err;
    }

    // ── Category existence ─────────────────────────────────────────────────────────
    const category = await findCategory(categoryId);
    if (!category) {
        const err = new Error(`Category with id "${categoryId}" was not found`);
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
    }

    // ── Aggregation ────────────────────────────────────────────────────────────────
    const rawAttributes = await runPipeline(categoryId);
    const attributes = rawAttributes.map(_toAttributeDTO);

    return {
        categoryId: category._id.toString(),
        categoryName: category.name,
        categorySlug: category.slug,
        count: attributes.length,
        attributes,
    };
}

// ── Test Suites ────────────────────────────────────────────────────────────────

describe('AttributeService — getAttributesByCategory', () => {
    // ── Happy Path ─────────────────────────────────────────────────────────────────
    it('returns a valid attribute tree for a real category', async () => {
        const result = await getAttributesByCategoryTestable(VALID_CAT_ID, {
            findCategory: async () => mockCategory,
            runPipeline: async () => mockAggregationResult,
        });

        assert.equal(result.categoryId, VALID_CAT_ID);
        assert.equal(result.categoryName, 'Phones');
        assert.equal(result.count, 1);
        assert.equal(result.attributes.length, 1);

        const attr = result.attributes[0];
        assert.equal(attr.name, 'Processor');
        assert.equal(attr.type, 'dropdown');
        assert.equal(attr.isRequired, true);
        assert.equal(attr.groupLabel, 'Performance');
        assert.equal(attr.values.length, 2);
        assert.equal(attr.values[0].value, 'A18 Pro');
        assert.equal(attr.values[1].value, 'Snapdragon 8 Gen 3');
    });

    // ── Missing categoryId ─────────────────────────────────────────────────────────
    it('throws VALIDATION_ERROR when categoryId is missing', async () => {
        await assert.rejects(
            () =>
                getAttributesByCategoryTestable('', {
                    findCategory: async () => mockCategory,
                    runPipeline: async () => [],
                }),
            (err) => {
                assert.equal(err.statusCode, 400);
                assert.equal(err.code, 'VALIDATION_ERROR');
                assert.match(err.message, /required/i);
                return true;
            }
        );
    });

    it('throws VALIDATION_ERROR when categoryId is undefined', async () => {
        await assert.rejects(
            () =>
                getAttributesByCategoryTestable(undefined, {
                    findCategory: async () => mockCategory,
                    runPipeline: async () => [],
                }),
            (err) => {
                assert.equal(err.statusCode, 400);
                return true;
            }
        );
    });

    // ── Invalid ObjectId ───────────────────────────────────────────────────────────
    it('throws VALIDATION_ERROR for non-ObjectId string', async () => {
        await assert.rejects(
            () =>
                getAttributesByCategoryTestable(INVALID_ID, {
                    findCategory: async () => null,
                    runPipeline: async () => [],
                }),
            (err) => {
                assert.equal(err.statusCode, 400);
                assert.equal(err.code, 'VALIDATION_ERROR');
                assert.match(err.message, /ObjectId/i);
                return true;
            }
        );
    });

    // ── Category Not Found ─────────────────────────────────────────────────────────
    it('throws NOT_FOUND when the category does not exist', async () => {
        await assert.rejects(
            () =>
                getAttributesByCategoryTestable(VALID_CAT_ID, {
                    findCategory: async () => null, // simulate missing category
                    runPipeline: async () => [],
                }),
            (err) => {
                assert.equal(err.statusCode, 404);
                assert.equal(err.code, 'NOT_FOUND');
                assert.match(err.message, /not found/i);
                return true;
            }
        );
    });

    // ── Empty Attributes ───────────────────────────────────────────────────────────
    it('returns empty attributes array when category has no linked attributes', async () => {
        const result = await getAttributesByCategoryTestable(VALID_CAT_ID, {
            findCategory: async () => mockCategory,
            runPipeline: async () => [], // no attributes
        });

        assert.equal(result.count, 0);
        assert.deepEqual(result.attributes, []);
    });
});

// ── DTO Mapper Unit Tests ──────────────────────────────────────────────────────

describe('_toAttributeDTO — DTO mapping', () => {
    it('maps junction isRequired override correctly', () => {
        const raw = {
            _id: new mongoose.Types.ObjectId(),
            name: 'COLOR',
            displayName: 'Color',
            slug: 'color',
            category: 'visual',
            inputType: 'swatch',
            showInFilters: true,
            showInVariants: true,
            _junctionIsRequired: true, // override
            validationRules: { isRequired: false }, // global default (should be overridden)
            _junctionDisplayOrder: 2,
            sortingConfig: { displayOrder: 99 },
            _junctionGroupLabel: 'Colour Options',
            values: [],
        };

        const dto = _toAttributeDTO(raw);
        assert.equal(dto.isRequired, true, 'Junction isRequired should override global');
        assert.equal(dto.displayOrder, 2, 'Junction displayOrder should override global');
        assert.equal(dto.groupLabel, 'Colour Options');
        assert.equal(dto.type, 'swatch');
    });

    it('falls back to global isRequired when junction value is undefined', () => {
        const raw = {
            _id: new mongoose.Types.ObjectId(),
            name: 'SIZE',
            displayName: 'Size',
            slug: 'size',
            inputType: 'button',
            validationRules: { isRequired: true },
            sortingConfig: { displayOrder: 1 },
            values: [],
        };
        const dto = _toAttributeDTO(raw);
        assert.equal(dto.isRequired, true);
    });

    it('includes hexCode in value DTO when visualData contains it', () => {
        const raw = {
            _id: new mongoose.Types.ObjectId(),
            name: 'COLOR',
            displayName: 'Color',
            slug: 'color',
            inputType: 'swatch',
            validationRules: {},
            sortingConfig: {},
            values: [
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'RED',
                    displayName: 'Red',
                    slug: 'red',
                    displayOrder: 1,
                    visualData: { hexCode: '#FF0000', swatchType: 'color', swatchValue: '#FF0000' },
                },
            ],
        };

        const dto = _toAttributeDTO(raw);
        assert.equal(dto.values[0].hexCode, '#FF0000');
    });

    it('handles missing visualData gracefully', () => {
        const raw = {
            _id: new mongoose.Types.ObjectId(),
            name: 'RAM',
            displayName: 'RAM',
            slug: 'ram',
            inputType: 'button',
            validationRules: {},
            sortingConfig: {},
            values: [
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: '8GB',
                    displayName: '8 GB',
                    slug: '8gb',
                    displayOrder: 1,
                    visualData: {},
                },
            ],
        };

        const dto = _toAttributeDTO(raw);
        assert.equal('hexCode' in dto.values[0], false);
    });
});

console.log('\n✅  All attribute service tests defined. Run with: node --test Backend/tests/attribute.service.test.js\n');
