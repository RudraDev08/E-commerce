/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MIGRATION: Backfill attributeDimensions on all existing VariantMaster docs
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * SECTION 6 (Persist attributeDimensions) + SECTION 12 (Migration Safety)
 *
 * Run: node Backend/scripts/migrate_attributeDimensions.js
 *
 * WHAT THIS DOES
 * ──────────────
 * 1. Finds every VariantMaster where attributeDimensions is empty/missing
 *    BUT attributeValueIds is non-empty.
 * 2. For each such variant, populates attributeValueIds → AttributeValue → attributeType.
 * 3. Builds and saves the attributeDimensions array.
 * 4. Idempotent: skips variants that already have attributeDimensions populated.
 * 5. Dry-run mode: pass --dry-run to preview what would change without writing.
 *
 * ROLLBACK
 * ────────
 * To reverse: run with --rollback flag.
 * This will clear attributeDimensions on all docs that were set by this migration
 * (identified by having generationBatchId = null AND attributeDimensions.length > 0).
 * WARNING: Only roll back if the production hardening is NOT yet live.
 *
 * SAFETY CHECKLIST (SECTION 12)
 * ──────────────────────────────
 * □ 1. Run in dry-run first — confirm affected doc count is expected
 * □ 2. Run on staging environment and validate 5–10 docs manually
 * □ 3. Verify unique index { productGroupId, configHash } exists and is UNIQUE
 * □ 4. Confirm no duplicate configHash exists: see verification query below
 * □ 5. Confirm no corrupted "[object Object]" valueIds: see verification query below
 * □ 6. Run migration on production with --batch=100 (default) to avoid large write locks
 * □ 7. Verify: spot-check 10 migrated docs — attributeDimensions[].valueId should be valid ObjectIds
 * □ 8. Run concurrency stress test after migration
 * □ 9. Enable hardened mode (immutability enforcement) AFTER migration completes
 *
 * VERIFICATION QUERIES (run in MongoDB shell / Compass)
 * ──────────────────────────────────────────────────────
 *
 *   // 1. Find duplicate configHashes (must return 0 after migration)
 *   db.variantmasters.aggregate([
 *     { $group: { _id: { pg: '$productGroupId', hash: '$configHash' }, count: { $sum: 1 } } },
 *     { $match: { count: { $gt: 1 } } }
 *   ])
 *
 *   // 2. Find corrupted "[object Object]" valueIds (must return 0)
 *   db.variantmasters.find({ "attributeDimensions.valueId": "[object Object]" }).count()
 *
 *   // 3. Confirm all variants with attrValueIds now have attributeDimensions
 *   db.variantmasters.find({
 *     "attributeValueIds.0": { $exists: true },
 *     "attributeDimensions.0": { $exists: false }
 *   }).count()   // → should be 0 after migration
 *
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ROLLBACK = args.includes('--rollback');
const BATCH_SIZE = parseInt((args.find(a => a.startsWith('--batch=')) ?? '--batch=100').split('=')[1], 10);

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URL;
if (!MONGO_URI) {
    console.error('❌  MONGO_URI or MONGODB_URL env var not set.');
    process.exit(1);
}

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log('✅  Connected to MongoDB');

    const db = mongoose.connection.db;
    const variantsCol = db.collection('variantmasters');
    const attrValuesCol = db.collection('attributevalues');

    if (ROLLBACK) {
        if (DRY_RUN) {
            const count = await variantsCol.countDocuments({ attributeDimensions: { $exists: true, $not: { $size: 0 } }, generationBatchId: null });
            console.log(`[dry-run] ROLLBACK: Would clear attributeDimensions from ${count} docs.`);
        } else {
            const result = await variantsCol.updateMany(
                { attributeDimensions: { $exists: true, $not: { $size: 0 } }, generationBatchId: null },
                { $set: { attributeDimensions: [] } }
            );
            console.log(`✅  ROLLBACK done. Cleared attributeDimensions from ${result.modifiedCount} docs.`);
        }
        await mongoose.disconnect();
        return;
    }

    // Find variants that need migration: have attributeValueIds but no attributeDimensions
    const query = {
        'attributeValueIds.0': { $exists: true },
        $or: [
            { attributeDimensions: { $exists: false } },
            { attributeDimensions: { $size: 0 } },
        ],
    };

    const total = await variantsCol.countDocuments(query);
    console.log(`📋  Variants needing migration: ${total}`);

    if (total === 0) {
        console.log('✅  Nothing to migrate. All variants already have attributeDimensions.');
        await mongoose.disconnect();
        return;
    }

    if (DRY_RUN) {
        console.log(`[dry-run] Would migrate ${total} variants in batches of ${BATCH_SIZE}.`);
        await mongoose.disconnect();
        return;
    }

    let processed = 0;
    let migrated = 0;
    let errors = 0;

    const cursor = variantsCol.find(query).batchSize(BATCH_SIZE);

    while (await cursor.hasNext()) {
        const variant = await cursor.next();
        try {
            const attrValueIds = (variant.attributeValueIds || []).map(id => {
                // Handle ObjectId objects or string reps
                try { return new mongoose.Types.ObjectId(id.toString()); }
                catch { return null; }
            }).filter(Boolean);

            if (attrValueIds.length === 0) {
                processed++;
                continue;
            }

            // Fetch AttributeValue docs with their attributeType populated
            const attrValues = await attrValuesCol.find(
                { _id: { $in: attrValueIds } },
                { projection: { _id: 1, attributeType: 1, name: 1, displayName: 1 } }
            ).toArray();

            const typeMap = new Map();
            for (const av of attrValues) {
                typeMap.set(av._id.toString(), av);
            }

            // Optionally fetch attributeType names (one extra batch query)
            const typeIds = [...new Set(attrValues.map(av => av.attributeType?.toString()).filter(Boolean))];
            const attrTypesCol = db.collection('attributetypes');
            const attrTypes = typeIds.length
                ? await attrTypesCol.find({ _id: { $in: typeIds.map(id => new mongoose.Types.ObjectId(id)) } },
                    { projection: { _id: 1, name: 1, displayName: 1 } }).toArray()
                : [];

            const typeNameMap = new Map(attrTypes.map(t => [t._id.toString(), t.name || t.displayName || null]));

            // Build attributeDimensions
            const attributeDimensions = attrValueIds
                .map(vid => {
                    const av = typeMap.get(vid.toString());
                    if (!av) {
                        // Value doc not found in DB (was hard-deleted — should not happen under soft-delete policy)
                        return { attributeId: null, attributeName: null, valueId: vid };
                    }
                    const attributeId = av.attributeType
                        ? new mongoose.Types.ObjectId(av.attributeType.toString())
                        : null;
                    const attributeName = attributeId
                        ? (typeNameMap.get(attributeId.toString()) ?? null)
                        : null;
                    return { attributeId, attributeName, valueId: vid };
                });

            await variantsCol.updateOne(
                { _id: variant._id },
                { $set: { attributeDimensions } }
            );

            migrated++;
        } catch (err) {
            errors++;
            console.error(`❌  Error migrating variant ${variant._id}: ${err.message}`);
        }
        processed++;
        if (processed % 500 === 0) console.log(`   … ${processed}/${total} processed`);
    }

    console.log(`\n✅  Migration complete.`);
    console.log(`   Total processed: ${processed}`);
    console.log(`   Migrated:        ${migrated}`);
    console.log(`   Errors:          ${errors}`);
    console.log('\nNext: Run verification queries listed in this file\'s header comments.');

    await mongoose.disconnect();
}

main().catch(err => {
    console.error('💥  Migration failed:', err);
    process.exit(1);
});
