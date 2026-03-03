import mongoose from 'mongoose';

/**
 * ========================================================================
 * ATOMIC COUNTER MODEL
 * ========================================================================
 *
 * Purpose:
 *   Provides shard-safe, collision-free, monotonically incrementing
 *   sequential IDs for any keyed namespace (e.g. order IDs per day).
 *
 * Design:
 *   - findOneAndUpdate + $inc is atomic in MongoDB.
 *   - upsert: true ensures the first request for a new key auto-creates it.
 *   - session support ensures counters participate in multi-document transactions.
 *
 * Usage:
 *   import { nextSequence } from '../models/Counter.model.js';
 *   const seq = await nextSequence('ORD-20260303', session);
 *   // => 1 (first call), 2 (second call), etc.
 *
 * ========================================================================
 */

const counterSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        seq: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
        collection: 'counters',
    }
);

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

/**
 * Atomically increments and returns the next sequence for the given key.
 * Safe under any level of concurrency. Participates in Mongo sessions.
 *
 * @param {string} key     - Namespace key (e.g. 'ORD-20260303')
 * @param {object} session - Optional Mongoose/MongoDB session for transactions
 * @returns {Promise<number>} - The next sequence integer (1-based)
 */
export async function nextSequence(key, session = null) {
    const opts = { new: true, upsert: true };
    if (session) opts.session = session;

    const doc = await Counter.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        opts
    );
    return doc.seq;
}

export default Counter;
