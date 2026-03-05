import mongoose from 'mongoose';
import StockTransfer from '../models/inventory/StockTransfer.model.js';
import InventoryStockByLocation from '../models/inventory/InventoryStockByLocation.model.js';
import InventoryLedger from '../models/inventory/InventoryLedger.model.js';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';

class StockTransferService {

    /**
     * Create a new transfer request
     */
    async createTransfer(data) {
        const count = await StockTransfer.countDocuments();
        const transferNumber = `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
        const transfer = new StockTransfer({ ...data, transferNumber });
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
     * Complete a transfer — FULLY ATOMIC
     *
     * For every item in the transfer:
     *   1. Debit source  InventoryStockByLocation  (conditional: availableStock >= qty)
     *   2. Credit dest   InventoryStockByLocation  (upsert if row missing)
     *   3. Write STOCK_OUT ledger entry on source
     *   4. Write STOCK_IN  ledger entry on destination
     *
     * All steps run inside a single MongoDB session. Any failure rolls back every step.
     *
     * @param {string} transferId   - StockTransfer._id
     * @param {string} completedBy  - userId or label of the approver
     */
    async completeTransfer(transferId, completedBy = 'SYSTEM') {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Load and lock the transfer ──────────────────────────────────
            const transfer = await StockTransfer.findById(transferId).session(session);

            if (!transfer) throw new Error('Transfer request not found');
            if (transfer.status !== 'PENDING') {
                throw new Error(`Cannot complete transfer in '${transfer.status}' status`);
            }

            const srcWh = transfer.sourceWarehouse;
            const destWh = transfer.destinationWarehouse;

            // 2. Process each item atomically ─────────────────────────────────
            for (const item of transfer.items) {
                const { variant: variantId, sku, quantity: qty } = item;

                // 2a. Fetch InventoryMaster for snapshot data
                const master = await InventoryMaster
                    .findOne({ variantId })
                    .session(session)
                    .lean();

                const stockSnapshot = {
                    total: master?.totalStock ?? 0,
                    reserved: master?.reservedStock ?? 0,
                    available: master?.availableStock ?? 0
                };

                // 2b. Debit source warehouse (conditional — prevents overselling)
                const srcRow = await InventoryStockByLocation.findOneAndUpdate(
                    {
                        variantId,
                        warehouseId: srcWh,
                        availableStock: { $gte: qty },
                        isActive: true
                    },
                    {
                        $inc: { stock: -qty, availableStock: -qty },
                        $set: { lastUpdated: new Date() }
                    },
                    { new: true, session }
                );

                if (!srcRow) {
                    throw new Error(
                        `Insufficient stock at source warehouse for ${sku || variantId} (need ${qty})`
                    );
                }

                // 2c. Credit destination warehouse (upsert if first stock here)
                await InventoryStockByLocation.findOneAndUpdate(
                    { variantId, warehouseId: destWh },
                    {
                        $inc: { stock: qty, availableStock: qty },
                        $setOnInsert: {
                            variantId,
                            warehouseId: destWh,
                            productId: master?.productId,
                            sku: sku || master?.sku,
                            reservedStock: 0,
                            isActive: true
                        },
                        $set: { lastUpdated: new Date() }
                    },
                    { upsert: true, new: true, session }
                );

                const stockAfterSrc = {
                    total: srcRow.stock,
                    reserved: srcRow.reservedStock,
                    available: srcRow.availableStock
                };

                const ledgerBase = {
                    variantId,
                    productId: master?.productId,
                    sku: sku || master?.sku || 'UNKNOWN',
                    quantity: qty,
                    performedBy: completedBy,
                    performedByRole: 'ADMIN',
                    referenceType: 'TRANSFER',
                    referenceId: transfer._id
                };

                // 2d. STOCK_OUT ledger entry on source
                await InventoryLedger.create([{
                    ...ledgerBase,
                    transactionType: 'STOCK_OUT',
                    stockBefore: stockSnapshot,
                    stockAfter: stockAfterSrc,
                    reason: 'TRANSFER_DEBIT',
                    notes: `Transfer ${transfer.transferNumber}: debit from warehouse ${srcWh}`
                }], { session });

                // 2e. STOCK_IN ledger entry on destination
                await InventoryLedger.create([{
                    ...ledgerBase,
                    transactionType: 'STOCK_IN',
                    stockBefore: stockAfterSrc,
                    stockAfter: { ...stockAfterSrc, total: stockAfterSrc.total + qty, available: stockAfterSrc.available + qty },
                    reason: 'TRANSFER_CREDIT',
                    notes: `Transfer ${transfer.transferNumber}: credit to warehouse ${destWh}`
                }], { session });
            }

            // 3. Mark transfer COMPLETED ───────────────────────────────────────
            transfer.status = 'COMPLETED';
            transfer.completedBy = completedBy;
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
    async cancelTransfer(transferId, cancelledBy = 'SYSTEM', reason = '') {
        const transfer = await StockTransfer.findById(transferId);
        if (!transfer) throw new Error('Transfer not found');
        if (transfer.status !== 'PENDING') throw new Error('Only PENDING transfers can be cancelled');

        transfer.status = 'CANCELLED';
        transfer.notes = [transfer.notes, `[Cancelled by ${cancelledBy}${reason ? ': ' + reason : ''}]`]
            .filter(Boolean).join(' ');

        return await transfer.save();
    }
}

export default new StockTransferService();
