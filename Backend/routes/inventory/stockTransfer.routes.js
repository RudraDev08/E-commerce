
import express from 'express';
import stockTransferController from '../../controllers/inventory/stockTransfer.controller.js';

const router = express.Router();

router.post('/', stockTransferController.create.bind(stockTransferController));
router.get('/', stockTransferController.getAll.bind(stockTransferController));
router.get('/:id', stockTransferController.getById.bind(stockTransferController));
router.post('/:id/complete', stockTransferController.complete.bind(stockTransferController));
router.post('/:id/cancel', stockTransferController.cancel.bind(stockTransferController));

export default router;
