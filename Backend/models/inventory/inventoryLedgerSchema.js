import mongoose from 'mongoose';

const inventoryLedgerSchema = new mongoose.Schema({
  // Reference to Inventory Master
  productId: {
    type: String,
    required: [true, 'Product ID is required'],
    index: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    index: true
  },

  // Transaction Details
  transactionType: {
    type: String,
    enum: ['IN', 'OUT', 'ADJUST'],
    required: [true, 'Transaction type is required'],
    index: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required']
  },
  
  // Stock Snapshot (before transaction)
  stockBefore: {
    type: Number,
    required: true
  },
  stockAfter: {
    type: Number,
    required: true
  },

  // Transaction Context
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true
  },
  referenceId: {
    type: String,
    trim: true,
    index: true
  },
  referenceType: {
    type: String,
    enum: ['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER', 'DAMAGE', 'OTHER'],
    default: 'OTHER'
  },

  // Cost Tracking (for valuation)
  unitCost: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0
  },

  // Approval System
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'APPROVED'
  },
  approvedBy: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },

  // Audit Fields
  performedBy: {
    type: String,
    required: [true, 'User/Admin is required'],
    default: 'SYSTEM'
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Metadata
  transactionDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
inventoryLedgerSchema.index({ productId: 1, transactionDate: -1 });
inventoryLedgerSchema.index({ sku: 1, transactionType: 1 });
inventoryLedgerSchema.index({ transactionDate: -1 });

// Pre-save middleware: Calculate total value
inventoryLedgerSchema.pre('save', function(next) {
  this.totalValue = Math.abs(this.quantity) * this.unitCost;
  next();
});

const InventoryLedger = mongoose.model('InventoryLedger', inventoryLedgerSchema);

export default InventoryLedger;