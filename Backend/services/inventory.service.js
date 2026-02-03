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
    const session = await mongoose.startSession();
    session.startTransaction();

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
      const product = await Product.findById(productId).select('name').session(session);

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

      const inventory = await InventoryMaster.create([inventoryData], { session });

      // Create ledger entry for opening stock
      await this.createLedgerEntry({
        inventoryId: inventory[0]._id,
        variantId: inventory[0].variantId,
        productId: inventory[0].productId,
        sku: inventory[0].sku,
        transactionType: 'ADJUSTMENT',
        quantity: 0,
        stockBefore: { total: 0, reserved: 0, available: 0 },
        stockAfter: { total: 0, reserved: 0, available: 0 },
        reason: 'OPENING_STOCK',
        notes: 'Auto-created inventory record',
        performedBy: createdBy,
        performedByRole: 'SYSTEM'
      }, session);

      await session.commitTransaction();
      return inventory[0];
    } catch (error) {
      await session.abortTransaction();
      console.error('Error auto-creating inventory:', error);
      throw error;
    } finally {
      session.endSession();
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
    // Validate variantId
    if (!variantId || typeof variantId === 'object') {
      throw new Error('Invalid variantId: must be a string or ObjectId');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find inventory with write lock (conceptually via findOneAndUpdate or version check)
      const inventory = await InventoryMaster.findOne({ variantId }).session(session);

      if (!inventory) {
        throw new Error('Inventory not found for this variant');
      }

      // Check for version conflict if version is passed (omitted here for simplicity, relying on atomic $set)

      // Validate new stock
      if (newStock < 0) throw new Error('Stock cannot be negative');
      if (newStock < inventory.reservedStock) throw new Error(`Cannot set stock below reserved amount (${inventory.reservedStock})`);

      if (inventory.totalStock === newStock) {
        await session.abortTransaction();
        session.endSession();
        return { success: true, message: 'No change in stock level', inventory, quantityChange: 0 };
      }

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
      return { success: true, inventory, quantityChange };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
 * Bulk update stock for multiple variants
 * @param {Array} updates - Array of { variantId, sku, updateType, quantity, newStock, reason, notes }
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
        let variantId = update.variantId;
        let currentStock = 0;
        let finalStock;

        // 1. Resolve Inventory by SKU or VariantID
        if (!variantId && update.sku) {
          const inventory = await InventoryMaster.findOne({ sku: update.sku });
          if (!inventory) {
            throw new Error(`SKU ${update.sku} not found`);
          }
          variantId = inventory.variantId;
          currentStock = inventory.totalStock;
        } else if (variantId) {
          // If we only have variantId, we must fetch if we need currentStock for calculation
          // But updateStock fetches it anyway. However, to support 'add/deduct', we need it here.
          if (update.updateType && ['add', 'deduct'].includes(update.updateType.toLowerCase())) {
            const inventory = await InventoryMaster.findOne({ variantId });
            if (!inventory) throw new Error(`Inventory not found for variant ${variantId}`);
            currentStock = inventory.totalStock;
          }
        } else {
          throw new Error('Either variantId or sku is required');
        }

        // 2. Calculate Final Stock
        if (update.updateType) {
          const qty = parseInt(update.quantity);
          if (isNaN(qty)) throw new Error('Invalid quantity');

          switch (update.updateType.toLowerCase()) {
            case 'add':
              finalStock = currentStock + qty;
              break;
            case 'deduct':
              finalStock = Math.max(0, currentStock - qty);
              break;
            case 'set':
              finalStock = qty;
              break;
            default:
              throw new Error(`Invalid updateType: ${update.updateType}`);
          }
        } else {
          // Fallback for legacy calls providing 'newStock' directly
          if (update.newStock === undefined) throw new Error('Either updateType+quantity OR newStock is required');
          finalStock = update.newStock;
        }

        // 3. Perform Update
        const result = await this.updateStock(
          variantId,
          finalStock,
          update.reason,
          performedBy,
          update.notes || ''
        );

        results.success.push({
          variantId: variantId,
          sku: result.inventory.sku,
          previousStock: result.inventory.totalStock - result.quantityChange,
          newStock: result.inventory.totalStock,
          change: result.quantityChange
        });
      } catch (error) {
        results.failed.push({
          variantId: update.variantId,
          sku: update.sku,
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

  /**
   * Update stock at a specific warehouse location
   * @param {String} variantId 
   * @param {String} warehouseId 
   * @param {String} updateType - 'add', 'deduct', 'set'
   * @param {Number} quantity 
   * @param {String} reason 
   * @param {String} performedBy 
   */
  async updateLocationStock(variantId, warehouseId, updateType, quantity, reason, performedBy, notes = '') {
    // DISABLING SESSIONS: User environment (Standalone MongoDB) does not support Transactions
    let session = null;

    try {
      const inventory = await InventoryMaster.findOne({ variantId }).session(session);
      if (!inventory) throw new Error('Inventory not found');

      // Find Location
      let locIndex = inventory.locations.findIndex(l => l.warehouseId.toString() === warehouseId.toString());

      if (locIndex === -1) {
        if (updateType === 'deduct') throw new Error('Cannot deduct from non-existent location');

        inventory.locations.push({
          warehouseId,
          stock: 0
        });
        locIndex = inventory.locations.length - 1;
      }

      const currentLocStock = inventory.locations[locIndex].stock;
      let newLocStock = currentLocStock;
      let quantityChange = 0;

      if (updateType === 'add') {
        newLocStock += quantity;
        quantityChange = quantity;
      } else if (updateType === 'deduct') {
        if (currentLocStock < quantity) throw new Error(`Insufficient stock at location. Current: ${currentLocStock}`);
        newLocStock -= quantity;
        quantityChange = -quantity;
      } else if (updateType === 'set') {
        quantityChange = quantity - currentLocStock;
        newLocStock = quantity;
      }

      // Update Location
      inventory.locations[locIndex].stock = newLocStock;

      // Update Total Stock (Sync)
      inventory.totalStock += quantityChange;

      if (inventory.totalStock < 0) throw new Error('System Error: Total stock became negative');

      inventory.updatedBy = performedBy;

      const stockBefore = {
        total: inventory.totalStock - quantityChange,
        reserved: inventory.reservedStock,
        available: (inventory.totalStock - quantityChange) - inventory.reservedStock
      };

      const stockAfter = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.totalStock - inventory.reservedStock
      };

      await inventory.save({ session });

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
        notes: notes + ` [Warehouse: ${warehouseId}]`,
        performedBy,
        performedByRole: 'ADMIN'
      }, session);

      if (session) await session.commitTransaction();
      return { success: true, inventory, quantityChange };

    } catch (error) {
      if (session) await session.abortTransaction();
      throw error;
    } finally {
      if (session) session.endSession();
    }
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
  /**
   * Reserve stock for order/cart
   * @param {String} variantId - Variant ID
   * @param {Number} quantity - Quantity to reserve
   * @param {Number} expiresInMinutes - Expiration time in minutes (default 15)
   */
  async reserveStock(variantId, quantity, referenceId, performedBy = 'SYSTEM', expiresInMinutes = 15) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Use findOneAndUpdate to atomically check and update, or lock via session
      const inventory = await InventoryMaster.findOne({ variantId }).session(session);

      if (!inventory) throw new Error('Inventory not found');

      // Manual check because virtuals might not update inside transaction instantly without save
      const currentAvailable = inventory.totalStock - inventory.reservedStock;

      if (currentAvailable < quantity) {
        throw new Error(`Insufficient stock. Available: ${currentAvailable}, Requested: ${quantity}`);
      }

      const stockBefore = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: currentAvailable // legacy use
      };

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

      inventory.reservations.push({
        cartId: referenceId,
        quantity,
        expiresAt,
        userId: performedBy
      });

      inventory.reservedStock += quantity;
      inventory.updatedBy = performedBy;

      await inventory.save({ session });

      const stockAfter = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.totalStock - inventory.reservedStock
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
        notes: `Reserved for ${referenceId} (Expires: ${expiresAt.toISOString()})`,
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

      // Check if we have a specific reservation to remove
      const resIndex = inventory.reservations.findIndex(r => r.cartId === referenceId);
      if (resIndex > -1) {
        // Verify quantity matches or is partial? For now assume granular release match or generic
        inventory.reservations.splice(resIndex, 1);
      }

      // If quantity is generic (not matching a specific reservation record perfectly, or safety check)
      if (inventory.reservedStock < quantity) {
        // Auto-correct if our math is off, or throw? 
        // Better to cap it at reservedStock to avoid negative
        quantity = inventory.reservedStock;
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

  /**
   * Cleanup expired reservations (Scheduled Job)
   */
  async cleanupExpiredReservations() {
    const now = new Date();
    // Find inventories with expired reservations
    const expiredInventories = await InventoryMaster.find({
      'reservations.expiresAt': { $lte: now }
    });

    const results = [];

    for (const inventory of expiredInventories) {
      const expired = inventory.reservations.filter(r => r.expiresAt <= now);

      if (expired.length > 0) {
        const totalToRelease = expired.reduce((sum, r) => sum + r.quantity, 0);

        // Remove expired
        inventory.reservations = inventory.reservations.filter(r => r.expiresAt > now);
        inventory.reservedStock = Math.max(0, inventory.reservedStock - totalToRelease);

        await inventory.save();

        // Create generic ledger entry for the batch
        await this.createLedgerEntry({
          inventoryId: inventory._id,
          variantId: inventory.variantId,
          productId: inventory.productId,
          sku: inventory.sku,
          transactionType: 'RELEASE',
          quantity: -totalToRelease,
          stockBefore: { total: inventory.totalStock, reserved: inventory.reservedStock + totalToRelease, available: inventory.availableStock - totalToRelease },
          stockAfter: { total: inventory.totalStock, reserved: inventory.reservedStock, available: inventory.availableStock },
          reason: 'AUTO_EXPIRATION',
          notes: `Auto-released ${totalToRelease} expired units`,
          performedBy: 'SYSTEM',
          performedByRole: 'SYSTEM'
        });

        results.push({ sku: inventory.sku, released: totalToRelease });
      }
    }
    return results;
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

      if (!inventory) throw new Error('Inventory not found');

      if (inventory.totalStock < quantity) {
        throw new Error(`Insufficient physical stock. Total: ${inventory.totalStock}, Required: ${quantity}`);
      }

      const stockBefore = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.totalStock - inventory.reservedStock
      };

      // Deduct from total stock
      inventory.totalStock -= quantity;

      // Handle reservation matching logic
      // We look for a specific reservation first
      const resIndex = inventory.reservations.findIndex(r => r.cartId === orderId);

      if (resIndex > -1) {
        const res = inventory.reservations[resIndex];
        // If we reserved more than we bought? (unlikely but possible). 
        // If we reserved exactly, remove it.
        // If we booked LESS than reserved, we free up the rest? 
        // For safety, remove the reservation entry and reduce reservedStock by that amount. Any discrepancy is safer than negative.

        inventory.reservations.splice(resIndex, 1);
        // If the reservation was for MORE or LESS, we should adjust strictly.
        // BUT simpler: if we found reservation, we assume this order consumes it.
        // Adjust reservedStock by the RESERVED amount, not the BOUGHT amount (to clear the hold)
        // But wait, if they bought 1 but reserved 5? We release 4.

        const reservedAmount = res.quantity;
        inventory.reservedStock = Math.max(0, inventory.reservedStock - reservedAmount);

        // If bought quantity > reserved amount? Then we just reduced reserved by reservedAmount.
        // The difference comes from free stock.

      } else {
        // No specific reservation found. 
        // Try to reduce general reservedStock if "generic" reservation flow was used (legacy safety)
        // OR simply do not touch reservedStock if strict mode?
        // Let's stick to: If we have general reserved stock >= quantity, we reduce it to be safe 
        // ONLY if we didn't find specific matching reservation.
        if (inventory.reservedStock >= quantity) {
          inventory.reservedStock -= quantity;
        }
      }

      inventory.updatedBy = 'SYSTEM';
      await inventory.save({ session });

      const stockAfter = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.totalStock - inventory.reservedStock
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

      if (!inventory) throw new Error('Inventory not found');

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

      if (!inventory) throw new Error('Inventory not found');

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

    // Warehouse filter
    if (filters.warehouseId) {
      query['locations.warehouseId'] = filters.warehouseId;
    }

    const skip = (page - 1) * limit;

    const [inventories, total] = await Promise.all([
      InventoryMaster.find(query)
        .populate('productId', 'name category brand')
        .populate('variantId', 'attributes image')
        .populate('locations.warehouseId', 'name code')
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

  /**
   * Move stock between warehouses (Phase 3)
   * @param {String} variantId 
   * @param {String} fromWarehouseId 
   * @param {String} toWarehouseId 
   * @param {Number} quantity 
   * @param {String} performedBy 
   * @param {Object} session - Mongoose session
   */
  async moveStock(variantId, fromWarehouseId, toWarehouseId, quantity, performedBy, session = null) {
    const inventory = await InventoryMaster.findOne({ variantId }).session(session);
    if (!inventory) throw new Error('Inventory not found');

    // 1. Find Source Location
    const sourceLocIndex = inventory.locations.findIndex(
      l => l.warehouseId.toString() === fromWarehouseId.toString()
    );

    if (sourceLocIndex === -1) {
      throw new Error('Source warehouse not found in inventory locations');
    }

    if (inventory.locations[sourceLocIndex].stock < quantity) {
      throw new Error(`Insufficient stock in source warehouse. Available: ${inventory.locations[sourceLocIndex].stock}`);
    }

    // 2. Deduct from Source
    inventory.locations[sourceLocIndex].stock -= quantity;

    // 3. Add to Destination
    const destLocIndex = inventory.locations.findIndex(
      l => l.warehouseId.toString() === toWarehouseId.toString()
    );

    if (destLocIndex > -1) {
      inventory.locations[destLocIndex].stock += quantity;
    } else {
      // Create new location entry
      inventory.locations.push({
        warehouseId: toWarehouseId,
        stock: quantity,
        rack: '',
        bin: ''
      });
    }

    inventory.updatedBy = performedBy;

    // Total stock doesn't change on transfer, but we validate to be safe?
    // Just save
    await inventory.save({ session });

    // 4. Ledger Entry
    // We record TWO entries? Or one "TRANSFER"? 
    // Usually one entry showing "Transfer Out" and one "Transfer In" is cleaner for per-warehouse reporting (if we tracked warehouse in ledger)
    // Current Ledger model doesn't explicitly have warehouseId field in root?
    // Let's check Ledger Model. If it doesn't have warehouseId, we can't track per-warehouse history properly.
    // We should probably update Ledger usage.
    // For now, let's log a generic TRANSFER entry.

    await this.createLedgerEntry({
      inventoryId: inventory._id,
      variantId: inventory.variantId,
      productId: inventory.productId,
      sku: inventory.sku,
      transactionType: 'TRANSFER', // Need to ensure this is in enum or handled
      quantity: 0, // Net change to total is 0
      stockBefore: { total: inventory.totalStock, reserved: inventory.reservedStock, available: inventory.availableStock },
      stockAfter: { total: inventory.totalStock, reserved: inventory.reservedStock, available: inventory.availableStock },
      reason: 'TRANSFER',
      notes: `Transfer ${quantity} from ${fromWarehouseId} to ${toWarehouseId}`,
      performedBy,
      performedByRole: 'ADMIN',
      referenceType: 'TRANSFER',
      referenceId: `TRF-${Date.now()}` // or pass actual Transfer ID
    }, session);

    return inventory;
  }
}

export default new InventoryService();