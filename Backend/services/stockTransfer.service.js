
import mongoose from 'mongoose';
import StockTransfer from '../models/inventory/StockTransfer.model.js';
import inventoryService from './inventory.service.js';

class StockTransferService {

    /**
     * Create a new transfer request
     */
    async createTransfer(data) {
        // Generate Transfer Number
        const count = await StockTransfer.countDocuments();
        const transferNumber = `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        const transfer = new StockTransfer({
            ...data,
            transferNumber
        });

        return await transfer.save();
    }

    /**
     * Get all transfers
     */
    async getAllTransfers(filters = {}) {
        return await StockTransfer.find(filters)
            .populate('sourceWarehouse', 'name code')
            .populate('destinationWarehouse', 'name code')
            .populate('items.variant', 'sku name')
            .sort({ createdAt: -1 });
    }

    /**
     * Get transfer by ID
     */
    async getTransferById(id) {
        return await StockTransfer.findById(id)
            .populate('sourceWarehouse', 'name code')
            .populate('destinationWarehouse', 'name code')
            .populate('items.variant', 'sku name');
    }

    /**
     * Complete a transfer
     * Moves stock and updates status
     */
    async completeTransfer(transferId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const transfer = await StockTransfer.findById(transferId).session(session);

            if (!transfer) throw new Error('Transfer request not found');
            if (transfer.status !== 'PENDING') throw new Error(`Cannot complete transfer in ${transfer.status} status`);

            // Process each item
            for (const item of transfer.items) {
                await inventoryService.moveStock(
                    item.variant,
                    transfer.sourceWarehouse,
                    transfer.destinationWarehouse,
                    item.quantity,
                    'SYSTEM', // userId removed
                    session
                );
            }

            transfer.status = 'COMPLETED';
            transfer.completedBy = userId;
            transfer.completedAt = new Date();

            await transfer.save({ session });
            await session.commitTransaction();

            return transfer;

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Cancel a transfer
     */
    async cancelTransfer(transferId) {
        const transfer = await StockTransfer.findById(transferId);
        if (!transfer) throw new Error('Transfer not found');
        if (transfer.status !== 'PENDING') throw new Error('Only pending transfers can be cancelled');

        transfer.status = 'CANCELLED';
        transfer.notes = (transfer.notes || '') + ` [Cancelled by SYSTEM]`;

        return await transfer.save();
    }
}

export default new StockTransferService();
