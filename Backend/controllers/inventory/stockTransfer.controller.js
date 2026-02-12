
import stockTransferService from '../../services/stockTransfer.service.js';

class StockTransferController {

    async create(req, res) {
        try {
            const performedBy = 'SYSTEM';

            const data = {
                ...req.body,
                requestedBy: performedBy
            };

            const transfer = await stockTransferService.createTransfer(data);
            res.status(201).json({ success: true, data: transfer });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getAll(req, res) {
        try {
            const transfers = await stockTransferService.getAllTransfers(req.query);
            res.status(200).json({ success: true, data: transfers });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getById(req, res) {
        try {
            const transfer = await stockTransferService.getTransferById(req.params.id);
            if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
            res.status(200).json({ success: true, data: transfer });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async complete(req, res) {
        try {
            const transfer = await stockTransferService.completeTransfer(req.params.id);
            res.status(200).json({ success: true, message: 'Transfer completed', data: transfer });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async cancel(req, res) {
        try {
            const transfer = await stockTransferService.cancelTransfer(req.params.id);
            res.status(200).json({ success: true, message: 'Transfer cancelled', data: transfer });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

export default new StockTransferController();
