import InventoryLedger from '../models/inventory/InventoryLedger.model.js';
import Variant from '../models/Variant.model.js';
import Product from '../models/Product/ProductSchema.js';
import mongoose from 'mongoose';

/**
 * ========================================================================
 * INVENTORY SERVICE - SINGLE SOURCE OF TRUTH (VARIANT)
 * ========================================================================
 * 
 * ARCHITECTURE CHANGE:
 * - Stock is stored ONLY in Variant model (variant.stock, variant.reserved)
 * - InventoryMaster is DEPRECATED and REMOVED
 * - InventoryLedger tracks ALL changes purely as a log
 * 
 * ========================================================================
 */

class InventoryService {

  // ========================================================================
  // 1. HELPERS
  // ========================================================================

  async _createLedgerEntry(data, session = null) {
    const entryData = {
      ...data,
      transactionDate: new Date()
    };

    if (session) {
      return InventoryLedger.create([entryData], { session });
    }
    return InventoryLedger.create(entryData);
  }

  // ========================================================================
  // 2. STOCK UPDATES (Directly on Variant)
  // ========================================================================

  /**
   * Update stock manually with reason
   * @param {String} variantId 
   * @param {Number} newStock - New TOTAL stock
   * @param {String} reason 
   * @param {String} performedBy 
   * @param {String} notes 
   */
  async updateStock(variantId, newStock, reason, performedBy, notes = '') {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const variant = await Variant.findById(variantId).session(session);
      if (!variant) throw new Error('Variant not found');

      if (newStock < 0) throw new Error('Stock cannot be negative');
      if (newStock < variant.reserved) throw new Error(`Cannot set stock below reserved amount (${variant.reserved})`);

      const stockBefore = {
        total: variant.stock,
        reserved: variant.reserved,
        available: variant.stock - variant.reserved
      };

      const quantityChange = newStock - variant.stock;

      if (quantityChange === 0) {
        await session.abortTransaction();
        return { success: true, variant, quantityChange: 0, message: 'No change' };
      }

      // UPDATE VARIANT (Single Source of Truth)
      variant.stock = newStock;
      await variant.save({ session });

      const stockAfter = {
        total: variant.stock,
        reserved: variant.reserved,
        available: variant.stock - variant.reserved
      };

      // CREATE LOG
      await this._createLedgerEntry({
        variantId: variant._id,
        productId: variant.productId,
        sku: variant.sku,
        transactionType: 'ADJUSTMENT',
        quantity: quantityChange,
        stockBefore,
        stockAfter,
        reason,
        notes,
        performedBy,
        performedByRole: 'ADMIN' // Default for manual updates
      }, session);

      await session.commitTransaction();
      return { success: true, variant, quantityChange };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Bulk update stock
   */
  async bulkUpdateStock(updates, performedBy) {
    const batchId = new mongoose.Types.ObjectId().toString();
    const results = { success: [], failed: [] };

    for (const update of updates) {
      try {
        let variantId = update.variantId;
        let variant;

        if (!variantId && update.sku) {
          variant = await Variant.findOne({ sku: update.sku });
          if (!variant) throw new Error(`SKU ${update.sku} not found`);
          variantId = variant._id;
        } else if (variantId) {
          variant = await Variant.findById(variantId);
          if (!variant) throw new Error(`Variant ${variantId} not found`);
        } else {
          throw new Error('variantId or sku is required');
        }

        let newStock = 0;
        // Calculate new stock based on type
        if (update.updateType) {
          const qty = Number(update.quantity);
          if (isNaN(qty)) throw new Error('Invalid quantity');

          switch (update.updateType.toLowerCase()) {
            case 'add': newStock = variant.stock + qty; break;
            case 'deduct': newStock = Math.max(0, variant.stock - qty); break;
            case 'set': newStock = qty; break;
            default: throw new Error('Invalid updateType');
          }
        } else if (update.newStock !== undefined) {
          newStock = update.newStock;
        } else {
          throw new Error('Missing update parameters');
        }

        // Reuse updateStock for atomicity per item (simplified for now)
        // Ideally bulkWrite, but we need Ledger entries per item
        const res = await this.updateStock(
          variant._id,
          newStock,
          update.reason || 'MANUAL_CORRECTION',
          performedBy,
          update.notes || `Bulk Batch ${batchId}`
        );

        results.success.push({
          variantId: variant._id,
          sku: variant.sku,
          change: res.quantityChange
        });

      } catch (error) {
        results.failed.push({
          variantId: update.variantId || update.sku,
          error: error.message
        });
      }
    }

    return { batchId, results };
  }

  // ========================================================================
  // 3. AUTOMATED OPERATIONS (Order Flow)
  // ========================================================================

  async deductStockForOrder(variantId, quantity, orderId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const variant = await Variant.findById(variantId).session(session);
      if (!variant) throw new Error('Variant not found');

      if (variant.stock < quantity) {
        throw new Error(`Insufficient stock. Available: ${variant.stock}, Required: ${quantity}`);
      }

      const stockBefore = { total: variant.stock, reserved: variant.reserved, available: variant.stock - variant.reserved };

      // DEDUCT STOCK
      variant.stock -= quantity;

      // Handle Reserved: If reserved >= quantity, reduce reserved too (assume it was reserved for this order)
      // Simple logic: If reserved > 0, reduce it up to QTY
      if (variant.reserved >= quantity) {
        variant.reserved -= quantity;
      } else {
        variant.reserved = 0;
      }

      await variant.save({ session });

      const stockAfter = { total: variant.stock, reserved: variant.reserved, available: variant.stock - variant.reserved };

      await this._createLedgerEntry({
        variantId: variant._id,
        productId: variant.productId,
        sku: variant.sku,
        transactionType: 'STOCK_OUT',
        quantity: -quantity,
        stockBefore,
        stockAfter,
        reason: 'ORDER_SALE', // or ORDER_CONFIRMED
        notes: `Order ${orderId}`,
        performedBy: 'SYSTEM',
        referenceType: 'ORDER',
        referenceId: orderId
      }, session);

      await session.commitTransaction();
      return variant;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async restoreStockForCancelledOrder(variantId, quantity, orderId) {
    // similar logic to deduct, but adding stock back
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const variant = await Variant.findById(variantId).session(session);
      if (!variant) throw new Error('Variant not found');

      const stockBefore = { total: variant.stock, reserved: variant.reserved, available: variant.stock - variant.reserved };

      variant.stock += quantity;
      // Do not increase reserved, as order is cancelled.

      await variant.save({ session });

      const stockAfter = { total: variant.stock, reserved: variant.reserved, available: variant.stock - variant.reserved };

      await this._createLedgerEntry({
        variantId: variant._id,
        productId: variant.productId,
        sku: variant.sku,
        transactionType: 'STOCK_IN',
        quantity: quantity,
        stockBefore,
        stockAfter,
        reason: 'ORDER_CANCELLED',
        notes: `Order ${orderId} Cancelled`,
        performedBy: 'SYSTEM',
        referenceType: 'ORDER',
        referenceId: orderId
      }, session);

      await session.commitTransaction();
      return variant;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ========================================================================
  // 4. RESERVATIONS
  // ========================================================================

  async reserveStock(variantId, quantity, referenceId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const variant = await Variant.findById(variantId).session(session);
      if (!variant) throw new Error('Variant not found');

      const available = variant.stock - variant.reserved;
      if (available < quantity) throw new Error('Insufficient available stock');

      const stockBefore = { total: variant.stock, reserved: variant.reserved, available };

      variant.reserved += quantity;
      await variant.save({ session });

      const stockAfter = { total: variant.stock, reserved: variant.reserved, available: variant.stock - variant.reserved };

      await this._createLedgerEntry({
        variantId: variant._id,
        productId: variant.productId,
        sku: variant.sku,
        transactionType: 'RESERVE',
        quantity: quantity,
        stockBefore,
        stockAfter,
        reason: 'CART_RESERVED',
        notes: `Reserved for ${referenceId}`,
        performedBy: 'SYSTEM',
        referenceId
      }, session);

      await session.commitTransaction();
      return variant;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ========================================================================
  // 5. QUERY / REPORTING (Proxied to Variant or Ledger)
  // ========================================================================

  async getAllInventoryMasters(filters, page, limit) {
    // Map to Variant query
    const skip = (page - 1) * limit;
    const query = { isDeleted: false };

    if (filters.search) {
      query.$or = [
        { sku: { $regex: filters.search, $options: 'i' } }
      ];
    }
    // Status filtering would need virtuals or manual checks, simplified here

    const variants = await Variant.find(query)
      .skip(skip)
      .limit(limit)
      .populate('productId', 'name');

    const total = await Variant.countDocuments(query);

    // Map to expected "Inventory" shape for frontend compatibility if needed
    const inventories = variants.map(v => ({
      _id: v._id, // Inventory ID is now effectively Variant ID in this view
      variantId: v._id,
      productId: v.productId?._id,
      productName: v.productId?.name,
      sku: v.sku,
      totalStock: v.stock,
      reservedStock: v.reserved,
      availableStock: v.stock - v.reserved,
      stockStatus: v.stock === 0 ? 'out_of_stock' : 'in_stock'
    }));

    return { inventories, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getInventoryByProductId(productId) {
    const variants = await Variant.find({ productId, isDeleted: false });
    return variants.map(v => ({
      variantId: v._id,
      sku: v.sku,
      totalStock: v.stock,
      reservedStock: v.reserved
    }));
  }

  async getInventoryLedger(productId, filters) {
    const query = { productId };
    if (filters.startDate) query.transactionDate = { ...query.transactionDate, $gte: new Date(filters.startDate) };
    if (filters.endDate) query.transactionDate = { ...query.transactionDate, $lte: new Date(filters.endDate) };

    return InventoryLedger.find(query).sort({ transactionDate: -1 }).limit(100);
  }

  // ========================================================================
  // 6. LEGACY / COMPATIBILITY LAYER
  // ========================================================================

  async adjustStock(data) {
    // Proxy to updateStock
    // data: { variantId, transactionType, quantity, reason, notes, performedBy }
    let newStock;
    const variant = await Variant.findById(data.variantId);
    if (!variant) throw new Error('Variant not found');

    if (data.transactionType === 'IN') {
      newStock = variant.stock + data.quantity;
    } else if (data.transactionType === 'OUT') {
      newStock = Math.max(0, variant.stock - data.quantity);
    } else if (data.transactionType === 'ADJUST' || data.transactionType === 'SET') {
      newStock = data.quantity;
    } else {
      throw new Error('Invalid transaction type');
    }

    const result = await this.updateStock(
      data.variantId,
      newStock,
      data.reason,
      data.performedBy || 'ADMIN',
      data.notes
    );

    return {
      message: 'Stock adjusted successfully',
      inventory: result.variant,
      ledgerEntry: {} // Controller expects this but we don't return it directly from updateStock. 
      // It's acceptable to return empty object or refactor updateStock to return logic.
      // For now, prevent crash.
    };
  }

  async updateInventoryMaster(id, data, updatedBy) {
    // Proxy to updateStock if strictly stock update, otherwise ignore or error
    if (data.totalStock !== undefined) {
      return this.updateStock(id, data.totalStock, 'MANUAL_UPDATE', updatedBy);
    }
    return { message: 'Inventory metadata update not supported in Variant-only mode' };
  }

  async getLowStockItems() {
    // Find variants with stock <= minStock
    const variants = await Variant.find({
      $expr: { $lte: ["$stock", "$minStock"] },
      isDeleted: false
    }).populate('productId', 'name');
    return variants;
  }

  async getReorderSuggestions() {
    return this.getLowStockItems();
  }

  async getInventoryStats() {
    const stats = await Variant.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$stock", "$price"] } }, // Approx value
          totalUnits: { $sum: "$stock" },
          lowStockCount: { $sum: { $cond: [{ $lte: ["$stock", "$minStock"] }, 1, 0] } }
        }
      }
    ]);
    return stats[0] || { totalValue: 0, totalUnits: 0, lowStockCount: 0 };
  }

  async updateLocationStock() {
    throw new Error('Multi-location support is temporarily disabled in Variant-Only mode.');
  }

  // Legacy/Deprecation Stubs
  async createInventoryMaster() {
    throw new Error('DEPRECATED: Inventory is managed explicitly via Variants.');
  }
}

export default new InventoryService();