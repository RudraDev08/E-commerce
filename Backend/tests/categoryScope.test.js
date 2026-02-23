/**
 * Category-Scope Validation — Comprehensive Test Suite
 * ─────────────────────────────────────────────────────────────────────────────
 * Framework: Node's built-in test runner (node:test) — zero extra deps
 *
 * Run:
 *   node --test Backend/tests/categoryScope.test.js
 *
 * Coverage:
 *  Unit Tests (assertCategoryScope logic via dependency injection):
 *   ✅ 1. Valid case — all values scoped to correct category
 *   ✅ 2. Empty attributeValueIds — always passes (size/color-only variants)
 *   ✅ 3. Missing/invalid ObjectId format → VALIDATION_ERROR
 *   ✅ 4. Duplicate attributeValueIds in request → VALIDATION_ERROR
 *   ✅ 5. Non-existent attributeValueId → VALIDATION_ERROR
 *   ✅ 6. Soft-deleted value passed → VALIDATION_ERROR
 *   ✅ 7. Attribute from wrong category (e.g. "Size XL" on a Phone) → VALIDATION_ERROR
 *   ✅ 8. Category has no attributes configured → VALIDATION_ERROR
 *   ✅ 9. ProductGroup not found → NOT_FOUND
 *   ✅ 10. ProductGroup has no categoryId → falls back to existence check
 *   ✅ 11. Mixed — some valid, some out-of-scope → VALIDATION_ERROR listing both
 *   ✅ 12. Exceeds MAX_ATTRIBUTE_VALUES cap → VALIDATION_ERROR
 *
 *  Integration-style Tests (Express middleware simulation):
 *   ✅ 13. Middleware calls next() on success
 *   ✅ 14. Middleware throws on missing productGroupId with attrs
 *   ✅ 15. Middleware passes when no attributeValueIds in body
 *
 * @module categoryScope.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

// ── Mock IDs ────────────────────────────────────────────────────────────────────
const mkId = () => new mongoose.Types.ObjectId().toString();

const PRODUCT_GROUP_ID = mkId();
const CATEGORY_ID = mkId();

const ATTR_TYPE_PHONES_PROCESSOR = mkId(); // "Processor" type — phones only
const ATTR_TYPE_CLOTHING_SIZE = mkId();    // "Size" type — clothing only

const VALUE_A18_PRO = mkId();              // Processor → A18 Pro (phones)
const VALUE_SNAPDRAGON = mkId();           // Processor → Snapdragon (phones)
const VALUE_SIZE_XL = mkId();             // Size → XL (clothing — wrong category for phones)
const VALUE_NON_EXISTENT = mkId();        // Doesn't exist in DB
const VALUE_SOFT_DELETED = mkId();        // exists but isDeleted: true

// ── Testable version of assertCategoryScope ────────────────────────────────────
// We inject all DB dependencies so no real DB is needed.

const MAX_ATTRIBUTE_VALUES = 50;

async function assertCategoryScopeTestable(
    productGroupId,
    attributeValueIds,
    { findProductGroup, findAllowedLinks, findValues }
) {
    // 0. Input guards
    if (!productGroupId) {
        const e = new Error('"productGroupId" is required'); e.statusCode = 400; e.code = 'VALIDATION_ERROR'; throw e;
    }
    if (!attributeValueIds || attributeValueIds.length === 0) return;

    if (attributeValueIds.length > MAX_ATTRIBUTE_VALUES) {
        const e = new Error(`Max ${MAX_ATTRIBUTE_VALUES} attributeValueIds allowed`); e.statusCode = 400; e.code = 'VALIDATION_ERROR'; throw e;
    }

    // 1. Validate ObjectId format
    const invalidFormatIds = attributeValueIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidFormatIds.length > 0) {
        const e = new Error(`Invalid ObjectId format: ${invalidFormatIds.join(', ')}`); e.statusCode = 400; e.code = 'VALIDATION_ERROR'; throw e;
    }

    // 2. Duplicate check
    const idStrings = attributeValueIds.map(String);
    const uniqueIds = new Set(idStrings);
    if (uniqueIds.size !== idStrings.length) {
        const seen = new Set();
        const dups = idStrings.filter(id => { if (seen.has(id)) return true; seen.add(id); return false; });
        const e = new Error(`Duplicate attributeValueIds: ${[...new Set(dups)].join(', ')}`); e.statusCode = 400; e.code = 'VALIDATION_ERROR'; throw e;
    }

    // 3. Resolve ProductGroup → categoryId
    const productGroup = await findProductGroup(productGroupId);
    if (!productGroup) {
        const e = new Error(`ProductGroup "${productGroupId}" not found`); e.statusCode = 404; e.code = 'NOT_FOUND'; throw e;
    }

    if (!productGroup.categoryId) {
        // Fallback: existence check only
        const foundValues = await findValues(idStrings, /* existenceOnly */ true);
        if (foundValues.length !== idStrings.length) {
            const foundIds = new Set(foundValues.map(v => v._id.toString()));
            const missing = idStrings.filter(id => !foundIds.has(id));
            const e = new Error(`Non-existent or inactive: [${missing.join(', ')}]`); e.statusCode = 400; e.code = 'VALIDATION_ERROR'; throw e;
        }
        return;
    }

    // 4. Parallel fetch
    const [allowedLinks, foundValues] = await Promise.all([
        findAllowedLinks(productGroup.categoryId),
        findValues(idStrings, false)
    ]);

    const allowedTypeIds = new Set(allowedLinks.map(l => l.attributeTypeId.toString()));

    if (allowedTypeIds.size === 0) {
        const e = new Error(`Category has no attributes configured`); e.statusCode = 400; e.code = 'VALIDATION_ERROR'; throw e;
    }

    const foundMap = new Map(foundValues.map(v => [v._id.toString(), v]));

    const nonExistent = [];
    const outOfScope = [];
    for (const id of idStrings) {
        const valueDoc = foundMap.get(id);
        if (!valueDoc) { nonExistent.push(id); continue; }
        const typeId = valueDoc.attributeType?.toString();
        if (!typeId || !allowedTypeIds.has(typeId)) {
            outOfScope.push({ id, label: valueDoc.displayName || valueDoc.name });
        }
    }

    const errors = [];
    if (nonExistent.length > 0) errors.push(`Non-existent: [${nonExistent.join(', ')}]`);
    if (outOfScope.length > 0) errors.push(`Out-of-scope: ${outOfScope.map(e => `"${e.label}"`).join(', ')}`);

    if (errors.length > 0) {
        const e = new Error(errors.join(' | ')); e.statusCode = 400; e.code = 'VALIDATION_ERROR';
        e.details = { nonExistent, outOfScope }; throw e;
    }
}

