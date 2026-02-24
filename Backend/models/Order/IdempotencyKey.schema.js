import mongoose from 'mongoose';

const IdempotencyKeySchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    expiresAt: { type: Date, required: true }
}, {
    timestamps: true
});

// TTL Index to automatically delete after expiration
IdempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("IdempotencyKey", IdempotencyKeySchema);
