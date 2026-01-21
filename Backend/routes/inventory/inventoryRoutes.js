import express from 'express';
import inventoryController from '../../controllers/inventory/inventoryController.js';

const router = express.Router();

// Inventory Master Routes
router.post('/inventory-master', inventoryController.createInventory.bind(inventoryController));
router.get('/inventory-master', inventoryController.getAllInventories.bind(inventoryController));
router.get('/inventory-master/low-stock', inventoryController.getLowStockItems.bind(inventoryController));
router.get('/inventory-master/reorder-suggestions', inventoryController.getReorderSuggestions.bind(inventoryController));
router.get('/inventory-master/stats', inventoryController.getInventoryStats.bind(inventoryController));
router.get('/inventory-master/:productId', inventoryController.getInventoryByProductId.bind(inventoryController));
router.put('/inventory-master/:id', inventoryController.updateInventory.bind(inventoryController));

// Stock Adjustment Routes
router.patch('/inventory-master/adjust', inventoryController.adjustStock.bind(inventoryController));
router.post('/inventory-master/reserve', inventoryController.reserveStock.bind(inventoryController));
router.post('/inventory-master/release-reserve', inventoryController.releaseReservedStock.bind(inventoryController));

// Inventory Ledger Routes
router.get('/inventory-ledger/:productId', inventoryController.getInventoryLedger.bind(inventoryController));

export default router;