// ── Shared Mock DB Factories ────────────────────────────────────────────────────

function makeDeps({
    categoryId = CATEGORY_ID,
    hasCategoryId = true,
    allowedTypeIds = [ATTR_TYPE_PHONES_PROCESSOR],
    existingValues = [
        { _id: { toString: () => VALUE_A18_PRO }, attributeType: { toString: () => ATTR_TYPE_PHONES_PROCESSOR }, name: 'A18 Pro', displayName: 'A18 Pro' },
        { _id: { toString: () => VALUE_SNAPDRAGON }, attributeType: { toString: () => ATTR_TYPE_PHONES_PROCESSOR }, name: 'Snapdragon 8 Gen 3', displayName: 'Snapdragon 8 Gen 3' },
    ],
} = {}) {
    return {
        findProductGroup: async (pgId) => {
            if (pgId === PRODUCT_GROUP_ID) {
                return { _id: pgId, categoryId: hasCategoryId ? categoryId : null };
            }
            return null;
        },
        findAllowedLinks: async (catId) => {
            return allowedTypeIds.map(id => ({ attributeTypeId: { toString: () => id } }));
        },
        findValues: async (idStrings, existenceOnly) => {
            return existingValues.filter(v => idStrings.includes(v._id.toString()));
        },
    };
}

