/**
 * ─────────────────────────────────────────────────────────────────────────────
 * VARIANT IDENTITY — Unit Tests
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Tests:
 *   SECTION 1  — Canonical identity format & determinism
 *   SECTION 3  — Cardinality invariant
 *   SECTION 2  — Uniqueness/cross-combo isolation
 *   SECTION 9  — System limits
 *
 * Run: npx jest Backend/tests/variantIdentity.test.js
 *      OR: node --experimental-vm-modules node_modules/.bin/jest ...
 */

import {
    normalizeId,
    buildSegments,
    buildCanonicalString,
    buildConfigHashV2,
    validateCardinality,
    validateLimits,
    LIMITS,
} from '../utils/variantIdentity.js';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const ID_COLOR = '507f1f77bcf86cd799439011';
const ID_SIZE = '507f1f77bcf86cd799439012';
const ID_ATTR_TYPE = '507f1f77bcf86cd799439020';
const ID_ATTR_TYPE2 = '507f1f77bcf86cd799439021';
const ID_ATTR_VAL1 = '507f1f77bcf86cd799439030';
const ID_ATTR_VAL2 = '507f1f77bcf86cd799439031';
const PG_ID = '507f1f77bcf86cd799439001';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — CANONICAL IDENTITY FORMAT
// ─────────────────────────────────────────────────────────────────────────────

