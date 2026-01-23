import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product identity is required"],
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    default: ""
  },
  price: {
    type: Number,
    required: [true, "Valuation (price) is required"],
    min: [0, "Price cannot be negative"]
  },
  category: {
    type: String,
    required: [true, "Classification (category) is required"]
  },
  productType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductType",
    required: [true, "Product type is required for variant mapping"]
  },
  brand: {
    type: String,
    required: [true, "Source brand is required"]
  },
  stock: {
    type: Number,
    required: [true, "Inventory count is required"],
    default: 0
  },
  image: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

// ✅ Generate Slug automatically before saving to DB
productSchema.pre('save', async function() {
  if (this.isModified('name')) {
    // Ensure slugify is imported at the top of this file!
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

export default mongoose.model('Product', productSchema);