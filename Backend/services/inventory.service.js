import InventoryMaster from '../models/inventory/inventoryMasterSchema.js';
import InventoryLedger from '../models/inventory/inventoryLedgerSchema.js';

class InventoryService {
  
  /**
   * Create new inventory master entry
   */
  async createInventoryMaster(data) {
    const inventory = new InventoryMaster({
      ...data,
      currentStock: data.openingStock || 0,
      availableStock: data.openingStock || 0
    });

    await inventory.save();

    // Create opening stock ledger entry if opening stock > 0
    if (data.openingStock > 0) {
      await this.createLedgerEntry({
        productId: inventory.productId,
        sku: inventory.sku,
        transactionType: 'IN',
        quantity: data.openingStock,
        stockBefore: 0,
        stockAfter: data.openingStock,
        reason: 'Opening Stock',
        referenceType: 'OTHER',
        unitCost: data.costPrice || 0,
        performedBy: data.createdBy || 'SYSTEM'
      });
    }

    return inventory;
  }

  /**
   * Get all inventory masters with filters
   */
  async getAllInventoryMasters(filters = {}) {
    const query = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.search) {
      query.$or = [
        { productId: { $regex: filters.search, $options: 'i' } },
        { productName: { $regex: filters.search, $options: 'i' } },
        { sku: { $regex: filters.search, $options: 'i' } },
        { barcode: { $regex: filters.search, $options: 'i' } }
      ];
    }
    if (filters.lowStock === 'true') {
      query.$expr = { $lte: ['$currentStock', '$reorderLevel'] };
    }

    const inventories = await InventoryMaster.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return inventories;
  }

  /**
   * Get inventory by product ID
   */
  async getInventoryByProductId(productId) {
    const inventory = await InventoryMaster.findOne({ productId });
    if (!inventory) {
      throw new Error('Inventory not found');
    }
    return inventory;
  }

  /**
   * Update inventory master
   */
  async updateInventoryMaster(id, data, updatedBy = 'SYSTEM') {
    const inventory = await InventoryMaster.findById(id);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    // Update fields
    Object.keys(data).forEach(key => {
      if (key !== 'currentStock' && key !== 'reservedStock') {
        inventory[key] = data[key];
      }
    });

    inventory.updatedBy = updatedBy;
    await inventory.save();

    return inventory;
  }

  /**
   * Adjust stock (IN/OUT/ADJUST)
   */
  async adjustStock(adjustmentData) {
    const { productId, transactionType, quantity, reason, referenceId, performedBy, requiresApproval } = adjustmentData;

    const inventory = await InventoryMaster.findOne({ productId });
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    const stockBefore = inventory.currentStock;
    let stockAfter = stockBefore;
    let adjustedQuantity = quantity;

    // Calculate stock after based on transaction type
    switch (transactionType) {
      case 'IN':
        stockAfter = stockBefore + Math.abs(quantity);
        adjustedQuantity = Math.abs(quantity);
        break;
      case 'OUT':
        if (stockBefore < Math.abs(quantity)) {
          throw new Error('Insufficient stock for OUT transaction');
        }
        stockAfter = stockBefore - Math.abs(quantity);
        adjustedQuantity = -Math.abs(quantity);
        break;
      case 'ADJUST':
        stockAfter = stockBefore + quantity; // Can be positive or negative
        adjustedQuantity = quantity;
        if (stockAfter < 0) {
          throw new Error('Stock adjustment would result in negative stock');
        }
        break;
      default:
        throw new Error('Invalid transaction type');
    }

    // Update inventory
    inventory.currentStock = stockAfter;
    inventory.updatedBy = performedBy || 'SYSTEM';
    await inventory.save();

    // Create ledger entry
    const ledgerEntry = await this.createLedgerEntry({
      productId: inventory.productId,
      sku: inventory.sku,
      transactionType,
      quantity: adjustedQuantity,
      stockBefore,
      stockAfter,
      reason,
      referenceId,
      referenceType: adjustmentData.referenceType || 'ADJUSTMENT',
      unitCost: inventory.costPrice,
      performedBy: performedBy || 'SYSTEM',
      requiresApproval: requiresApproval || false,
      approvalStatus: requiresApproval ? 'PENDING' : 'APPROVED',
      notes: adjustmentData.notes
    });

    return {
      inventory,
      ledgerEntry,
      message: `Stock ${transactionType} successful. New stock: ${stockAfter}`
    };
  }

  /**
   * Create ledger entry
   */
  async createLedgerEntry(ledgerData) {
    const ledger = new InventoryLedger(ledgerData);
    await ledger.save();
    return ledger;
  }

  /**
   * Get inventory ledger by product ID
   */
  async getInventoryLedger(productId, filters = {}) {
    const query = { productId };
    
    if (filters.transactionType) {
      query.transactionType = filters.transactionType;
    }
    if (filters.startDate || filters.endDate) {
      query.transactionDate = {};
      if (filters.startDate) {
        query.transactionDate.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.transactionDate.$lte = new Date(filters.endDate);
      }
    }

    const ledger = await InventoryLedger.find(query)
      .sort({ transactionDate: -1 })
      .lean();

    return ledger;
  }

  /**
   * Get low stock items
   */
  async getLowStockItems() {
    const lowStockItems = await InventoryMaster.find({
      $expr: { $lte: ['$currentStock', '$reorderLevel'] },
      status: 'ACTIVE'
    }).lean();

    return lowStockItems;
  }

  /**
   * Get reorder suggestions
   */
  async getReorderSuggestions() {
    const suggestions = await InventoryMaster.find({
      $expr: { $lte: ['$currentStock', '$reorderLevel'] },
      autoReorderSuggestion: true,
      status: 'ACTIVE'
    }).lean();

    return suggestions.map(item => ({
      ...item,
      suggestedOrderQuantity: item.reorderQuantity,
      currentShortfall: item.reorderLevel - item.currentStock
    }));
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats() {
    const totalItems = await InventoryMaster.countDocuments();
    const activeItems = await InventoryMaster.countDocuments({ status: 'ACTIVE' });
    const lowStockItems = await InventoryMaster.countDocuments({
      $expr: { $lte: ['$currentStock', '$reorderLevel'] }
    });
    
    const stockValue = await InventoryMaster.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: null, totalValue: { $sum: '$stockValue' } } }
    ]);

    return {
      totalItems,
      activeItems,
      lowStockItems,
      totalStockValue: stockValue[0]?.totalValue || 0
    };
  }

  /**
   * Reserve stock (for orders)
   */
  async reserveStock(productId, quantity) {
    const inventory = await InventoryMaster.findOne({ productId });
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    if (inventory.availableStock < quantity) {
      throw new Error('Insufficient available stock for reservation');
    }

    inventory.reservedStock += quantity;
    await inventory.save();

    return inventory;
  }

  /**
   * Release reserved stock
   */
  async releaseReservedStock(productId, quantity) {
    const inventory = await InventoryMaster.findOne({ productId });
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    inventory.reservedStock = Math.max(0, inventory.reservedStock - quantity);
    await inventory.save();

    return inventory;
  }
}

export default new InventoryService();