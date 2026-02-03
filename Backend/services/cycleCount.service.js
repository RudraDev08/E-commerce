
import CycleCount from '../models/inventory/CycleCount.model.js';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import inventoryService from './inventory.service.js';
import mongoose from 'mongoose';

class CycleCountService {
    /**
     * Start a new cycle count (creates snapshot)
     */
    async startCycleCount(data, createdBy) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Generate count number
            const count = await CycleCount.countDocuments();
            const countNumber = `CC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

            // 2. Fetch inventory for that warehouse to create snapshot
            // For now, let's assume we count all items in that warehouse
            const inventories = await InventoryMaster.find({
                'locations.warehouseId': data.warehouse
            }).session(session);

            const items = inventories.map(inv => {
                const loc = inv.locations.find(l => l.warehouseId.toString() === data.warehouse.toString());
                return {
                    inventory: inv._id,
                    variant: inv.variantId,
                    sku: inv.sku,
                    systemQuantity: loc ? loc.stock : 0,
                    countedQuantity: 0,
                    variance: 0,
                    status: 'PENDING'
                };
            });

            const cycleCount = new CycleCount({
                countNumber,
                warehouse: data.warehouse,
                countType: data.countType || 'FULL',
                status: 'IN_PROGRESS',
                items,
                summary: {
                    totalItems: items.length,
                    itemsCounted: 0,
                    totalVariance: 0,
                    adjustmentsMade: 0
                },
                createdBy,
                startedAt: new Date(),
                notes: data.notes
            });

            await cycleCount.save({ session });
            await session.commitTransaction();
            return cycleCount;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Update count for an item
     */
    async updateItemCount(id, itemId, quantity) {
        const cycleCount = await CycleCount.findById(id);
        if (!cycleCount) throw new Error('Cycle count not found');
        if (cycleCount.status !== 'IN_PROGRESS') throw new Error('Cycle count is not in progress');

        const itemIndex = cycleCount.items.findIndex(i => i._id.toString() === itemId);
        if (itemIndex === -1) throw new Error('Item not found in this count');

        const item = cycleCount.items[itemIndex];
        item.countedQuantity = quantity;
        item.variance = quantity - item.systemQuantity;
        item.status = item.variance === 0 ? 'MATCH' : 'VARIANCE';

        // Update summary
        cycleCount.summary.itemsCounted = cycleCount.items.filter(i => i.countedQuantity > 0).length;
        cycleCount.summary.totalVariance = cycleCount.items.reduce((acc, curr) => acc + Math.abs(curr.variance), 0);

        return await cycleCount.save();
    }

    /**
     * Finalize and apply adjustments
     */
    async finalizeCycleCount(id, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const cycleCount = await CycleCount.findById(id).session(session);
            if (!cycleCount) throw new Error('Cycle count not found');
            if (cycleCount.status !== 'IN_PROGRESS' && cycleCount.status !== 'REVIEW')
                throw new Error('Cycle count cannot be finalized in current status');

            // Process adjustments for items with variance
            for (const item of cycleCount.items) {
                if (item.variance !== 0) {
                    await inventoryService.updateLocationStock(
                        item.variant,
                        cycleCount.warehouse,
                        'set',
                        item.countedQuantity,
                        'AUDIT_ADJUSTMENT',
                        userId,
                        `Cycle Count: ${cycleCount.countNumber}`
                    );
                    item.status = 'ADJUSTED';
                    cycleCount.summary.adjustmentsMade++;
                }
            }

            cycleCount.status = 'COMPLETED';
            cycleCount.completedAt = new Date();

            await cycleCount.save({ session });
            await session.commitTransaction();
            return cycleCount;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getAll(filters) {
        return await CycleCount.find(filters).populate('warehouse', 'name code').sort({ createdAt: -1 });
    }

    async getById(id) {
        return await CycleCount.findById(id).populate('warehouse', 'name code');
    }
}

export default new CycleCountService();
