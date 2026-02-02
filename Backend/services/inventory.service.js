import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import InventoryLedger from '../models/inventory/InventoryLedger.model.js';
import ProductVariant from '../models/variant/productVariantSchema.js';
import Product from '../models/Product/ProductSchema.js';
import mongoose from 'mongoose';

/**
 * ========================================================================
 * INVENTORY SERVICE - COMPLETE BUSINESS LOGIC
 * ========================================================================
 * 
 * FEATURES:
 * 1. Auto-create inventory on variant creation
 * 2. Manual & bulk stock updates with audit trail
 * 3. Automated stock operations (order, cancel, return)
 * 4. Reserved stock management
 * 5. CSV import/export
 * 6. Real-time stock status calculation
 * 7. Low stock alerts & reorder suggestions
 * 8. Inventory analytics & reporting
 * 9. Concurrent update protection
 * 10. Complete audit logging
 * ========================================================================
 */

class InventoryService {

  // ========================================================================
  // 1. AUTO-CREATE INVENTORY (Called from Variant Creation)
  // ========================================================================

  /**
   * Auto-create inventory record when variant is created
   * @param {Object} variant - ProductVariant document
   * @param {String} createdBy - User who created the variant
   * @returns {Object} Created inventory record
   */
  async autoCreateInventoryForVariant(variant, createdBy = 'SYSTEM') {
    try {
      // Extract variant attributes for display
      // Handle both Mongoose Map (from normal creation) and plain object (from .lean())
      const variantAttributes = {
        size: variant.attributes instanceof Map
          ? variant.attributes.get('size')
          : variant.attributes?.size || null,
        color: variant.attributes instanceof Map
          ? variant.attributes.get('color')
          : variant.attributes?.color || null,
        colorwayName: variant.colorwayName || null,
        other: variant.attributes || {}
      };

      // Handle both old schema (product) and new schema (productId)
      const productId = variant.productId || variant.product;

      if (!productId) {
        throw new Error(`Variant ${variant.sku} has no product reference`);
      }

      // Get product details
      const product = await Product.findById(productId).select('name');

      const inventoryData = {
        variantId: variant._id,
        productId: productId, // Use the resolved productId
        sku: variant.sku,
        productName: product?.name || 'Unknown Product',
        variantAttributes,
        totalStock: 0, // Initial stock is 0
        reservedStock: 0,
        lowStockThreshold: 10,
        stockStatus: 'out_of_stock',
        costPrice: variant.costPrice || 0,
        createdBy,
        updatedBy: createdBy
      };

      const inventory = await InventoryMaster.create(inventoryData);

      // Create ledger entry for opening stock
      await this.createLedgerEntry({
        inventoryId: inventory._id,
        variantId: inventory.variantId,
        productId: inventory.productId,
        sku: inventory.sku,
        transactionType: 'ADJUSTMENT',
        quantity: 0,
        stockBefore: { total: 0, reserved: 0, available: 0 },
        stockAfter: { total: 0, reserved: 0, available: 0 },
        reason: 'OPENING_STOCK',
        notes: 'Auto-created inventory record',
        performedBy: createdBy,
        performedByRole: 'SYSTEM'
      });

      return inventory;
    } catch (error) {
      console.error('Error auto-creating inventory:', error);
      throw error;
    }
  }

  /**
   * Bulk auto-create inventory for multiple variants
   * @param {Array} variants - Array of ProductVariant documents
   * @param {String} createdBy - User who created the variants
   */
  async bulkAutoCreateInventory(variants, createdBy = 'SYSTEM') {
    const results = {
      success: [],
      failed: []
    };

    for (const variant of variants) {
      try {
        const inventory = await this.autoCreateInventoryForVariant(variant, createdBy);
        results.success.push({ variantId: variant._id, sku: variant.sku, inventory });
      } catch (error) {
        results.failed.push({
          variantId: variant._id,
          sku: variant.sku,
          error: error.message
        });
      }
    }

    return results;
  }

  // ========================================================================
  // 2. MANUAL STOCK UPDATES
  // ========================================================================