describe('SECTION 1 — Identity Canonicalization', () => {

    test('1.1  normalizeId: lowercases and trims ObjectId strings', () => {
        expect(normalizeId('  507F1F77BCF86CD799439011  ')).toBe('507f1f77bcf86cd799439011');
    });

    test('1.2  normalizeId: extracts _id from Mongoose-like objects', () => {
        const obj = { _id: { toString: () => '507f1f77bcf86cd799439011' } };
        expect(normalizeId(obj)).toBe('507f1f77bcf86cd799439011');
    });

    test('1.3  normalizeId: returns null for null/undefined', () => {
        expect(normalizeId(null)).toBeNull();
        expect(normalizeId(undefined)).toBeNull();
        expect(normalizeId('')).toBeNull();
    });

    test('1.4  normalizeId: returns null for "[object Object]" poison string', () => {
        expect(normalizeId('[object Object]')).toBeNull();
    });

    test('1.5  Segment ordering: COLOR → SIZE → ATTR (not ASCII)', () => {
        const variant = {
            colorId: ID_COLOR,
            sizes: [{ category: 'apparel', sizeId: ID_SIZE }],
            attributeDimensions: [{ attributeId: ID_ATTR_TYPE, valueId: ID_ATTR_VAL1 }],
        };
        const segs = buildSegments(variant);
        expect(segs[0]).toMatch(/^COLOR:/);
        expect(segs[1]).toMatch(/^SIZE:/);
        expect(segs[2]).toMatch(/^ATTR:/);
    });

    test('1.6  Multiple SIZE segments sorted by category ASC', () => {
        const variant = {
            sizes: [
                { category: 'shoe', sizeId: ID_SIZE },
                { category: 'apparel', sizeId: ID_SIZE },
            ],
        };
        const segs = buildSegments(variant);
        expect(segs[0]).toBe(`SIZE:apparel:${ID_SIZE}`);  // 'a' < 's'
        expect(segs[1]).toBe(`SIZE:shoe:${ID_SIZE}`);
    });

    test('1.7  Multiple ATTR segments sorted by attributeId ASC', () => {
        const variant = {
            attributeDimensions: [
                { attributeId: ID_ATTR_TYPE2, valueId: ID_ATTR_VAL2 },  // type2 > type1
                { attributeId: ID_ATTR_TYPE, valueId: ID_ATTR_VAL1 },
            ],
        };
        const segs = buildSegments(variant);
        // type1 < type2 lexically → type1 comes first
        expect(segs[0]).toBe(`ATTR:${ID_ATTR_TYPE}:${ID_ATTR_VAL1}`);
        expect(segs[1]).toBe(`ATTR:${ID_ATTR_TYPE2}:${ID_ATTR_VAL2}`);
    });

    test('1.8  Canonical string is deterministic — insertion order irrelevant', () => {
        const v1 = {
            colorId: ID_COLOR,
            sizes: [{ category: 'apparel', sizeId: ID_SIZE }],
            attributeDimensions: [
                { attributeId: ID_ATTR_TYPE2, valueId: ID_ATTR_VAL2 },
                { attributeId: ID_ATTR_TYPE, valueId: ID_ATTR_VAL1 },
            ],
        };
        const v2 = {
            colorId: ID_COLOR,
            sizes: [{ category: 'apparel', sizeId: ID_SIZE }],
            attributeDimensions: [
                { attributeId: ID_ATTR_TYPE, valueId: ID_ATTR_VAL1 },  // reversed
                { attributeId: ID_ATTR_TYPE2, valueId: ID_ATTR_VAL2 },
            ],
        };
        expect(buildCanonicalString(v1)).toBe(buildCanonicalString(v2));
    });

    test('1.9  Null axes are excluded — no "COLOR:null" segments', () => {
        const variant = {
            colorId: null,
            sizes: [{ category: 'apparel', sizeId: ID_SIZE }],
        };
        const segs = buildSegments(variant);
        expect(segs.some(s => s.includes(':null'))).toBe(false);
        expect(segs.length).toBe(1);
    });

    test('1.10  configHash is 64-char lowercase hex', () => {
        const hash = buildConfigHashV2(PG_ID, {
            colorId: ID_COLOR,
            sizes: [{ category: 'apparel', sizeId: ID_SIZE }],
            attributeDimensions: [],
        });
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    test('1.11  configHash differs for different productGroupIds (scoped uniqueness)', () => {
        const variant = { colorId: ID_COLOR };
        const h1 = buildConfigHashV2(PG_ID, variant);
        const h2 = buildConfigHashV2('507f1f77bcf86cd799439099', variant);
        expect(h1).not.toBe(h2);
    });

    test('1.12  identical combinations → identical configHash (idempotent)', () => {
        const variant = {
            colorId: ID_COLOR,
            sizes: [{ category: 'apparel', sizeId: ID_SIZE }],
        };
        expect(buildConfigHashV2(PG_ID, variant)).toBe(buildConfigHashV2(PG_ID, variant));
    });

    test('1.13  buildConfigHashV2 throws on missing productGroupId', () => {
        expect(() => buildConfigHashV2(null, { colorId: ID_COLOR })).toThrow('productGroupId is required');
    });

    test('1.14  buildCanonicalString throws if no valid dimensions resolve', () => {
        expect(() => buildCanonicalString({ colorId: null, sizes: [], attributeDimensions: [] })).toThrow();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — CARDINALITY INVARIANT
// ─────────────────────────────────────────────────────────────────────────────

describe('SECTION 3 — Attribute Cardinality', () => {

    test('3.1  Valid: one value per attribute type → no error', () => {
        expect(() => validateCardinality([
            { attributeId: ID_ATTR_TYPE, valueId: ID_ATTR_VAL1 },
            { attributeId: ID_ATTR_TYPE2, valueId: ID_ATTR_VAL2 },
        ])).not.toThrow();
    });

    test('3.2  Invalid: two values for same attribute type → CARDINALITY_VIOLATION', () => {
        expect(() => validateCardinality([
            { attributeId: ID_ATTR_TYPE, valueId: ID_ATTR_VAL1 },
            { attributeId: ID_ATTR_TYPE, valueId: ID_ATTR_VAL2 },  // duplicate typeId
        ])).toThrow(/Cardinality violation/);
    });

    test('3.3  Empty array → no error', () => {
        expect(() => validateCardinality([])).not.toThrow();
    });

    test('3.4  Null attributeId collisions (both unknown) → violation', () => {
        // Two ATTR:unknown:... entries are treated as same axis → violation
        expect(() => validateCardinality([
            { attributeId: null, valueId: ID_ATTR_VAL1 },
            { attributeId: null, valueId: ID_ATTR_VAL2 },
        ])).toThrow();
    });

    test('3.5  Error has statusCode 400 and code CARDINALITY_VIOLATION', () => {
        try {
            validateCardinality([
                { attributeId: ID_ATTR_TYPE, valueId: ID_ATTR_VAL1 },
                { attributeId: ID_ATTR_TYPE, valueId: ID_ATTR_VAL2 },
            ]);
            fail('Expected throw');
        } catch (err) {
            expect(err.statusCode).toBe(400);
            expect(err.code).toBe('CARDINALITY_VIOLATION');
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — UNIQUENESS ACROSS COMBINATIONS
// ─────────────────────────────────────────────────────────────────────────────

describe('SECTION 2 — Cross-Combo Uniqueness', () => {

    const makeVariant = (colorId, sizeId, attrTypeId, attrValId) => ({
        colorId,
        sizes: sizeId ? [{ category: 'apparel', sizeId }] : [],
        attributeDimensions: attrTypeId ? [{ attributeId: attrTypeId, valueId: attrValId }] : [],
    });

    test('2.1  Different colorId → different hash', () => {
        const h1 = buildConfigHashV2(PG_ID, makeVariant(ID_COLOR, null, null, null));
        const h2 = buildConfigHashV2(PG_ID, makeVariant('507f1f77bcf86cd799439099', null, null, null));
        expect(h1).not.toBe(h2);
    });

    test('2.2  Different attributeValueId → different hash', () => {
        const h1 = buildConfigHashV2(PG_ID, makeVariant(ID_COLOR, ID_SIZE, ID_ATTR_TYPE, ID_ATTR_VAL1));
        const h2 = buildConfigHashV2(PG_ID, makeVariant(ID_COLOR, ID_SIZE, ID_ATTR_TYPE, ID_ATTR_VAL2));
        expect(h1).not.toBe(h2);
    });

    test('2.3  Color-only vs Color+Size → different hash', () => {
        const h1 = buildConfigHashV2(PG_ID, makeVariant(ID_COLOR, null, null, null));
        const h2 = buildConfigHashV2(PG_ID, makeVariant(ID_COLOR, ID_SIZE, null, null));
        expect(h1).not.toBe(h2);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — SYSTEM LIMITS
// ─────────────────────────────────────────────────────────────────────────────

describe('SECTION 9 — Limits Enforcement', () => {

    const makePayload = (colorCount, sizeCount, attrAxes, valsPerAxis) => ({
        baseDimensions: {
            color: Array.from({ length: colorCount }, (_, i) => `color${i}`),
            size: Array.from({ length: sizeCount }, (_, i) => `size${i}`),
        },
        attributeDimensions: Array.from({ length: attrAxes }, (_, i) => ({
            attributeId: `attr${i}`,
            values: Array.from({ length: valsPerAxis }, (_, j) => `val${j}`),
        })),
    });

    test('9.1  Under all limits → no error', () => {
        expect(() => validateLimits(makePayload(2, 2, 3, 5))).not.toThrow();
    });

    test('9.2  attrAxes > MAX_ATTR_DIMENSIONS → LIMIT_EXCEEDED', () => {
        expect(() => validateLimits(makePayload(1, 1, LIMITS.MAX_ATTR_DIMENSIONS + 1, 1)))
            .toThrow(/Too many attribute dimensions/);
    });

    test('9.3  totalAxes > MAX_AXES → LIMIT_EXCEEDED', () => {
        // With color + size (2) + 9 attrs = 11 > 10
        expect(() => validateLimits(makePayload(1, 1, LIMITS.MAX_AXES - 1, 1)))
            .toThrow();
    });

    test('9.4  values per axis > MAX_VALUES_PER_AXIS → LIMIT_EXCEEDED', () => {
        expect(() => validateLimits(makePayload(1, 1, 1, LIMITS.MAX_VALUES_PER_AXIS + 1)))
            .toThrow(/values \(max/);
    });

    test('9.5  LIMITS constants are defined', () => {
        expect(LIMITS.MAX_AXES).toBeGreaterThan(0);
        expect(LIMITS.MAX_COMBINATIONS).toBeGreaterThan(0);
        expect(LIMITS.MAX_VALUES_PER_AXIS).toBeGreaterThan(0);
        expect(LIMITS.MAX_IDENTITY_BYTES).toBeGreaterThan(0);
    });
});