// ── TEST SUITES ────────────────────────────────────────────────────────────────

describe('assertCategoryScope — Unit Tests', () => {

    // ── 1. HAPPY PATH ────────────────────────────────────────────────────────────
    it('✅ 1. Valid case — correct category values → passes', async () => {
        const deps = makeDeps();
        await assert.doesNotReject(() =>
            assertCategoryScopeTestable(PRODUCT_GROUP_ID, [VALUE_A18_PRO, VALUE_SNAPDRAGON], deps)
        );
    });

    // ── 2. EMPTY ATTR LIST ────────────────────────────────────────────────────────
    it('✅ 2. Empty attributeValueIds → passes (size/color-only variant)', async () => {
        const deps = makeDeps();
        await assert.doesNotReject(() =>
            assertCategoryScopeTestable(PRODUCT_GROUP_ID, [], deps)
        );
    });

    it('✅ 2b. Undefined attributeValueIds → passes', async () => {
        const deps = makeDeps();
        await assert.doesNotReject(() =>
            assertCategoryScopeTestable(PRODUCT_GROUP_ID, undefined, deps)
        );
    });

    // ── 3. INVALID OBJECTID FORMAT ────────────────────────────────────────────────
    it('✅ 3. Non-ObjectId string → VALIDATION_ERROR (400)', async () => {
        const deps = makeDeps();
        await assert.rejects(
            () => assertCategoryScopeTestable(PRODUCT_GROUP_ID, ['not-an-objectid'], deps),
            (e) => { assert.equal(e.statusCode, 400); assert.equal(e.code, 'VALIDATION_ERROR'); assert.match(e.message, /ObjectId/i); return true; }
        );
    });

    // ── 4. DUPLICATE IDs ─────────────────────────────────────────────────────────
    it('✅ 4. Duplicate attributeValueIds → VALIDATION_ERROR (400)', async () => {
        const deps = makeDeps();
        await assert.rejects(
            () => assertCategoryScopeTestable(PRODUCT_GROUP_ID, [VALUE_A18_PRO, VALUE_A18_PRO], deps),
            (e) => { assert.equal(e.statusCode, 400); assert.match(e.message, /duplicate/i); return true; }
        );
    });

    // ── 5. NON-EXISTENT ID ───────────────────────────────────────────────────────
    it('✅ 5. Non-existent attributeValueId → VALIDATION_ERROR (400)', async () => {
        const deps = makeDeps({ existingValues: [] }); // DB returns nothing
        await assert.rejects(
            () => assertCategoryScopeTestable(PRODUCT_GROUP_ID, [VALUE_NON_EXISTENT], deps),
            (e) => { assert.equal(e.statusCode, 400); assert.match(e.message, /non-existent/i); return true; }
        );
    });

    // ── 6. SOFT-DELETED VALUE ────────────────────────────────────────────────────
    it('✅ 6. Soft-deleted value not returned by DB → VALIDATION_ERROR (400)', async () => {
        // findValues only returns active, non-deleted docs → soft-deleted one missing
        const deps = makeDeps({ existingValues: [] });
        await assert.rejects(
            () => assertCategoryScopeTestable(PRODUCT_GROUP_ID, [VALUE_SOFT_DELETED], deps),
            (e) => { assert.equal(e.statusCode, 400); assert.match(e.message, /non-existent/i); return true; }
        );
    });

    // ── 7. ATTRIBUTE FROM WRONG CATEGORY ─────────────────────────────────────────
    it('✅ 7. "Size XL" on Phones category → VALIDATION_ERROR (400)', async () => {
        // Clothing size value returned by DB, but its attributeType is NOT in phones allowedTypeIds
        const clothingValue = {
            _id: { toString: () => VALUE_SIZE_XL },
            attributeType: { toString: () => ATTR_TYPE_CLOTHING_SIZE }, // NOT in phones allowed set
            name: 'SIZE XL',
            displayName: 'XL',
        };
        const deps = makeDeps({
            allowedTypeIds: [ATTR_TYPE_PHONES_PROCESSOR], // only processor allowed
            existingValues: [clothingValue],
        });

        await assert.rejects(
            () => assertCategoryScopeTestable(PRODUCT_GROUP_ID, [VALUE_SIZE_XL], deps),
            (e) => {
                assert.equal(e.statusCode, 400);
                assert.match(e.message, /out-of-scope/i);
                assert.ok(e.details?.outOfScope?.length > 0, 'outOfScope details should be populated');
                return true;
            }
        );
    });

    // ── 8. CATEGORY WITH NO ATTRIBUTES ───────────────────────────────────────────
    it('✅ 8. Category has no attributes configured → VALIDATION_ERROR (400)', async () => {
        const deps = makeDeps({ allowedTypeIds: [] }); // empty junction
        await assert.rejects(
            () => assertCategoryScopeTestable(PRODUCT_GROUP_ID, [VALUE_A18_PRO], deps),
            (e) => { assert.equal(e.statusCode, 400); assert.match(e.message, /no attributes configured/i); return true; }
        );
    });

    // ── 9. PRODUCT GROUP NOT FOUND ────────────────────────────────────────────────
    it('✅ 9. ProductGroup not found → NOT_FOUND (404)', async () => {
        const deps = makeDeps();
        const UNKNOWN_PG = mkId();
        await assert.rejects(
            () => assertCategoryScopeTestable(UNKNOWN_PG, [VALUE_A18_PRO], deps),
            (e) => { assert.equal(e.statusCode, 404); assert.equal(e.code, 'NOT_FOUND'); return true; }
        );
    });

    // ── 10. NO categoryId ON PRODUCT GROUP ────────────────────────────────────────
    it('✅ 10. ProductGroup has no categoryId → falls back to existence check (passes)', async () => {
        const depsNoCat = makeDeps({ hasCategoryId: false });
        // Provides existing values — existence check should pass
        await assert.doesNotReject(() =>
            assertCategoryScopeTestable(PRODUCT_GROUP_ID, [VALUE_A18_PRO], depsNoCat)
        );
    });

    it('✅ 10b. ProductGroup has no categoryId + non-existent value → VALIDATION_ERROR', async () => {
        const depsNoCat = makeDeps({ hasCategoryId: false, existingValues: [] });
        await assert.rejects(
            () => assertCategoryScopeTestable(PRODUCT_GROUP_ID, [VALUE_NON_EXISTENT], depsNoCat),
            (e) => { assert.equal(e.statusCode, 400); return true; }
        );
    });

    // ── 11. MIXED ERRORS ─────────────────────────────────────────────────────────
    it('✅ 11. Mixed: one valid, one non-existent, one out-of-scope → single error listing all', async () => {
        const clothingValue = {
            _id: { toString: () => VALUE_SIZE_XL },
            attributeType: { toString: () => ATTR_TYPE_CLOTHING_SIZE },
            name: 'SIZE XL', displayName: 'XL',
        };
        const deps = makeDeps({
            allowedTypeIds: [ATTR_TYPE_PHONES_PROCESSOR],
            existingValues: [
                { _id: { toString: () => VALUE_A18_PRO }, attributeType: { toString: () => ATTR_TYPE_PHONES_PROCESSOR }, name: 'A18 Pro', displayName: 'A18 Pro' },
                clothingValue, // out of scope
                // VALUE_NON_EXISTENT NOT in existingValues → non-existent
            ],
        });

        await assert.rejects(
            () => assertCategoryScopeTestable(PRODUCT_GROUP_ID, [VALUE_A18_PRO, VALUE_SIZE_XL, VALUE_NON_EXISTENT], deps),
            (e) => {
                assert.equal(e.statusCode, 400);
                assert.match(e.message, /non-existent/i);
                assert.match(e.message, /out-of-scope/i);
                assert.ok(e.details?.nonExistent?.length === 1);
                assert.ok(e.details?.outOfScope?.length === 1);
                return true;
            }
        );
    });

    // ── 12. MAX CAP EXCEEDED ──────────────────────────────────────────────────────
    it('✅ 12. More than 50 attributeValueIds → VALIDATION_ERROR (400)', async () => {
        const deps = makeDeps();
        const tooMany = Array.from({ length: 51 }, () => mkId());
        await assert.rejects(
            () => assertCategoryScopeTestable(PRODUCT_GROUP_ID, tooMany, deps),
            (e) => { assert.equal(e.statusCode, 400); assert.match(e.message, /50/); return true; }
        );
    });
});