  /**
   * Update stock manually with reason
   * @param {String} variantId - Variant ID
   * @param {Number} newStock - New total stock value
   * @param {String} reason - Reason for update
   * @param {String} performedBy - User performing the action
   * @param {String} notes - Additional notes
   */
  async updateStock(variantId, newStock, reason, performedBy, notes = '') {
    // Validate variantId - prevent "[object Object]" error
    if (!variantId || typeof variantId === 'object') {
      throw new Error('Invalid variantId: must be a string or ObjectId');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find inventory with lock
      const inventory = await InventoryMaster.findOne({ variantId }).session(session);

      if (!inventory) {
        throw new Error('Inventory not found for this variant');
      }

      // Validate new stock
      if (newStock < 0) {
        throw new Error('Stock cannot be negative');
      }

      if (newStock < inventory.reservedStock) {
        throw new Error(`Cannot set stock below reserved amount (${inventory.reservedStock})`);
      }

      // Capture before state
      const stockBefore = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.availableStock
      };

      const quantityChange = newStock - inventory.totalStock;

      // Update stock
      inventory.totalStock = newStock;
      inventory.lastStockUpdateBy = performedBy;
      inventory.updatedBy = performedBy;

      await inventory.save({ session });

      // Capture after state
      const stockAfter = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.availableStock
      };

      // Create ledger entry
      await this.createLedgerEntry({
        inventoryId: inventory._id,
        variantId: inventory.variantId,
        productId: inventory.productId,
        sku: inventory.sku,
        transactionType: 'ADJUSTMENT',
        quantity: quantityChange,
        stockBefore,
        stockAfter,
        reason,
        notes,
        performedBy,
        performedByRole: 'ADMIN',
        unitCost: inventory.costPrice
      }, session);

      await session.commitTransaction();

      return {
        success: true,
        inventory,
        quantityChange
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Bulk update stock for multiple variants
   * @param {Array} updates - Array of { variantId, newStock, reason, notes }
   * @param {String} performedBy - User performing the action
   */
  async bulkUpdateStock(updates, performedBy) {
    const batchId = new mongoose.Types.ObjectId().toString();
    const results = {
      success: [],
      failed: []
    };

    for (const update of updates) {
      try {
        const result = await this.updateStock(
          update.variantId,
          update.newStock,
          update.reason,
          performedBy,
          update.notes || ''
        );

        results.success.push({
          variantId: update.variantId,
          sku: result.inventory.sku,
          previousStock: result.inventory.totalStock - result.quantityChange,
          newStock: result.inventory.totalStock,
          change: result.quantityChange
        });
      } catch (error) {
        results.failed.push({
          variantId: update.variantId,
          error: error.message
        });
      }
    }

    return {
      batchId,
      totalProcessed: updates.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
      results
    };
  }

  // ========================================================================
  // 3. RESERVED STOCK MANAGEMENT
  // ========================================================================

  /**
   * Reserve stock for order/cart
   * @param {String} variantId - Variant ID
   * @param {Number} quantity - Quantity to reserve
   * @param {String} referenceId - Order/Cart ID
   * @param {String} performedBy - User/System
   */
  async reserveStock(variantId, quantity, referenceId, performedBy = 'SYSTEM') {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const inventory = await InventoryMaster.findOne({ variantId }).session(session);

      if (!inventory) {
        throw new Error('Inventory not found');
      }

      if (!inventory.canReserve(quantity)) {
        throw new Error(`Insufficient stock. Available: ${inventory.availableStock}, Requested: ${quantity}`);
      }

      const stockBefore = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.availableStock
      };

      inventory.reservedStock += quantity;
      inventory.updatedBy = performedBy;

      await inventory.save({ session });

      const stockAfter = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.availableStock
      };

      await this.createLedgerEntry({
        inventoryId: inventory._id,
        variantId: inventory.variantId,
        productId: inventory.productId,
        sku: inventory.sku,
        transactionType: 'RESERVE',
        quantity: quantity,
        stockBefore,
        stockAfter,
        reason: 'CART_RESERVED',
        notes: `Reserved for ${referenceId}`,
        performedBy,
        performedByRole: 'SYSTEM',
        referenceType: 'ORDER',
        referenceId
      }, session);

      await session.commitTransaction();

      return inventory;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Release reserved stock
   * @param {String} variantId - Variant ID
   * @param {Number} quantity - Quantity to release
   * @param {String} referenceId - Order/Cart ID
   * @param {String} performedBy - User/System
   */
  async releaseReservedStock(variantId, quantity, referenceId, performedBy = 'SYSTEM') {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const inventory = await InventoryMaster.findOne({ variantId }).session(session);

      if (!inventory) {
        throw new Error('Inventory not found');
      }

      if (inventory.reservedStock < quantity) {
        throw new Error(`Cannot release ${quantity}. Only ${inventory.reservedStock} reserved.`);
      }

      const stockBefore = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.availableStock
      };

