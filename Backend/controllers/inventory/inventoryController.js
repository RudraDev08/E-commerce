import inventoryService from '../../services/inventory.service.js';
import { validateInventoryMaster, validateStockAdjustment, sanitizeInput } from '../../middlewares/inventory.validation.js';

class InventoryController {

  /**
   * POST /inventory-master
   * Create new inventory master
   */
  async createInventory(req, res, next) {
    try {
      const sanitizedData = sanitizeInput(req.body);
      const validation = validateInventoryMaster(sanitizedData);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const inventory = await inventoryService.createInventoryMaster(sanitizedData);

      res.status(201).json({
        success: true,
        message: 'Inventory master created successfully',
        data: inventory
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Duplicate entry: SKU or Product ID already exists'
        });
      }
      next(error);
    }
  }

  /**
   * GET /inventory-master
   * Get all inventory masters with optional filters
   */
  async getAllInventories(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const filters = {
        status: req.query.status,
        search: req.query.search,
        lowStock: req.query.lowStock
      };

      const result = await inventoryService.getAllInventoryMasters(filters, page, limit);

      res.status(200).json({
        success: true,
        data: result.inventories,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /inventory-master/:productId
   * Get inventory by product ID
   */
  async getInventoryByProductId(req, res, next) {
    try {
      const { productId } = req.params;
      const inventory = await inventoryService.getInventoryByProductId(productId);

      res.status(200).json({
        success: true,
        data: inventory
      });
    } catch (error) {
      if (error.message === 'Inventory not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * PUT /inventory-master/:id
   * Update inventory master
   */
  async updateInventory(req, res, next) {
    try {
      const { id } = req.params;
      const sanitizedData = sanitizeInput(req.body);
      const updatedBy = req.body.updatedBy || 'ADMIN';

      const inventory = await inventoryService.updateInventoryMaster(id, sanitizedData, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Inventory updated successfully',
        data: inventory
      });
    } catch (error) {
      if (error.message === 'Inventory not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * PATCH /inventory-master/adjust
   * Adjust stock (IN/OUT/ADJUST)
   */
  async adjustStock(req, res, next) {
    try {
      const sanitizedData = sanitizeInput(req.body);
      const validation = validateStockAdjustment(sanitizedData);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const result = await inventoryService.adjustStock(sanitizedData);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          inventory: result.inventory,
          ledgerEntry: result.ledgerEntry
        }
      });
    } catch (error) {
      if (error.message.includes('Insufficient stock') ||
        error.message.includes('negative stock') ||
        error.message === 'Inventory not found') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * PATCH /inventory-master/bulk-update
   * Bulk update stock
   */
  async bulkUpdate(req, res, next) {
    try {
      const { updates } = req.body; // Expects { updates: [{ variantId, newStock, reason }] }

      if (!Array.isArray(updates)) {
        return res.status(400).json({ success: false, message: 'updates must be an array' });
      }

      const result = await inventoryService.bulkUpdateInventories(updates, req.body.performedBy || 'ADMIN');

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /inventory-ledger/:productId
   * Get inventory ledger for a product
   */
  async getInventoryLedger(req, res, next) {
    try {
      const { productId } = req.params;
      const filters = {
        transactionType: req.query.transactionType,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const ledger = await inventoryService.getInventoryLedger(productId, filters);

      res.status(200).json({
        success: true,
        count: ledger.length,
        data: ledger
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /inventory-master/low-stock
   * Get low stock items
   */
  async getLowStockItems(req, res, next) {
    try {
      const lowStockItems = await inventoryService.getLowStockItems();

      res.status(200).json({
        success: true,
        count: lowStockItems.length,
        data: lowStockItems
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /inventory-master/reorder-suggestions
   * Get reorder suggestions
   */
  async getReorderSuggestions(req, res, next) {
    try {
      const suggestions = await inventoryService.getReorderSuggestions();

      res.status(200).json({
        success: true,
        count: suggestions.length,
        data: suggestions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /inventory-master/stats
   * Get inventory statistics
   */
  async getInventoryStats(req, res, next) {
    try {
      const stats = await inventoryService.getInventoryStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /inventory-master/reserve
   * Reserve stock
   */
  async reserveStock(req, res, next) {
    try {
      const { productId, quantity } = req.body;

      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid productId and quantity are required'
        });
      }

      const inventory = await inventoryService.reserveStock(productId, quantity);

      res.status(200).json({
        success: true,
        message: 'Stock reserved successfully',
        data: inventory
      });
    } catch (error) {
      if (error.message.includes('Insufficient') || error.message === 'Inventory not found') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * POST /inventory-master/release-reserve
   * Release reserved stock
   */
  async releaseReservedStock(req, res, next) {
    try {
      const { productId, quantity } = req.body;

      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid productId and quantity are required'
        });
      }

      const inventory = await inventoryService.releaseReservedStock(productId, quantity);

      res.status(200).json({
        success: true,
        message: 'Reserved stock released successfully',
        data: inventory
      });
    } catch (error) {
      if (error.message === 'Inventory not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }
}

export default new InventoryController();