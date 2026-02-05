import InventoryLedger from '../models/inventory/InventoryLedger.model.js';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import Variant from '../models/Variant/VariantSchema.js';
import mongoose from 'mongoose';

/**
 * ========================================================================
 * INVENTORY SERVICE - ENTERPRISE ARCHITECTURE
 * ========================================================================
 * 
 * - Single Source of Truth: InventoryMaster Collection
 * - Catalog Isolation: Variant/Product models NEVER touched for stock
 * - Audit Trail: InventoryLedger tracks all movements
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
    const options = session ? { session } : {};
    return InventoryLedger.create([entryData], options);
  }

  async _getOrCreateInventory(variantId, session = null) {
    let inventory = await InventoryMaster.findOne({ variantId }).session(session);

    // Auto-create if missing (Self-Healing)
    if (!inventory) {
      const variant = await Variant.findById(variantId).populate('product');
      if (!variant) throw new Error(`Variant ${variantId} not found`);

      inventory = new InventoryMaster({
        variantId: variant._id,
        productId: variant.product._id, // Updated to match populated field name
        sku: variant.sku,
        totalStock: 0,
        reservedStock: 0
      });
      await inventory.save({ session });
    }
    return inventory;
  }

  // ========================================================================
  // 2. STOCK UPDATES
  // ========================================================================

  /**
   * Update stock manually with reason
   */
  async updateStock(variantId, newStock, reason, performedBy, notes = '') {
    try {
      const inventory = await this._getOrCreateInventory(variantId);

      // Validation
      if (newStock < 0) throw new Error('Stock cannot be negative');
      if (newStock < (inventory.reservedStock || 0)) throw new Error(`Cannot set stock below reserved amount (${inventory.reservedStock})`);

      const stockBefore = {
        total: inventory.totalStock,
        reserved: inventory.reservedStock,
        available: inventory.totalStock - inventory.reservedStock
      };

      const quantityChange = newStock - inventory.totalStock;

      if (quantityChange === 0) {
        return { success: true, inventory, quantityChange: 0, message: 'No change' };
      }

      // Calculate status manually (replaces pre-save hook for findOneAndUpdate)
      let status = 'IN_STOCK';
      if (newStock === 0) status = 'OUT_OF_STOCK';
      else if (newStock <= (inventory.lowStockThreshold || 5)) status = 'LOW_STOCK';

      // UPDATE MASTER ATOMICALLY
      const updatedInventory = await InventoryMaster.findOneAndUpdate(
        { _id: inventory._id },
        {
          $set: {
            totalStock: newStock,
            status,
            lastUpdated: new Date()
          }
        },
        { new: true, runValidators: true }
      );

      const stockAfter = {
        total: updatedInventory.totalStock,
        reserved: updatedInventory.reservedStock,
        available: updatedInventory.totalStock - updatedInventory.reservedStock
      };

      // CREATE LOG (Best effort without transaction)
      await this._createLedgerEntry({
        variantId: updatedInventory.variantId,
        productId: updatedInventory.productId,
        sku: updatedInventory.sku,
        transactionType: 'ADJUSTMENT',
        quantity: quantityChange,
        stockBefore,
        stockAfter,
        reason,
        notes,
        performedBy,
        performedByRole: 'ADMIN'
      });

      return { success: true, inventory: updatedInventory, quantityChange };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update stock for a specific warehouse location
   */
  async updateLocationStock(variantId, warehouseId, updateType, quantity, reason, performedBy, notes = '') {
    try {
      // 1. Ensure inventory and location entry exists
      let inventory = await this._getOrCreateInventory(variantId);

      // Atomic logic: If location doesn't exist, push it first
      const hasLocation = inventory.locations?.some(l => l.warehouseId.toString() === warehouseId.toString());
      if (!hasLocation) {
        inventory = await InventoryMaster.findOneAndUpdate(
          { _id: inventory._id, "locations.warehouseId": { $ne: warehouseId } },
          { $push: { locations: { warehouseId, stock: 0, lastUpdated: new Date() } } },
          { new: true }
        ) || inventory;
      }

      const oldTotalStock = inventory.totalStock;
      const currentLocation = inventory.locations.find(l => l.warehouseId.toString() === warehouseId.toString());
      const oldLocationStock = currentLocation ? currentLocation.stock : 0;

      // 2. Perform Atomic Update using filtered positional operator $[elem]
      let updateQuery = {};
      let diff = 0;

      switch (updateType.toLowerCase()) {
        case 'add':
          diff = quantity;
          updateQuery = { $inc: { "locations.$[elem].stock": quantity, totalStock: quantity } };
          break;
        case 'deduct':
          diff = -Math.min(quantity, oldLocationStock);
          updateQuery = { $inc: { "locations.$[elem].stock": diff, totalStock: diff } };
          break;
        case 'set':
          diff = quantity - oldLocationStock;
          updateQuery = {
            $set: { "locations.$[elem].stock": quantity },
            $inc: { totalStock: diff }
          };
          break;
        default: throw new Error('Invalid updateType');
      }

      // Calculate status manually
      const newTotalStock = inventory.totalStock + diff;
      let status = 'IN_STOCK';
      if (newTotalStock === 0) status = 'OUT_OF_STOCK';
      else if (newTotalStock <= (inventory.lowStockThreshold || 5)) status = 'LOW_STOCK';

      const updatedInventory = await InventoryMaster.findOneAndUpdate(
        { _id: inventory._id },
        {
          ...updateQuery,
          $set: {
            "locations.$[elem].lastUpdated": new Date(),
            lastUpdated: new Date(),
            status
          }
        },
        {
          arrayFilters: [{ "elem.warehouseId": warehouseId }],
          new: true,
          runValidators: true
        }
      );

      // 3. Create Ledger
      await this._createLedgerEntry({
        variantId: updatedInventory.variantId,
        productId: updatedInventory.productId,
        sku: updatedInventory.sku,
        transactionType: diff > 0 ? 'STOCK_IN' : 'STOCK_OUT',
        quantity: diff,
        warehouseId,
        stockBefore: {
          total: oldTotalStock,
          reserved: inventory.reservedStock,
          available: oldTotalStock - inventory.reservedStock
        },
        stockAfter: {
          total: updatedInventory.totalStock,
          reserved: updatedInventory.reservedStock,
          available: updatedInventory.totalStock - updatedInventory.reservedStock
        },
        reason,
        notes: notes || `Location Update: ${updateType} ${quantity} at WH ${warehouseId}`,
        performedBy,
        performedByRole: 'ADMIN'
      });

      return { success: true, inventory: updatedInventory, quantityChange: diff };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk update stock
   */
  async bulkUpdateInventories(updates, performedBy) {
    const batchId = new mongoose.Types.ObjectId().toString();
    const results = { success: [], failed: [] };

    for (const update of updates) {
      try {
        let variantId = update.variantId;

        // Resolve SKU if variantId missing
        if (!variantId && update.sku) {
          const variant = await Variant.findOne({ sku: update.sku });
          if (!variant) throw new Error(`SKU ${update.sku} not found`);
          variantId = variant._id;
        }

        if (!variantId) throw new Error('variantId or sku is required');

        // Logic to determine new stock value
        // Cannot optimize easily without atomic locks per item, reusing updateStock
        // First fetch current to calc new if needed
        const inventory = await this._getOrCreateInventory(variantId); // reading outside transaction for calc is slightly racy but acceptable for bulk admin ops usually

        let newStock = 0;
        if (update.updateType) {
          const qty = Number(update.quantity);
          if (isNaN(qty)) throw new Error('Invalid quantity');
          switch (update.updateType.toLowerCase()) {
            case 'add': newStock = inventory.totalStock + qty; break;
            case 'deduct': newStock = Math.max(0, inventory.totalStock - qty); break;
            case 'set': newStock = qty; break;
            default: throw new Error('Invalid updateType');
          }
        } else if (update.newStock !== undefined) {
          newStock = update.newStock;
        } else {
          throw new Error('Missing update params');
        }

        const res = await this.updateStock(
          variantId,
          newStock,
          update.reason || 'MANUAL_CORRECTION',
          performedBy,
          update.notes || `Bulk Batch ${batchId}`
        );

        results.success.push({
          variantId,
          sku: inventory.sku,
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
    try {
      const inventory = await InventoryMaster.findOne({ variantId });
      if (!inventory) throw new Error('Inventory not found');

      if (inventory.totalStock < quantity) {
        throw new Error(`Insufficient stock. Available: ${inventory.totalStock}, Required: ${quantity}`);
      }

      const stockBefore = { total: inventory.totalStock, reserved: inventory.reservedStock, available: inventory.totalStock - inventory.reservedStock };

      const updatedInventory = await InventoryMaster.findOneAndUpdate(
        { _id: inventory._id, totalStock: { $gte: quantity } },
        {
          $inc: {
            totalStock: -quantity,
            reservedStock: -Math.min(quantity, inventory.reservedStock || 0)
          },
          $set: { lastUpdated: new Date() }
        },
        { new: true }
      );

      if (!updatedInventory) throw new Error('Stock deduction failed (Concurrent update or insufficient stock)');

      const stockAfter = { total: updatedInventory.totalStock, reserved: updatedInventory.reservedStock, available: updatedInventory.totalStock - updatedInventory.reservedStock };

      await this._createLedgerEntry({
        variantId: updatedInventory.variantId,
        productId: updatedInventory.productId,
        sku: updatedInventory.sku,
        transactionType: 'STOCK_OUT',
        quantity: -quantity,
        stockBefore,
        stockAfter,
        reason: 'ORDER_SALE',
        notes: `Order ${orderId}`,
        performedBy: 'SYSTEM',
        referenceType: 'ORDER',
        referenceId: orderId
      });

      return updatedInventory;
    } catch (error) {
      throw error;
    }
  }

  async restoreStockForCancelledOrder(variantId, quantity, orderId) {
    try {
      const inventory = await this._getOrCreateInventory(variantId);

      const stockBefore = { total: inventory.totalStock, reserved: inventory.reservedStock, available: inventory.totalStock - inventory.reservedStock };

      const updatedInventory = await InventoryMaster.findOneAndUpdate(
        { _id: inventory._id },
        {
          $inc: { totalStock: quantity },
          $set: { lastUpdated: new Date() }
        },
        { new: true }
      );

      const stockAfter = { total: updatedInventory.totalStock, reserved: updatedInventory.reservedStock, available: updatedInventory.totalStock - updatedInventory.reservedStock };

      await this._createLedgerEntry({
        variantId: updatedInventory.variantId,
        productId: updatedInventory.productId,
        sku: updatedInventory.sku,
        transactionType: 'STOCK_IN',
        quantity: quantity,
        stockBefore,
        stockAfter,
        reason: 'ORDER_CANCELLED',
        notes: `Order ${orderId} Cancelled`,
        performedBy: 'SYSTEM',
        referenceType: 'ORDER',
        referenceId: orderId
      });

      return updatedInventory;
    } catch (error) {
      throw error;
    }
  }

  // ========================================================================
  // 4. RESERVATIONS
  // ========================================================================

  async reserveStock(variantId, quantity, referenceId) {
    try {
      const inventory = await this._getOrCreateInventory(variantId);

      const available = inventory.totalStock - (inventory.reservedStock || 0);
      if (available < quantity) throw new Error('Insufficient available stock');

      const stockBefore = { total: inventory.totalStock, reserved: inventory.reservedStock, available };

      const updatedInventory = await InventoryMaster.findOneAndUpdate(
        { _id: inventory._id, totalStock: { $gte: (inventory.reservedStock || 0) + quantity } },
        {
          $inc: { reservedStock: quantity },
          $set: { lastUpdated: new Date() }
        },
        { new: true }
      );

      if (!updatedInventory) throw new Error('Reservation failed (Concurrent update or insufficient stock)');

      const stockAfter = { total: updatedInventory.totalStock, reserved: updatedInventory.reservedStock, available: updatedInventory.totalStock - updatedInventory.reservedStock };

      await this._createLedgerEntry({
        variantId: updatedInventory.variantId,
        productId: updatedInventory.productId,
        sku: updatedInventory.sku,
        transactionType: 'RESERVE',
        quantity: quantity,
        stockBefore,
        stockAfter,
        reason: 'CART_RESERVED',
        notes: `Reserved for ${referenceId}`,
        performedBy: 'SYSTEM',
        referenceId
      });

      return updatedInventory;
    } catch (error) {
      throw error;
    }
  }

  async releaseReservedStock(productId, quantity) {
    const variantId = productId;
    try {
      const inventory = await InventoryMaster.findOne({ variantId });
      if (!inventory) throw new Error('Inventory not found');

      const stockBefore = { total: inventory.totalStock, reserved: inventory.reservedStock, available: inventory.totalStock - inventory.reservedStock };

      const updatedInventory = await InventoryMaster.findOneAndUpdate(
        { _id: inventory._id },
        {
          $inc: { reservedStock: -Math.min(quantity, inventory.reservedStock || 0) },
          $set: { lastUpdated: new Date() }
        },
        { new: true }
      );

      const stockAfter = { total: updatedInventory.totalStock, reserved: updatedInventory.reservedStock, available: updatedInventory.totalStock - updatedInventory.reservedStock };

      await this._createLedgerEntry({
        variantId: updatedInventory.variantId,
        productId: updatedInventory.productId,
        sku: updatedInventory.sku,
        transactionType: 'RELEASE',
        quantity: quantity,
        stockBefore,
        stockAfter,
        reason: 'CART_EXPIRED',
        performedBy: 'SYSTEM'
      });

      return updatedInventory;
    } catch (error) {
      throw error;
    }
  }

  // ========================================================================
  // 5. QUERY / REPORTING
  // ========================================================================

  async getAllInventories(filters, page, limit) {
    const skip = (page - 1) * limit;
    const query = {};

    // Filter by SKU via Variant lookups if needed, or directly if SKU stored in Master
    // Master has SKU.
    if (filters.search) {
      query.sku = { $regex: filters.search, $options: 'i' };
    }
    if (filters.stockStatus) { // Controller uses stockStatus
      query.status = filters.stockStatus.toUpperCase();
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.lowStock === 'true') {
      // query.$where = "this.totalStock <= this.lowStockThreshold"; // Slow
      query.status = 'LOW_STOCK';
    }

    const inventories = await InventoryMaster.find(query)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'variantId',
        select: 'attributes size color price mrp images colorwayName colorParts',
        populate: [
          { path: 'size', select: 'name code' },
          { path: 'color', select: 'name hexCode' }
        ]
      })
      .populate('productId', 'name slug brand category')
      .populate('locations.warehouseId', 'name code');

    const total = await InventoryMaster.countDocuments(query);

    return { inventories, total, page, totalPages: Math.ceil(total / limit) };
  }

  // Alias for Controller compatibility
  async bulkUpdateStock(updates, performedBy) {
    return this.bulkUpdateInventories(updates, performedBy);
  }

  async getInventoryByProductId(productId) {
    // Find all variants for product, then get inventory
    return InventoryMaster.find({ productId });
  }

  async getInventoryLedger(productId, filters) {
    const query = { productId };
    if (filters.startDate) query.transactionDate = { ...query.transactionDate, $gte: new Date(filters.startDate) };
    if (filters.endDate) query.transactionDate = { ...query.transactionDate, $lte: new Date(filters.endDate) };
    if (filters.transactionType) query.transactionType = filters.transactionType;

    return InventoryLedger.find(query).sort({ transactionDate: -1 }).limit(100);
  }

  async getLowStockItems() {
    return InventoryMaster.find({ status: { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] } })
      .populate('variantId')
      .populate('productId');
  }

  async getReorderSuggestions() {
    return this.getLowStockItems();
  }

  async getInventoryStats() {
    // Aggregation on InventoryMaster
    const stats = await InventoryMaster.aggregate([
      {
        $group: {
          _id: null,
          totalUnits: { $sum: '$totalStock' },
          lowStockCount: { $sum: { $cond: [{ $eq: ['$status', 'LOW_STOCK'] }, 1, 0] } },
          outOfStockCount: { $sum: { $cond: [{ $eq: ['$status', 'OUT_OF_STOCK'] }, 1, 0] } }
          // Value requires joining with Variant price? Or we store cost?
          // Ignoring value for now to keep simple, or approximation
        }
      }
    ]);
    return stats[0] || { totalUnits: 0, lowStockCount: 0, outOfStockCount: 0 };
  }

  // Clean up legacy
  async adjustStock(data) {
    const val = await this.updateStock(
      data.variantId,
      (data.transactionType === 'SET') ? data.quantity : 0, // Simplified adapter
      data.reason,
      data.performedBy
    );
    return { message: 'Updated', inventory: val.inventory };
  }

  async updateInventoryMaster(id, data, updatedBy) {
    // 'id' here is likely InventoryMaster ID or Variant ID depending on route.
    // Controller passes 'id' from params.
    // Let's assume it matches the route /inventory-master/:id
    const inventory = await InventoryMaster.findByIdAndUpdate(id, data, { new: true });
    return inventory;
  }

  // ========================================================================
  // MISSING METHODS ADDED FOR CONTROLLER COMPATIBILITY
  // ========================================================================

  async getInventoryByVariantId(variantId) {
    const inventory = await InventoryMaster.findOne({ variantId })
      .populate({
        path: 'variantId',
        select: 'attributes size color price mrp images colorwayName colorParts',
        populate: [
          { path: 'size', select: 'name code' },
          { path: 'color', select: 'name hexCode' }
        ]
      })
      .populate('productId', 'name slug brand category')
      .populate('locations.warehouseId', 'name code');

    if (!inventory) throw new Error('Inventory not found');
    return inventory;
  }

  async getOutOfStockItems() {
    return InventoryMaster.find({ status: 'OUT_OF_STOCK' })
      .populate({
        path: 'variantId',
        populate: [
          { path: 'size', select: 'name code' },
          { path: 'color', select: 'name hexCode' }
        ]
      })
      .populate('productId')
      .populate('locations.warehouseId', 'name code');
  }

  async softDeleteInventory(variantId, deletedBy) {
    // InventoryMaster doesn't have isDeleted flag in Schema!
    // But we can set status to DISCONTINUED
    const inventory = await InventoryMaster.findOne({ variantId });
    if (!inventory) throw new Error('Inventory not found');

    inventory.status = 'DISCONTINUED';
    inventory.save();
    return inventory;
  }

  async restoreInventory(variantId) {
    const inventory = await InventoryMaster.findOne({ variantId });
    if (!inventory) throw new Error('Inventory not found');

    // Recalculate status
    if (inventory.totalStock === 0) inventory.status = 'OUT_OF_STOCK';
    else if (inventory.totalStock <= inventory.lowStockThreshold) inventory.status = 'LOW_STOCK';
    else inventory.status = 'IN_STOCK';

    inventory.save();
    return inventory;
  }
}

export default new InventoryService();