      inventory.reservedStock -= quantity;
      inventory.updatedBy = performedBy;

      await inventory.save({ session });

      const stockAfter = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.availableStock
      };

      await this.createLedgerEntry({
        inventoryId: inventory._id,
        variantId: inventory.variantId,
        productId: inventory.productId,
        sku: inventory.sku,
        transactionType: 'RELEASE',
        quantity: -quantity,
        stockBefore,
        stockAfter,
        reason: 'CART_EXPIRED',
        notes: `Released from ${referenceId}`,
        performedBy,
        performedByRole: 'SYSTEM',
        referenceType: 'ORDER',
        referenceId
      }, session);

      await session.commitTransaction();

      return inventory;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ========================================================================
  // 4. AUTOMATED STOCK OPERATIONS (Order Flow)
  // ========================================================================

  /**
   * Deduct stock when order is confirmed
   * @param {String} variantId - Variant ID
   * @param {Number} quantity - Quantity sold
   * @param {String} orderId - Order ID
   */
  async deductStockForOrder(variantId, quantity, orderId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const inventory = await InventoryMaster.findOne({ variantId }).session(session);

      if (!inventory) {
        throw new Error('Inventory not found');
      }

      const stockBefore = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.availableStock
      };

      // Deduct from total stock
      inventory.totalStock -= quantity;

      // Also reduce reserved if it was reserved
      if (inventory.reservedStock >= quantity) {
        inventory.reservedStock -= quantity;
      }

      inventory.updatedBy = 'SYSTEM';

      await inventory.save({ session });

      const stockAfter = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.availableStock
      };

      await this.createLedgerEntry({
        inventoryId: inventory._id,
        variantId: inventory.variantId,
        productId: inventory.productId,
        sku: inventory.sku,
        transactionType: 'ORDER_DEDUCT',
        quantity: -quantity,
        stockBefore,
        stockAfter,
        reason: 'ORDER_CONFIRMED',
        notes: `Order ${orderId} confirmed`,
        performedBy: 'SYSTEM',
        performedByRole: 'SYSTEM',
        referenceType: 'ORDER',
        referenceId: orderId
      }, session);

      await session.commitTransaction();

      return inventory;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Restore stock when order is cancelled
   * @param {String} variantId - Variant ID
   * @param {Number} quantity - Quantity to restore
   * @param {String} orderId - Order ID
   */
  async restoreStockForCancelledOrder(variantId, quantity, orderId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const inventory = await InventoryMaster.findOne({ variantId }).session(session);

      if (!inventory) {
        throw new Error('Inventory not found');
      }

      const stockBefore = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.availableStock
      };

      inventory.totalStock += quantity;

      // Release reservation if exists
      if (inventory.reservedStock >= quantity) {
        inventory.reservedStock -= quantity;
      }

      inventory.updatedBy = 'SYSTEM';

      await inventory.save({ session });

      const stockAfter = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.availableStock
      };

      await this.createLedgerEntry({
        inventoryId: inventory._id,
        variantId: inventory.variantId,
        productId: inventory.productId,
        sku: inventory.sku,
        transactionType: 'ORDER_CANCEL',
        quantity: quantity,
        stockBefore,
        stockAfter,
        reason: 'ORDER_CANCELLED',
        notes: `Order ${orderId} cancelled`,
        performedBy: 'SYSTEM',
        performedByRole: 'SYSTEM',
        referenceType: 'ORDER',
        referenceId: orderId
      }, session);

      await session.commitTransaction();

      return inventory;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Restore stock when item is returned
   * @param {String} variantId - Variant ID
   * @param {Number} quantity - Quantity returned
   * @param {String} orderId - Order ID
   * @param {Boolean} isDamaged - Is the returned item damaged?
   */
  async restoreStockForReturn(variantId, quantity, orderId, isDamaged = false) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const inventory = await InventoryMaster.findOne({ variantId }).session(session);

      if (!inventory) {
        throw new Error('Inventory not found');
      }

      const stockBefore = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.availableStock
      };

      // Only restore if not damaged
      if (!isDamaged) {
        inventory.totalStock += quantity;
      }

      inventory.updatedBy = 'SYSTEM';

      await inventory.save({ session });

      const stockAfter = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.availableStock
      };

      await this.createLedgerEntry({
        inventoryId: inventory._id,
        variantId: inventory.variantId,
        productId: inventory.productId,
        sku: inventory.sku,
        transactionType: 'RETURN_RESTORE',
        quantity: isDamaged ? 0 : quantity,
        stockBefore,
        stockAfter,
        reason: 'CUSTOMER_RETURN',
        notes: isDamaged
          ? `Return from ${orderId} - Item damaged, not restocked`
          : `Return from ${orderId} - Item restocked`,
        performedBy: 'SYSTEM',
        performedByRole: 'SYSTEM',
        referenceType: 'RETURN',
        referenceId: orderId
      }, session);

      await session.commitTransaction();

      return inventory;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ========================================================================
  // 5. QUERY & RETRIEVAL
  // ========================================================================

  /**
   * Get all inventories with filters and pagination
   */
  async getAllInventories(filters = {}, page = 1, limit = 50) {
    const query = { isDeleted: false };

    // Status filter
    if (filters.stockStatus) {
      query.stockStatus = filters.stockStatus;
    }

    // Search by product name or SKU
    if (filters.search) {
      query.$or = [
        { productName: { $regex: filters.search, $options: 'i' } },
        { sku: { $regex: filters.search, $options: 'i' } }
      ];
    }

    // Low stock filter
    if (filters.lowStock === 'true') {
      query.stockStatus = 'low_stock';
    }

    // Out of stock filter
    if (filters.outOfStock === 'true') {
      query.stockStatus = 'out_of_stock';
    }

    const skip = (page - 1) * limit;

    const [inventories, total] = await Promise.all([
      InventoryMaster.find(query)
        .populate('productId', 'name category brand')
        .populate('variantId', 'attributes image')
        .sort({ lastStockUpdate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InventoryMaster.countDocuments(query)
    ]);

    return {
      inventories,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get inventory by variant ID
   */
  async getInventoryByVariantId(variantId) {
    const inventory = await InventoryMaster.findOne({ variantId, isDeleted: false })
      .populate('productId', 'name category brand images')
      .populate('variantId', 'attributes image price')
      .lean();

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    return inventory;
  }

  /**
   * Get low stock items
   */
  async getLowStockItems() {
    return InventoryMaster.find({
      stockStatus: 'low_stock',
      isDeleted: false,
      isActive: true
    })
      .populate('productId', 'name')
      .populate('variantId', 'sku')
      .sort({ availableStock: 1 })
      .lean();
  }

  /**
   * Get out of stock items
   */
  async getOutOfStockItems() {
    return InventoryMaster.find({
      stockStatus: 'out_of_stock',
      isDeleted: false,
      isActive: true
    })
      .populate('productId', 'name')
      .populate('variantId', 'sku')
      .lean();
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats() {
    return InventoryMaster.getStats();
  }

  /**
   * Get inventory ledger for a variant
   */
  async getInventoryLedger(variantId, filters = {}, limit = 100) {
    // Validate variantId - prevent "[object Object]" error
    if (!variantId || typeof variantId === 'object') {
      throw new Error('Invalid variantId: must be a string or ObjectId');
    }

    const query = { variantId };

    if (filters.transactionType) {
      query.transactionType = filters.transactionType;
    }

    if (filters.startDate && filters.endDate) {
      query.transactionDate = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    return InventoryLedger.find(query)
      .sort({ transactionDate: -1 })
      .limit(limit)
      .lean();
  }

  // ========================================================================
  // 6. HELPER METHODS
  // ========================================================================

  /**
   * Create ledger entry
   */
  async createLedgerEntry(data, session = null) {
    const ledgerEntry = new InventoryLedger(data);

    if (session) {
      return ledgerEntry.save({ session });
    }

    return ledgerEntry.save();
  }

  /**
   * Check if variant has inventory
   */
  async hasInventory(variantId) {
    const count = await InventoryMaster.countDocuments({ variantId, isDeleted: false });
    return count > 0;
  }

  /**
   * Soft delete inventory (when variant is deleted)
   */
  async softDeleteInventory(variantId, deletedBy) {
    const inventory = await InventoryMaster.findOne({ variantId });

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    inventory.isDeleted = true;
    inventory.deletedAt = new Date();
    inventory.deletedBy = deletedBy;
    inventory.isActive = false;

    return inventory.save();
  }

  /**
   * Restore soft-deleted inventory
   */
  async restoreInventory(variantId) {
    const inventory = await InventoryMaster.findOne({ variantId, isDeleted: true });

    if (!inventory) {
      throw new Error('Deleted inventory not found');
    }

    inventory.isDeleted = false;
    inventory.deletedAt = null;
    inventory.deletedBy = null;
    inventory.isActive = true;

    return inventory.save();
  }
}

export default new InventoryService();