import express from 'express';
import inventoryController from '../../controllers/inventory/inventory.controller.js';

const router = express.Router();

/**
 * ========================================================================
 * INVENTORY ROUTES
 * ========================================================================
 */

// ========================================================================
// 1. QUERY ROUTES
// ========================================================================

// Get all inventories with filters & pagination
router.get('/', inventoryController.getAllInventories.bind(inventoryController));

// Get inventory statistics
router.get('/stats', inventoryController.getInventoryStats.bind(inventoryController));

// Get low stock items
router.get('/low-stock', inventoryController.getLowStockItems.bind(inventoryController));

// Get out of stock items
router.get('/out-of-stock', inventoryController.getOutOfStockItems.bind(inventoryController));

// Get inventory by variant ID
router.get('/:variantId', inventoryController.getInventoryByVariantId.bind(inventoryController));

// Get inventory ledger for a variant
router.get('/:variantId/ledger', inventoryController.getInventoryLedger.bind(inventoryController));

// ========================================================================
// 2. MANUAL STOCK UPDATE ROUTES
// ========================================================================

// Update stock manually
router.put('/:variantId/update-stock', inventoryController.updateStock.bind(inventoryController));

// Bulk update stock
router.post('/bulk-update', inventoryController.bulkUpdateStock.bind(inventoryController));

// ========================================================================
// 3. RESERVED STOCK ROUTES
// ========================================================================

// Reserve stock
router.post('/:variantId/reserve', inventoryController.reserveStock.bind(inventoryController));

// Release reserved stock
router.post('/:variantId/release', inventoryController.releaseReservedStock.bind(inventoryController));

// ========================================================================
// 4. AUTOMATED ORDER FLOW ROUTES
// ========================================================================

// Deduct stock (order confirmed)
router.post('/:variantId/deduct', inventoryController.deductStockForOrder.bind(inventoryController));

// Restore stock (order cancelled)
router.post('/:variantId/restore', inventoryController.restoreStockForCancelledOrder.bind(inventoryController));

// Restore stock (customer return)
router.post('/:variantId/return', inventoryController.restoreStockForReturn.bind(inventoryController));

// ========================================================================
// 5. SOFT DELETE & RESTORE ROUTES
// ========================================================================

// Soft delete inventory
router.delete('/:variantId', inventoryController.softDeleteInventory.bind(inventoryController));

// Restore deleted inventory
router.post('/:variantId/restore-deleted', inventoryController.restoreInventory.bind(inventoryController));

export default router;
