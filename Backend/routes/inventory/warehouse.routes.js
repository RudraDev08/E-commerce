
import express from 'express';
import warehouseController from '../../controllers/inventory/warehouse.controller.js';

const router = express.Router();

router.get('/', warehouseController.getAll.bind(warehouseController));
router.post('/', warehouseController.create.bind(warehouseController));
router.put('/:id', warehouseController.update.bind(warehouseController));
router.delete('/:id', warehouseController.delete.bind(warehouseController));

export default router;