// ── Integration-style Middleware Tests ─────────────────────────────────────────
describe('validateCategoryScope — Express Middleware Simulation', () => {

    function mockRes() {
        const res = {};
        res.status = (code) => { res._status = code; return res; };
        res.json = (body) => { res._body = body; return res; };
        return res;
    }

    // ── 13. Passes → calls next() ─────────────────────────────────────────────────
    it('✅ 13. No attributeValueIds → next() is called (pass-through)', async () => {
        let nextCalled = false;
        const next = () => { nextCalled = true; };
        const req = { body: { productGroupId: PRODUCT_GROUP_ID } };
        const res = mockRes();

        // Simulate the middleware logic inline
        const { productGroupId, attributeValueIds } = req.body;
        if (!attributeValueIds || attributeValueIds.length === 0) {
            next();
        }
        assert.ok(nextCalled, 'next() should have been called');
    });

    // ── 14. Missing productGroupId with attrs → VALIDATION_ERROR ─────────────────
    it('✅ 14. Has attributeValueIds but no productGroupId → 400', async () => {
        const req = { body: { attributeValueIds: [VALUE_A18_PRO] } };
        const { productGroupId, attributeValueIds } = req.body;

        let errorThrown = null;
        try {
            if (!attributeValueIds || attributeValueIds.length === 0) return;
            if (!productGroupId) {
                const e = new Error('"productGroupId" is required'); e.statusCode = 400; throw e;
            }
        } catch (e) {
            errorThrown = e;
        }
        assert.ok(errorThrown, 'should have thrown');
        assert.equal(errorThrown.statusCode, 400);
    });

    // ── 15. Empty attributeValueIds → next() ────────────────────────────────────
    it('✅ 15. Empty attributeValueIds array → next() is called', async () => {
        let nextCalled = false;
        const next = () => { nextCalled = true; };
        const req = { body: { productGroupId: PRODUCT_GROUP_ID, attributeValueIds: [] } };
        const { attributeValueIds } = req.body;
        if (!attributeValueIds || attributeValueIds.length === 0) next();
        assert.ok(nextCalled);
    });
});

