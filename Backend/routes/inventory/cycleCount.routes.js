
import express from 'express';
import cycleCountController from '../../controllers/inventory/cycleCount.controller.js';

const router = express.Router();

router.post('/', cycleCountController.create.bind(cycleCountController));
router.get('/', cycleCountController.getAll.bind(cycleCountController));
router.get('/:id', cycleCountController.getById.bind(cycleCountController));
router.put('/:id/items/:itemId', cycleCountController.updateItem.bind(cycleCountController));
router.post('/:id/finalize', cycleCountController.finalize.bind(cycleCountController));

export default router;
