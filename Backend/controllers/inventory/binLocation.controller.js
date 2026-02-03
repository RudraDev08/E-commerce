
import binLocationService from '../../services/binLocation.service.js';

class BinLocationController {

    async create(req, res) {
        try {
            const bin = await binLocationService.createBin(req.body);
            res.status(201).json({ success: true, data: bin });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getByWarehouse(req, res) {
        try {
            const bins = await binLocationService.getBinsByWarehouse(req.params.warehouseId);
            res.status(200).json({ success: true, data: bins });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async update(req, res) {
        try {
            const bin = await binLocationService.updateBin(req.params.id, req.body);
            res.status(200).json({ success: true, data: bin });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async delete(req, res) {
        try {
            await binLocationService.deleteBin(req.params.id);
            res.status(200).json({ success: true, message: 'Bin location deactivated' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

export default new BinLocationController();
