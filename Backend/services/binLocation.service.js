
import BinLocation from '../models/inventory/BinLocation.model.js';

class BinLocationService {

    async createBin(data) {
        const bin = new BinLocation(data);
        return await bin.save();
    }

    async getBinsByWarehouse(warehouseId) {
        return await BinLocation.find({ warehouse: warehouseId, isActive: true });
    }

    async updateBin(id, data) {
        return await BinLocation.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteBin(id) {
        return await BinLocation.findByIdAndUpdate(id, { isActive: false }, { new: true });
    }

    // Auto-generate bins logic (e.g., A-01-01 to A-10-10)
    async bulkCreateBins(warehouseId, zone, aisleRange, rackRange, shelfRange) {
        // ... logic to loop and create
        // keeping simple for now
    }
}

export default new BinLocationService();
