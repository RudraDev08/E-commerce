
// ============================================================================
// Search Sync & Flattening Logic
// Flattens complex object structures into a single searchable document.
// ============================================================================

import mongoose from 'mongoose';

// This is NOT the source of truth, but a read-optimized View.
const searchDocumentSchema = new mongoose.Schema({
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', unique: true, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },

    // Core Identity
    sku: { type: String, unique: true, index: 'text' },
    name: { type: String, index: 'text' },
    description: { type: String, index: 'text' },

    // Flattened Attributes (e.g. "Color:Red", "Size:XL")
    // Format: ["Color:Red", "Size:XL", "Material:Cotton"]
    keywords: [{ type: String, index: 'text' }],

    // Flattened Categories/Tags
    category: { type: String, index: true },
    brand: { type: String, index: true },
    tags: [{ type: String, index: true }],

    // Numerical Filtering
    price: { type: Number, index: true },
    rating: { type: Number, index: true },
    dateAdded: { type: Date, index: true },

    // Segmentation
    channels: [{ type: String, index: true }],
    regions: [{ type: String, index: true }],

    // State
    status: { type: String, index: true },
    inStock: { type: Boolean, index: true }
}, { timestamps: true });

// Weighted Text Search
searchDocumentSchema.index(
    { sku: 10, name: 5, keywords: 3, description: 1 },
    { name: 'SearchRelevance', background: true }
);

export default mongoose.model('SearchDocument', searchDocumentSchema);
