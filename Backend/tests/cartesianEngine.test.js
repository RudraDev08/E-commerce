/**
 * Cartesian Engine — Comprehensive Test Suite
 * ─────────────────────────────────────────────────────────────────────────────
 * Framework: Node's built-in test runner (node:test) — zero extra deps.
 *
 * Run:
 *   node --test Backend/tests/cartesianEngine.test.js
 *
 * Coverage:
 *   Core Engine tests:
 *    ✅ 1.  COLOR only (1 dimension)
 *    ✅ 2.  COLOR × SIZE (2 dimensions)
 *    ✅ 3.  COLOR × RAM × STORAGE (3 dimensions — 2×2×2=8)
 *    ✅ 4.  4 dimensions (2×2×2×2=16)
 *    ✅ 5.  5 dimensions — 6 values each (6⁵=7776) → explosion guard
 *    ✅ 6.  Single-value dimension (degenerate axis)
 *    ✅ 7.  Empty dimension values → skipped, not crashing
 *    ✅ 8.  Disabled dimension → excluded from generation
 *    ✅ 9.  Duplicate values de-duplicated per dimension
 *    ✅ 10. Combination count exactly matches Cartesian product formula
 *    ✅ 11. configHash is stable (deterministic) across two identical calls
 *    ✅ 12. configHash changes when any value changes
 *    ✅ 13. combinationKey follows dimension order (not alphabetical)
 *    ✅ 14. All combinations are unique (no configHash collisions)
 *    ✅ 15. No dimensions → empty array
 *    ✅ 16. Missing productGroupId → throws
 *    ✅ 17. maxCombinations exceeded → throws with count in message
 *
 *   Lazy Generator:
 *    ✅ 18. Same output as eager (all combos)
 *    ✅ 19. Can be interrupted early (only first N items consumed)
 *
 *   Diff Engine:
 *    ✅ 20. No changes → hasChanges=false
 *    ✅ 21. Added dimension detected
 *    ✅ 22. Removed dimension detected
 *    ✅ 23. Modified dimension (new value added) detected
 *    ✅ 24. Modified dimension (value removed) detected
 *
 *   API Input Adapter:
 *    ✅ 25. baseDimensions.color → key='color'
 *    ✅ 26. attributeDimensions → key=attributeId
 *    ✅ 27. Disabled attributeDimension skipped in count
 *
 *   Workspace Model:
 *    ✅ 28. previewCount is correct
 *    ✅ 29. setDimension replaces existing key
 *    ✅ 30. removeDimension removes key
 *    ✅ 31. snapshot + getDiff reflects changes correctly
 *    ✅ 32. build() produces full combinations
 *
 *   Normalization:
 *    ✅ 33. Plain string values normalized to DimensionValue
 *    ✅ 34. MongoDB-style { _id, name } normalized correctly
 *
 *   Special phone example:
 *    ✅ 35. Color × RAM × Storage: Black/Silver × 8GB/16GB × 128GB/256GB = 8 combos
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    buildVariantCombinations,
    buildVariantCombinationsLazy,
    buildVariantCombinationsMemo,
    buildConfigHash,
    buildCombinationKey,
    countCombinations,
    diffDimensions,
    fromApiInput,
    normalizeDimension,
    normalizeDimensionValue,
    toSlug,
    guardExplosion,
    createWorkspace,
    clearMemoCache,
    DEFAULT_MAX_COMBINATIONS,
} from '../services/cartesianEngine.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const PG = 'pg-abc123';

/** Build a simple dimension for tests */
function dim(key, values) {
    return { key, values: values.map((v, i) => ({ id: `${key}-${i}`, label: v, slug: toSlug(v) })) };
}

