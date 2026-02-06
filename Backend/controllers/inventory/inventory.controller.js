import inventoryService from '../../services/inventory.service.js';

/**
 * ========================================================================
 * INVENTORY CONTROLLER - REST API ENDPOINTS
 * ========================================================================
 * 
 * ENDPOINTS:
 * - GET /api/inventory - Get all inventories (with filters & pagination)
 * - GET /api/inventory/stats - Get inventory statistics
 * - GET /api/inventory/low-stock - Get low stock items
 * - GET /api/inventory/out-of-stock - Get out of stock items
 * - GET /api/inventory/:variantId - Get inventory by variant ID
 * - GET /api/inventory/:variantId/ledger - Get inventory ledger
 * - PUT /api/inventory/:variantId/update-stock - Update stock manually
 * - POST /api/inventory/bulk-update - Bulk update stock
 * - POST /api/inventory/:variantId/reserve - Reserve stock
 * - POST /api/inventory/:variantId/release - Release reserved stock
 * - POST /api/inventory/:variantId/deduct - Deduct stock (order confirmed)
 * - POST /api/inventory/:variantId/restore - Restore stock (order cancelled)
 * - POST /api/inventory/:variantId/return - Restore stock (customer return)
 * - DELETE /api/inventory/:variantId - Soft delete inventory
 * - POST /api/inventory/:variantId/restore-deleted - Restore deleted inventory
 * ========================================================================
 */

class InventoryController {

    // ========================================================================
    // 1. QUERY ENDPOINTS
    // ========================================================================

