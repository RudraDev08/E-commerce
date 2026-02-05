import Warehouse from '../models/inventory/Warehouse.model.js';
import Variant from '../models/Variant/VariantSchema.js';

class WarehouseService {

    /**
     * Create a new warehouse
     */
    async createWarehouse(data) {
        const warehouse = new Warehouse(data);
        return await warehouse.save();
    }

    /**
     * Get all warehouses
     */
    async getAllWarehouses() {
        return await Warehouse.find({ isActive: true }).sort({ isDefault: -1, name: 1 });
    }

    /**
     * Get warehouse by ID
     */
    async getWarehouseById(id) {
        return await Warehouse.findById(id);
    }

    /**
     * Update warehouse
     */
    async updateWarehouse(id, data) {
        // If setting as default, let the pre-save hook handle unsetting others
        const warehouse = await Warehouse.findById(id);
        if (!warehouse) throw new Error('Warehouse not found');

        Object.assign(warehouse, data);
        return await warehouse.save();
    }

    /**
     * Delete warehouse (Soft delete or strict check)
     */
    async deleteWarehouse(id) {
        // strict check: does it have inventory?
        // For Phase 3 start, we'll just soft delete
        return await Warehouse.findByIdAndUpdate(id, { isActive: false }, { new: true });
    }
}

export default new WarehouseService();
