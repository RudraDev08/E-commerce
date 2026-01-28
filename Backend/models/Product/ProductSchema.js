import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema({
  // Identity
  name: {
    type: String,
    required: [true, "Product Name is required"],
    trim: true,
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  sku: {
    type: String,
    required: [true, "SKU is required"],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  description: { type: String, default: "" },
  shortDescription: { type: String, default: "" },

  // Relationships
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, "Category is required"],
    index: true
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, "Brand is required"],
    index: true
  },
  productType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductType",
    // Not required strictly if not using variants, but good for specs
    default: null
  },

  // Pricing
  price: { type: Number, required: true, min: 0 }, // Selling Price
  basePrice: { type: Number, default: 0, min: 0 }, // MRP / Compare At
  dateStart: { type: Date },
  dateEnd: { type: Date },
  taxClass: { type: String, default: "standard" },

  // Inventory & Variants
  hasVariants: { type: Boolean, default: false },
  variantType: {
    type: String,
    enum: ['SINGLE_COLOR', 'COLORWAY'],
    default: 'SINGLE_COLOR'
  },
  stock: { type: Number, default: 0, min: 0 }, // Only for simple products
  minStock: { type: Number, default: 5 },
  stockStatus: { type: String, enum: ['in_stock', 'out_of_stock', 'pre_order'], default: 'in_stock' },

  // Media
  image: { type: String, default: "" }, // Primary
  gallery: [{ type: String }], // Additional images

  // Attributes (Dynamic)
  attributes: [{
    key: { type: String, required: true }, // e.g. "Screen Type"
    value: { type: String, required: true }, // e.g. "OLED"
    group: { type: String, default: "Specifications" },
    searchable: { type: Boolean, default: true }
  }],

  // Metadata / SEO
  tags: [{ type: String }],
  metaTitle: { type: String, default: "" },
  metaDescription: { type: String, default: "" },
  metaKeywords: { type: String, default: "" },

  // System
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft', 'archived'],
    default: 'active',
    index: true
  },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdBy: { type: String, default: "admin" },
  updatedBy: { type: String, default: "admin" }
}, { timestamps: true });

// Auto-generate slug
// Auto-generate slug
productSchema.pre('save', async function () {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });

    // Ensure uniqueness snippet
    // Use this.constructor to access the model being saved
    const existing = await this.constructor.findOne({ slug: this.slug, _id: { $ne: this._id } });
    if (existing) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
});

export default mongoose.model('Product', productSchema);