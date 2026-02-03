
import cycleCountService from '../../services/cycleCount.service.js';

class CycleCountController {

    async create(req, res) {
        try {
            const userId = req.user?.id || 'ADMIN';
            const cycleCount = await cycleCountService.startCycleCount(req.body, userId);
            res.status(201).json({ success: true, data: cycleCount });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getAll(req, res) {
        try {
            const counts = await cycleCountService.getAll(req.query);
            res.status(200).json({ success: true, data: counts });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getById(req, res) {
        try {
            const count = await cycleCountService.getById(req.params.id);
            if (!count) return res.status(404).json({ success: false, message: 'Count session not found' });
            res.status(200).json({ success: true, data: count });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateItem(req, res) {
        try {
            const { id, itemId } = req.params;
            const { quantity } = req.body;
            const result = await cycleCountService.updateItemCount(id, itemId, quantity);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async finalize(req, res) {
        try {
            const userId = req.user?.id || 'ADMIN';
            const result = await cycleCountService.finalizeCycleCount(req.params.id, userId);
            res.status(200).json({ success: true, message: 'Cycle count finalized and stock adjusted', data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

export default new CycleCountController();
