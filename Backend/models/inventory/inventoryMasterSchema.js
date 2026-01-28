import mongoose from 'mongoose';

const inventoryMasterSchema = new mongoose.Schema({
  // Product Identification
  // Product Identification
  productId: {
    type: String,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    index: true
  },
  variantId: {
    type: String, // Changed to String to prevent CastError on manual input
    ref: 'ProductVariant',
    required: [true, 'Variant ID is required'],
    unique: true,
    index: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  barcode: {
    type: String,
    trim: true,
    index: true
  },

  // Unit of Measure
  unitOfMeasure: {
    type: String,
    required: [true, 'Unit of measure is required'],
    enum: ['PCS', 'KG', 'LTR', 'MTR', 'BOX', 'PACK', 'SET'],
    default: 'PCS'
  },

  // Stock Information
  openingStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: 0
  },
  availableStock: {
    type: Number,
    default: 0,
    min: 0
  },

  // Status
  status: {
    type: String,
    enum: ['ACTIVE', 'BLOCKED', 'DISCONTINUED'],
    default: 'ACTIVE',
    index: true
  },

  // Stock Control Rules
  minimumStockLevel: {
    type: Number,
    default: 10,
    min: 0
  },
  maximumStockLevel: {
    type: Number,
    default: 1000,
    min: 0
  },
  reorderLevel: {
    type: Number,
    default: 20,
    min: 0
  },
  reorderQuantity: {
    type: Number,
    default: 100,
    min: 0
  },
  autoLowStockAlert: {
    type: Boolean,
    default: true
  },

  // Valuation
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: 0
  },
  valuationMethod: {
    type: String,
    enum: ['FIFO', 'LIFO', 'WEIGHTED_AVERAGE'],
    default: 'WEIGHTED_AVERAGE'
  },
  stockValue: {
    type: Number,
    default: 0
  },

  // Automation Flags
  autoBlockOnZeroStock: {
    type: Boolean,
    default: false
  },
  autoReorderSuggestion: {
    type: Boolean,
    default: true
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },

  // Audit Fields
  lastStockUpdate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    default: 'SYSTEM'
  },
  updatedBy: {
    type: String,
    default: 'SYSTEM'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: Check if low stock
inventoryMasterSchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.reorderLevel;
});

// Virtual: Check if needs reorder
inventoryMasterSchema.virtual('needsReorder').get(function () {
  return this.autoReorderSuggestion && this.currentStock <= this.reorderLevel;
});

// Pre-save middleware: Calculate available stock and stock value
inventoryMasterSchema.pre('save', function (next) {
  // Calculate available stock
  this.availableStock = Math.max(0, this.currentStock - this.reservedStock);

  // Calculate stock value
  this.stockValue = this.currentStock * this.costPrice;

  // Auto block if zero stock and flag is enabled
  if (this.autoBlockOnZeroStock && this.currentStock === 0) {
    this.status = 'BLOCKED';
  }

  this.lastStockUpdate = new Date();
  next();
});

// Index for performance
inventoryMasterSchema.index({ status: 1, currentStock: 1 });
inventoryMasterSchema.index({ createdAt: -1 });

const InventoryMaster = mongoose.model('InventoryMaster', inventoryMasterSchema);

export default InventoryMaster;