
import mongoose from 'mongoose';

const dependencySchema = new mongoose.Schema({
    // IF Parent is Set To X...
    parentAttributeType: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeType', required: true },
    parentValue: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue' }, // Can be null (meaning ANY value of parent type)

    // THEN Child Must Be...
    childAttributeType: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeType', required: true },
    allowedValues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue' }], // Empty = None allowed (Forbidden)

    // Config
    isRequired: { type: Boolean, default: false }, // If parent matches, child is mandatory
    isForbidden: { type: Boolean, default: false }, // If parent matches, child is disallowed

    description: String
}, { timestamps: true });

// Index for fast lookups during variant creation
dependencySchema.index({ parentAttributeType: 1, parentValue: 1 });

export default mongoose.model('AttributeDependency', dependencySchema);
