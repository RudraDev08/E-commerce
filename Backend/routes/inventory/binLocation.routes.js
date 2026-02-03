
import express from 'express';
import binLocationController from '../../controllers/inventory/binLocation.controller.js';

const router = express.Router();

router.post('/', binLocationController.create.bind(binLocationController));
router.get('/warehouse/:warehouseId', binLocationController.getByWarehouse.bind(binLocationController));
router.put('/:id', binLocationController.update.bind(binLocationController));
router.delete('/:id', binLocationController.delete.bind(binLocationController));

export default router;