/** Verify no duplicate configHashes */
function assertUniqueHashes(combos) {
    const hashes = combos.map((c) => c.configHash);
    assert.equal(new Set(hashes).size, hashes.length, 'configHash collision detected');
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE ENGINE TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('buildVariantCombinations — Core Engine', () => {

    it('✅ 1. COLOR only → 2 combinations', () => {
        const combos = buildVariantCombinations({
            productGroupId: PG,
            dimensions: [dim('color', ['Black', 'Silver'])],
        });
        assert.equal(combos.length, 2);
        assertUniqueHashes(combos);
        assert.equal(combos[0].selections.color.label, 'Black');
        assert.equal(combos[1].selections.color.label, 'Silver');
    });

    it('✅ 2. COLOR × SIZE → 4 combinations', () => {
        const combos = buildVariantCombinations({
            productGroupId: PG,
            dimensions: [dim('color', ['Black', 'Silver']), dim('size', ['S', 'M'])],
        });
        assert.equal(combos.length, 4);
        assertUniqueHashes(combos);
        // Check cross product: first combo should be Black × S
        assert.equal(combos[0].selections.color.label, 'Black');
        assert.equal(combos[0].selections.size.label, 'S');
    });

    it('✅ 3. COLOR × RAM × STORAGE = 2×2×2 = 8', () => {
        const combos = buildVariantCombinations({
            productGroupId: PG,
            dimensions: [
                dim('color', ['Black', 'Silver']),
                dim('ram', ['8 GB', '16 GB']),
                dim('storage', ['128 GB', '256 GB']),
            ],
        });
        assert.equal(combos.length, 8);
        assertUniqueHashes(combos);
        assert.deepEqual(combos[0].dimensionOrder, ['color', 'ram', 'storage']);
    });

    it('✅ 4. 4 dimensions → 2×2×2×2 = 16', () => {
        const combos = buildVariantCombinations({
            productGroupId: PG,
            dimensions: [
                dim('color', ['Black', 'Silver']),
                dim('ram', ['8GB', '16GB']),
                dim('storage', ['128GB', '256GB']),
                dim('processor', ['A18', 'Snapdragon']),
            ],
        });
        assert.equal(combos.length, 16);
        assertUniqueHashes(combos);
    });

    it('✅ 5. Explosion guard fires when count > maxCombinations', () => {
        // 6 values × 3 axes = 216.  maxCombinations=10 → should throw.
        assert.throws(
            () => buildVariantCombinations({
                productGroupId: PG,
                dimensions: ['a', 'b', 'c'].map(k => dim(k, ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'])),
                maxCombinations: 10, // 6^3 = 216 > 10
            }),
            (e) => { assert.match(e.message, /216/); return true; }
        );
    });

    it('✅ 6. Single-value dimension included (degenerate axis)', () => {
        const combos = buildVariantCombinations({
            productGroupId: PG,
            dimensions: [dim('color', ['Black']), dim('storage', ['128GB', '256GB'])],
        });
        assert.equal(combos.length, 2);
        combos.forEach((c) => assert.equal(c.selections.color.label, 'Black'));
    });

    it('✅ 7. Empty values dimension is skipped — no crash', () => {
        const combos = buildVariantCombinations({
            productGroupId: PG,
            dimensions: [
                dim('color', ['Black']),
                { key: 'empty-dim', values: [] }, // should be skipped
                dim('size', ['M', 'L']),
            ],
        });
        // empty-dim skipped → only color × size = 2
        assert.equal(combos.length, 2);
        assert.ok(!('empty-dim' in combos[0].selections));
    });

    it('✅ 8. Disabled dimension is excluded', () => {
        const combos = buildVariantCombinations({
            productGroupId: PG,
            dimensions: [
                dim('color', ['Black', 'Silver']),
                { key: 'ram', disabled: true, values: [{ id: 'r1', label: '8GB', slug: '8gb' }] },
                dim('size', ['M']),
            ],
        });
        // ram disabled → color × size = 2
        assert.equal(combos.length, 2);
        assert.ok(!('ram' in combos[0].selections));
    });

    it('✅ 9. Duplicate values within a dimension are de-duplicated', () => {
        const combos = buildVariantCombinations({
            productGroupId: PG,
            dimensions: [{
                key: 'color',
                values: [
                    { id: 'c1', label: 'Black', slug: 'black' },
                    { id: 'c1', label: 'Black', slug: 'black' }, // duplicate id
                    { id: 'c2', label: 'Silver', slug: 'silver' },
                ],
            }],
        });
        // After dedup: 2 unique values → 2 combinations
        assert.equal(combos.length, 2);
    });

    it('✅ 10. Combination count matches formula exactly', () => {
        const dims = [
            dim('color', ['R', 'G', 'B']),           // 3
            dim('size', ['S', 'M', 'L', 'XL']),      // 4
            dim('fit', ['Slim', 'Regular']),      // 2
        ];
        const expected = 3 * 4 * 2; // 24
        const combos = buildVariantCombinations({ productGroupId: PG, dimensions: dims });
        assert.equal(combos.length, expected);
    });

    it('✅ 11. configHash is stable (deterministic) for identical inputs', () => {
        // Use maxCombinations:1000 to ensure the guard doesn't interfere
        const input = {
            productGroupId: PG,
            dimensions: [dim('color', ['Black', 'Silver']), dim('size', ['M'])],
            maxCombinations: 1000,
        };
        const run1 = buildVariantCombinations(input);
        const run2 = buildVariantCombinations(input);
        assert.equal(run1.length, 2, 'should produce 2 combos');
        assert.equal(run2.length, 2, 'second run should also produce 2 combos');
        assert.equal(run1[0].configHash, run2[0].configHash);
        assert.equal(run1[1].configHash, run2[1].configHash);
    });

    it('✅ 12. configHash changes when a value changes', () => {
        const c1 = buildVariantCombinations({
            productGroupId: PG,
            dimensions: [{ key: 'color', values: [{ id: 'c-black', label: 'Black', slug: 'black' }] }],
        });
        const c2 = buildVariantCombinations({
            productGroupId: PG,
            dimensions: [{ key: 'color', values: [{ id: 'c-silver', label: 'Silver', slug: 'silver' }] }],
        });
        assert.equal(c1.length, 1);
        assert.equal(c2.length, 1);
        assert.notEqual(c1[0].configHash, c2[0].configHash);
    });

    it('✅ 13. combinationKey follows dimension order (color first, then size)', () => {
        const combos = buildVariantCombinations({
            productGroupId: PG,
            dimensions: [dim('color', ['Black']), dim('size', ['M'])],
        });
        assert.equal(combos[0].combinationKey, 'black-m');
    });

    it('✅ 14. All combinations unique (no hash collision in 3×3×3=27)', () => {
        const dims = ['a', 'b', 'c'].map(k => dim(k, ['v1', 'v2', 'v3']));
        const combos = buildVariantCombinations({ productGroupId: PG, dimensions: dims });
        assert.equal(combos.length, 27);
        assertUniqueHashes(combos);
    });

    it('✅ 15. No dimensions → empty array returned', () => {
        const combos = buildVariantCombinations({ productGroupId: PG, dimensions: [] });
        assert.deepEqual(combos, []);
    });

    it('✅ 16. Missing productGroupId → throws', () => {
        assert.throws(
            () => buildVariantCombinations({ dimensions: [dim('color', ['Black'])] }),
            (e) => { assert.match(e.message, /productGroupId/i); return true; }
        );
    });

    it('✅ 17. maxCombinations exceeded → error message contains actual count', () => {
        assert.throws(
            () => buildVariantCombinations({
                productGroupId: PG,
                dimensions: [dim('color', ['R', 'G', 'B']), dim('size', ['S', 'M', 'L', 'XL'])],
                maxCombinations: 5, // 3×4=12 > 5
            }),
            (e) => { assert.match(e.message, /12/); assert.match(e.message, /5/); return true; }
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// LAZY GENERATOR TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('buildVariantCombinationsLazy — Generator', () => {

    it('✅ 18. Same output as eager version', () => {
        const input = {
            productGroupId: PG,
            dimensions: [dim('color', ['Black', 'Silver']), dim('ram', ['8GB', '16GB'])],
        };
        const eager = buildVariantCombinations(input);
        const lazy = [...buildVariantCombinationsLazy(input)];

        assert.equal(eager.length, lazy.length);
        for (let i = 0; i < eager.length; i++) {
            assert.equal(eager[i].configHash, lazy[i].configHash);
        }
    });

    it('✅ 19. Generator can be interrupted after first N combos', () => {
        const input = {
            productGroupId: PG,
            dimensions: [dim('color', ['R', 'G', 'B']), dim('size', ['S', 'M', 'L'])], // 9
        };
        const gen = buildVariantCombinationsLazy(input);
        const first3 = [];
        for (const c of gen) {
            first3.push(c);
            if (first3.length === 3) break;
        }
        assert.equal(first3.length, 3);
        assertUniqueHashes(first3);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// DIFF ENGINE TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('diffDimensions — Change Detection', () => {

    it('✅ 20. No changes → hasChanges=false', () => {
        const dims = [dim('color', ['Black']), dim('size', ['M'])];
        const result = diffDimensions(dims.map(normalizeDimension), dims.map(normalizeDimension));
        assert.equal(result.hasChanges, false);
        assert.equal(result.addedKeys.length, 0);
        assert.equal(result.removedKeys.length, 0);
    });

    it('✅ 21. Added dimension detected', () => {
        const prev = [dim('color', ['Black'])].map(normalizeDimension);
        const next = [dim('color', ['Black']), dim('size', ['M'])].map(normalizeDimension);
        const result = diffDimensions(prev, next);
        assert.ok(result.hasChanges);
        assert.ok(result.addedKeys.includes('size'));
    });

    it('✅ 22. Removed dimension detected', () => {
        const prev = [dim('color', ['Black']), dim('size', ['M'])].map(normalizeDimension);
        const next = [dim('color', ['Black'])].map(normalizeDimension);
        const result = diffDimensions(prev, next);
        assert.ok(result.hasChanges);
        assert.ok(result.removedKeys.includes('size'));
    });

    it('✅ 23. Modified dimension — new value added', () => {
        const prev = [{ key: 'color', values: [{ id: 'c1', label: 'Black', slug: 'black' }] }].map(normalizeDimension);
        const next = [{ key: 'color', values: [{ id: 'c1', label: 'Black', slug: 'black' }, { id: 'c2', label: 'Silver', slug: 'silver' }] }].map(normalizeDimension);
        const result = diffDimensions(prev, next);
        assert.ok(result.hasChanges);
        assert.ok(result.modifiedKeys['color']);
        assert.equal(result.modifiedKeys['color'].added.length, 1);
        assert.equal(result.modifiedKeys['color'].added[0].id, 'c2');
    });

    it('✅ 24. Modified dimension — value removed', () => {
        const prev = [{ key: 'color', values: [{ id: 'c1', label: 'Black', slug: 'black' }, { id: 'c2', label: 'Silver', slug: 'silver' }] }].map(normalizeDimension);
        const next = [{ key: 'color', values: [{ id: 'c1', label: 'Black', slug: 'black' }] }].map(normalizeDimension);
        const result = diffDimensions(prev, next);
        assert.ok(result.hasChanges);
        assert.equal(result.modifiedKeys['color'].removed.length, 1);
        assert.equal(result.modifiedKeys['color'].removed[0].id, 'c2');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// API INPUT ADAPTER TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('fromApiInput — Adapter', () => {

    it('✅ 25. baseDimensions.color maps to key="color"', () => {
        const input = fromApiInput({
            productGroupId: PG,
            baseDimensions: { color: ['c1', 'c2'] },
        });
        const colorDim = input.dimensions.find((d) => d.key === 'color');
        assert.ok(colorDim);
        assert.equal(colorDim.values.length, 2);
    });

    it('✅ 26. attributeDimensions maps to key=attributeId', () => {
        const input = fromApiInput({
            productGroupId: PG,
            attributeDimensions: [{ attributeId: 'attr-ram', values: ['r1', 'r2'] }],
        });
        const ramDim = input.dimensions.find((d) => d.key === 'attr-ram');
        assert.ok(ramDim);
        assert.equal(ramDim.values.length, 2);
    });

    it('✅ 27. Disabled attributeDimension skipped in count', () => {
        const input = fromApiInput({
            productGroupId: PG,
            baseDimensions: { color: ['c1', 'c2'] },
            attributeDimensions: [
                { attributeId: 'attr-ram', values: ['r1'], disabled: true },
            ],
        });
        // Normalize and count only active dims
        const activeDims = input.dimensions
            .map(normalizeDimension)
            .filter((d) => !d.disabled && d.values.length > 0);
        const count = countCombinations(activeDims);
        assert.equal(count, 2); // only color × (no ram) = 2
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// WORKSPACE MODEL TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('createWorkspace — Workspace Model', () => {

    it('✅ 28. previewCount is correct from initial dimensions', () => {
        const ws = createWorkspace(PG, [dim('color', ['B', 'S']), dim('size', ['M', 'L'])]);
        assert.equal(ws.previewCount, 4);
    });

    it('✅ 29. setDimension replaces existing key', () => {
        const ws = createWorkspace(PG, [dim('color', ['B', 'S'])]);
        ws.setDimension(dim('color', ['R', 'G', 'B'])); // replace
        assert.equal(ws.previewCount, 3);
    });

    it('✅ 30. removeDimension removes the key', () => {
        const ws = createWorkspace(PG, [dim('color', ['B', 'S']), dim('size', ['M'])]);
        ws.removeDimension('size');
        assert.equal(ws.previewCount, 2);
    });

    it('✅ 31. snapshot + getDiff reflects changes correctly', () => {
        const ws = createWorkspace(PG, [dim('color', ['B', 'S'])]);
        ws.snapshot();
        ws.setDimension(dim('ram', ['8GB']));
        const diff = ws.getDiff();
        assert.ok(diff.hasChanges);
        assert.ok(diff.addedKeys.includes('ram'));
    });

    it('✅ 32. build() produces full combinations', () => {
        const ws = createWorkspace(PG, [dim('color', ['B', 'S']), dim('ram', ['8GB', '16GB'])]);
        const combos = ws.build();
        assert.equal(combos.length, 4);
        assertUniqueHashes(combos);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZATION TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('Normalization helpers', () => {

    it('✅ 33. Plain string → DimensionValue', () => {
        const v = normalizeDimensionValue('8 GB RAM', 'ram');
        assert.equal(v.id, '8 GB RAM');
        assert.equal(v.slug, '8-gb-ram');
    });

    it('✅ 34. MongoDB-style { _id, name } → DimensionValue', () => {
        const v = normalizeDimensionValue({ _id: 'abc123', name: 'Black' }, 'color');
        assert.equal(v.id, 'abc123');
        assert.equal(v.label, 'Black');
        assert.equal(v.slug, 'black');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// REAL-WORLD PHONE EXAMPLE
// ─────────────────────────────────────────────────────────────────────────────

describe('Phone Category — Real World Example', () => {

    it('✅ 35. Color × RAM × Storage = Black/Silver × 8GB/16GB × 128GB/256GB = 8 combos', () => {
        const combos = buildVariantCombinations({
            productGroupId: 'pg-iphone-15-pro',
            dimensions: [
                {
                    key: 'color',
                    values: [
                        { id: 'color-black', label: 'Black Titanium', slug: 'black-titanium' },
                        { id: 'color-silver', label: 'Silver Titanium', slug: 'silver-titanium' },
                    ],
                },
                {
                    key: 'ram',
                    values: [
                        { id: 'ram-8gb', label: '8 GB', slug: '8gb' },
                        { id: 'ram-16gb', label: '16 GB', slug: '16gb' },
                    ],
                },
                {
                    key: 'storage',
                    values: [
                        { id: 'stor-128', label: '128 GB', slug: '128gb' },
                        { id: 'stor-256', label: '256 GB', slug: '256gb' },
                    ],
                },
            ],
        });

        assert.equal(combos.length, 8, '2 × 2 × 2 = 8 combinations');
        assertUniqueHashes(combos);

        // Validate first combination structure
        const first = combos[0];
        assert.equal(first.combinationKey, 'black-titanium-8gb-128gb');
        assert.equal(first.selections.color.label, 'Black Titanium');
        assert.equal(first.selections.ram.label, '8 GB');
        assert.equal(first.selections.storage.label, '128 GB');
        assert.deepEqual(first.dimensionOrder, ['color', 'ram', 'storage']);

        // Validate all 8 keys are unique slugs
        const keys = new Set(combos.map((c) => c.combinationKey));
        assert.equal(keys.size, 8, 'All combination keys must be unique');

        // Validate last combination
        const last = combos[7];
        assert.equal(last.combinationKey, 'silver-titanium-16gb-256gb');

        console.log('\n📱 Phone variants:');
        combos.forEach((c, i) => console.log(`  ${i + 1}. ${c.combinationKey}`));
    });
});

console.log('\n✅  All cartesian engine tests defined.\nRun: node --test Backend/tests/cartesianEngine.test.js\n');
