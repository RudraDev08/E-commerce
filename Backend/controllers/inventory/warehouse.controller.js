
import warehouseService from '../../services/warehouse.service.js';

class WarehouseController {

    async getAll(req, res) {
        try {
            const warehouses = await warehouseService.getAllWarehouses();
            res.status(200).json({ success: true, data: warehouses });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async create(req, res) {
        try {
            const warehouse = await warehouseService.createWarehouse(req.body);
            res.status(201).json({ success: true, data: warehouse });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async update(req, res) {
        try {
            const warehouse = await warehouseService.updateWarehouse(req.params.id, req.body);
            res.status(200).json({ success: true, data: warehouse });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async delete(req, res) {
        try {
            await warehouseService.deleteWarehouse(req.params.id);
            res.status(200).json({ success: true, message: 'Warehouse deleted/deactivated' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

export default new WarehouseController();