    /**
     * GET /api/inventory
     * Get all inventories with filters and pagination
     */
    async getAllInventories(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;

            const filters = {
                stockStatus: req.query.stockStatus,
                search: req.query.search,
                lowStock: req.query.lowStock,
                outOfStock: req.query.outOfStock,
                warehouseId: req.query.warehouseId
            };

            const result = await inventoryService.getAllInventories(filters, page, limit);

            res.status(200).json({
                success: true,
                message: 'Inventories retrieved successfully',
                data: result.inventories,
                pagination: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages,
                    limit
                }
            });
        } catch (error) {
            console.error('Error getting inventories:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve inventories',
                error: error.message
            });
        }
    }

    /**
     * GET /api/inventory/stats
     * Get inventory statistics
     */
    async getInventoryStats(req, res) {
        try {
            const stats = await inventoryService.getInventoryStats();

            res.status(200).json({
                success: true,
                message: 'Statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Error getting stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve statistics',
                error: error.message
            });
        }
    }

    /**
     * GET /api/inventory/low-stock
     * Get low stock items
     */
    async getLowStockItems(req, res) {
        try {
            const items = await inventoryService.getLowStockItems();

            res.status(200).json({
                success: true,
                message: 'Low stock items retrieved successfully',
                count: items.length,
                data: items
            });
        } catch (error) {
            console.error('Error getting low stock items:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve low stock items',
                error: error.message
            });
        }
    }

    /**
     * GET /api/inventory/out-of-stock
     * Get out of stock items
     */
    async getOutOfStockItems(req, res) {
        try {
            const items = await inventoryService.getOutOfStockItems();

            res.status(200).json({
                success: true,
                message: 'Out of stock items retrieved successfully',
                count: items.length,
                data: items
            });
        } catch (error) {
            console.error('Error getting out of stock items:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve out of stock items',
                error: error.message
            });
        }
    }

    /**
     * GET /api/inventory/:variantId
     * Get inventory by variant ID
     */
    async getInventoryByVariantId(req, res) {
        try {
            const { variantId } = req.params;

            const inventory = await inventoryService.getInventoryByVariantId(variantId);

            res.status(200).json({
                success: true,
                message: 'Inventory retrieved successfully',
                data: inventory
            });
        } catch (error) {
            console.error('Error getting inventory:', error);

            if (error.message === 'Inventory not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to retrieve inventory',
                error: error.message
            });
        }
    }

    /**
     * GET /api/inventory/product/:productId
     * Get inventory by product ID
     */
    async getInventoryByProductId(req, res) {
        try {
            const { productId } = req.params;
            const inventory = await inventoryService.getInventoryByProductId(productId);

            res.status(200).json({
                success: true,
                message: 'Product inventory retrieved successfully',
                data: inventory
            });
        } catch (error) {
            console.error('Error getting product inventory:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve product inventory',
                error: error.message
            });
        }
    }

    /**
     * GET /api/inventory/:variantId/ledger
     * Get inventory ledger for a variant
     */
    async getInventoryLedger(req, res) {
        try {
            const { variantId } = req.params;
            const limit = parseInt(req.query.limit) || 100;

            const filters = {
                transactionType: req.query.transactionType,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };

            const ledger = await inventoryService.getInventoryLedger(variantId, filters, limit);

            res.status(200).json({
                success: true,
                message: 'Ledger retrieved successfully',
                count: ledger.length,
                data: ledger
            });
        } catch (error) {
            console.error('Error getting ledger:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve ledger',
                error: error.message
            });
        }
    }

    // ========================================================================
    // 2. MANUAL STOCK UPDATE ENDPOINTS
    // ========================================================================

    /**
     * PUT /api/inventory/:variantId/update-stock
     * Update stock manually with reason
     * Body: { newStock, reason, notes, performedBy }
     */
    async updateStock(req, res) {
        try {
            const { variantId } = req.params;
            const { newStock, reason, notes, performedBy, warehouseId, updateType, quantity } = req.body;

            // NEW: Warehouse Logic
            if (warehouseId) {
                if (!updateType || quantity === undefined) {
                    return res.status(400).json({
                        success: false,
                        message: 'updateType and quantity are required when updating warehouse stock'
                    });
                }

                const result = await inventoryService.updateLocationStock(
                    variantId,
                    warehouseId,
                    updateType,
                    parseInt(quantity),
                    reason,
                    performedBy || 'ADMIN',
                    notes || ''
                );

                return res.status(200).json({
                    success: true,
                    message: 'Location stock updated successfully',
                    data: result
                });
            }

            // FALLBACK: Legacy Total Stock Update
            // Validation
            if (newStock === undefined || newStock === null) {
                return res.status(400).json({
                    success: false,
                    message: 'newStock is required'
                });
            }

            if (!reason) {
                return res.status(400).json({
                    success: false,
                    message: 'reason is required'
                });
            }

            const result = await inventoryService.updateStock(
                variantId,
                parseInt(newStock),
                reason,
                performedBy || 'ADMIN',
                notes || ''
            );

            res.status(200).json({
                success: true,
                message: 'Stock updated successfully',
                data: result
            });
        } catch (error) {
            console.error('Error updating stock:', error);

            if (error.message.includes('cannot be negative') ||
                error.message.includes('below reserved') ||
                error.message === 'Inventory not found') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to update stock',
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * POST /api/inventory/bulk-update
     * Bulk update stock for multiple variants
     * Body: { updates: [{ variantId, newStock, reason, notes }], performedBy }
     */
    async bulkUpdateStock(req, res) {
        try {
            const { updates, performedBy } = req.body;

            if (!Array.isArray(updates) || updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'updates array is required and must not be empty'
                });
            }

            const result = await inventoryService.bulkUpdateStock(
                updates,
                performedBy || 'ADMIN'
            );

            res.status(200).json({
                success: true,
                message: `Bulk update completed. Success: ${result.successCount}, Failed: ${result.failedCount}`,
                data: result
            });
        } catch (error) {
            console.error('Error in bulk update:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to perform bulk update',
                error: error.message
            });
        }
    }

    // ========================================================================
    // 3. RESERVED STOCK ENDPOINTS
    // ========================================================================

    /**
     * POST /api/inventory/:variantId/reserve
     * Reserve stock for order/cart
     * Body: { quantity, referenceId, performedBy }
     */
    async reserveStock(req, res) {
        try {
            const { variantId } = req.params;
            const { quantity, referenceId, performedBy } = req.body;

            if (!quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid quantity is required'
                });
            }

            if (!referenceId) {
                return res.status(400).json({
                    success: false,
                    message: 'referenceId (order/cart ID) is required'
                });
            }

            const inventory = await inventoryService.reserveStock(
                variantId,
                parseInt(quantity),
                referenceId,
                performedBy || 'SYSTEM'
            );

            res.status(200).json({
                success: true,
                message: 'Stock reserved successfully',
                data: inventory
            });
        } catch (error) {
            console.error('Error reserving stock:', error);

            if (error.message.includes('Insufficient') || error.message === 'Inventory not found') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to reserve stock',
                error: error.message
            });
        }
    }

    /**
     * POST /api/inventory/:variantId/release
     * Release reserved stock
     * Body: { quantity, referenceId, performedBy }
     */
    async releaseReservedStock(req, res) {
        try {
            const { variantId } = req.params;
            const { quantity, referenceId, performedBy } = req.body;

            if (!quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid quantity is required'
                });
            }

            const inventory = await inventoryService.releaseReservedStock(
                variantId,
                parseInt(quantity),
                referenceId || 'UNKNOWN',
                performedBy || 'SYSTEM'
            );

            res.status(200).json({
                success: true,
                message: 'Reserved stock released successfully',
                data: inventory
            });
        } catch (error) {
            console.error('Error releasing stock:', error);

            if (error.message.includes('Cannot release') || error.message === 'Inventory not found') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to release reserved stock',
                error: error.message
            });
        }
    }

    /**
     * POST /api/inventory/cleanup-reservations
     * Cleanup expired reservations
     */
    async cleanupExpiredReservations(req, res) {
        try {
            const result = await inventoryService.cleanupExpiredReservations();

            res.status(200).json({
                success: true,
                message: 'Expired reservations cleaned up',
                count: result.length,
                data: result
            });
        } catch (error) {
            console.error('Error cleaning up reservations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cleanup reservations',
                error: error.message
            });
        }
    }

    // ========================================================================
    // 4. AUTOMATED ORDER FLOW ENDPOINTS
    // ========================================================================

    /**
     * POST /api/inventory/:variantId/deduct
     * Deduct stock when order is confirmed
     * Body: { quantity, orderId }
     */
    async deductStockForOrder(req, res) {
        try {
            const { variantId } = req.params;
            const { quantity, orderId } = req.body;

            if (!quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid quantity is required'
                });
            }

            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    message: 'orderId is required'
                });
            }

            const inventory = await inventoryService.deductStockForOrder(
                variantId,
                parseInt(quantity),
                orderId
            );

            res.status(200).json({
                success: true,
                message: 'Stock deducted successfully',
                data: inventory
            });
        } catch (error) {
            console.error('Error deducting stock:', error);

            if (error.message === 'Inventory not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to deduct stock',
                error: error.message
            });
        }
    }

    /**
     * POST /api/inventory/:variantId/restore
     * Restore stock when order is cancelled
     * Body: { quantity, orderId }
     */
    async restoreStockForCancelledOrder(req, res) {
        try {
            const { variantId } = req.params;
            const { quantity, orderId } = req.body;

            if (!quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid quantity is required'
                });
            }

            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    message: 'orderId is required'
                });
            }

            const inventory = await inventoryService.restoreStockForCancelledOrder(
                variantId,
                parseInt(quantity),
                orderId
            );

            res.status(200).json({
                success: true,
                message: 'Stock restored successfully',
                data: inventory
            });
        } catch (error) {
            console.error('Error restoring stock:', error);

            if (error.message === 'Inventory not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to restore stock',
                error: error.message
            });
        }
    }

    /**
     * POST /api/inventory/:variantId/return
     * Restore stock when item is returned
     * Body: { quantity, orderId, isDamaged }
     */
    async restoreStockForReturn(req, res) {
        try {
            const { variantId } = req.params;
            const { quantity, orderId, isDamaged } = req.body;

            if (!quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid quantity is required'
                });
            }

            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    message: 'orderId is required'
                });
            }

            const inventory = await inventoryService.restoreStockForReturn(
                variantId,
                parseInt(quantity),
                orderId,
                isDamaged === true || isDamaged === 'true'
            );

            res.status(200).json({
                success: true,
                message: isDamaged
                    ? 'Return processed - Item damaged, not restocked'
                    : 'Return processed - Stock restored',
                data: inventory
            });
        } catch (error) {
            console.error('Error processing return:', error);

            if (error.message === 'Inventory not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to process return',
                error: error.message
            });
        }
    }

    // ========================================================================
    // 5. SOFT DELETE & RESTORE
    // ========================================================================

    /**
     * DELETE /api/inventory/:variantId
     * Soft delete inventory
     */
    async softDeleteInventory(req, res) {
        try {
            const { variantId } = req.params;
            const { deletedBy } = req.body;

            const inventory = await inventoryService.softDeleteInventory(
                variantId,
                deletedBy || 'ADMIN'
            );

            res.status(200).json({
                success: true,
                message: 'Inventory deleted successfully',
                data: inventory
            });
        } catch (error) {
            console.error('Error deleting inventory:', error);

            if (error.message === 'Inventory not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to delete inventory',
                error: error.message
            });
        }
    }

    /**
     * POST /api/inventory/:variantId/restore-deleted
     * Restore soft-deleted inventory
     */
    async restoreInventory(req, res) {
        try {
            const { variantId } = req.params;

            const inventory = await inventoryService.restoreInventory(variantId);

            res.status(200).json({
                success: true,
                message: 'Inventory restored successfully',
                data: inventory
            });
        } catch (error) {
            console.error('Error restoring inventory:', error);

            if (error.message === 'Deleted inventory not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to restore inventory',
                error: error.message
            });
        }
    }
}

export default new InventoryController();