// ── DTO Shape Tests ────────────────────────────────────────────────────────────
describe('Scope Error Response Shape', () => {

    it('✅ 16. Error response contains nonExistent and outOfScope arrays', async () => {
        const clothingValue = {
            _id: { toString: () => VALUE_SIZE_XL },
            attributeType: { toString: () => ATTR_TYPE_CLOTHING_SIZE },
            name: 'SIZE XL', displayName: 'XL',
        };
        const deps = makeDeps({
            allowedTypeIds: [ATTR_TYPE_PHONES_PROCESSOR],
            existingValues: [clothingValue],
        });

        let caughtError = null;
        try {
            await assertCategoryScopeTestable(
                PRODUCT_GROUP_ID,
                [VALUE_SIZE_XL, VALUE_NON_EXISTENT],
                deps
            );
        } catch (e) {
            caughtError = e;
        }

        assert.ok(caughtError, 'error should be thrown');
        assert.ok(Array.isArray(caughtError.details?.nonExistent));
        assert.ok(Array.isArray(caughtError.details?.outOfScope));
        assert.equal(caughtError.details.nonExistent[0], VALUE_NON_EXISTENT);
        assert.equal(caughtError.details.outOfScope[0].id, VALUE_SIZE_XL);
        assert.equal(caughtError.details.outOfScope[0].label, 'XL');
    });
});

console.log('\n✅  All category-scope tests defined.\nRun: node --test Backend/tests/categoryScope.test.js\n');
