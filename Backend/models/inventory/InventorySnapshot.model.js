import mongoose from 'mongoose';

/**
 * ========================================================================
 * INVENTORY SNAPSHOT MODEL
 * ========================================================================
 *
 * PURPOSE:
 *   Captures a closing stock balance for a variant at a point in time.
 *   Prevents the InventoryLedger from becoming a full-scan bottleneck
 *   as its row count grows into the millions.
 *
 * QUERY STRATEGY (after snapshots exist):
 *   Current Balance = snapshot.closingBalance
 *                   + SUM(ledger entries AFTER snapshot.snapshotDate)
 *
 *   This limits every balance query to scanning only RECENT ledger rows,
 *   never the full historical log.
 *
 * SNAPSHOT SCHEDULE:
 *   - Recommended: Daily at midnight (via cron in ReconciliationScheduler)
 *   - Only one snapshot per (variantId, period) is stored — idempotent on re-run.
 *
 * ========================================================================
 */

const inventorySnapshotSchema = new mongoose.Schema({

    // ── Reference ──────────────────────────────────────────────────────────
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VariantMaster',
        required: true,
        index: true
    },

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        index: true
    },

    sku: {
        type: String,
        uppercase: true,
        index: true
    },

    // ── Snapshot Period ────────────────────────────────────────────────────
    snapshotDate: {
        type: Date,
        required: true,
        index: true    // Query: "give me snapshot before date X"
    },

    // e.g. '2026-03-05' — makes compound unique index human-readable
    periodKey: {
        type: String,
        required: true  // Format: YYYY-MM-DD
    },

    // ── Closing Balances (Source of Truth at snapshot time) ────────────────
    closingBalance: {
        totalStock: { type: Number, required: true, min: 0 },
        reservedStock: { type: Number, required: true, min: 0 },
        availableStock: { type: Number, required: true, min: 0 }
    },

    // ── Audit ──────────────────────────────────────────────────────────────
    createdBy: {
        type: String,
        default: 'SYSTEM'
    },

    // The last ledger entry ID included in this snapshot
    // Allows exact replay validation
    lastLedgerEntryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryLedger'
    },

    // ── Integrity ──────────────────────────────────────────────────────────
    // SHA256 of (variantId + snapshotDate + closingBalance) for tamper detection
    integrityHash: {
        type: String,
        trim: true
    }

}, {
    timestamps: true
});

// ── Compound Unique Index ──────────────────────────────────────────────────
// One snapshot per variant per day — safe to re-run snapshot job (idempotent)
inventorySnapshotSchema.index({ variantId: 1, periodKey: 1 }, { unique: true });

// Efficient lookup: "latest snapshot for variantId before date X"
inventorySnapshotSchema.index({ variantId: 1, snapshotDate: -1 });

// ── Static: Get latest snapshot for a variant ─────────────────────────────
inventorySnapshotSchema.statics.getLatestForVariant = function (variantId) {
    return this.findOne({ variantId })
        .sort({ snapshotDate: -1 })
        .lean();
};

// ── Static: Bulk upsert snapshots (idempotent, safe to re-run daily) ──────
inventorySnapshotSchema.statics.upsertSnapshot = async function (variantId, periodKey, closingBalance, meta = {}) {
    return this.findOneAndUpdate(
        { variantId, periodKey },
        {
            $setOnInsert: {
                variantId,
                periodKey,
                snapshotDate: meta.snapshotDate || new Date(),
                productId: meta.productId || null,
                sku: meta.sku || null,
                closingBalance,
                createdBy: meta.createdBy || 'SYSTEM',
                lastLedgerEntryId: meta.lastLedgerEntryId || null,
                integrityHash: meta.integrityHash || null
            }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

const InventorySnapshot = mongoose.model('InventorySnapshot', inventorySnapshotSchema);
export default InventorySnapshot;
