import express from 'express';
import {
    createSize,
    getSizes,
    getSize,
    updateSize,
    deleteSize,
    toggleStatus,
    bulkCreateSizes,
    restoreSize
} from '../../controllers/size.controller.js';

const router = express.Router();

// Create routes
router.post('/', createSize);
router.post('/bulk', bulkCreateSizes);

// Read routes
router.get('/', getSizes);
router.get('/:id', getSize);

// Update routes
router.put('/:id', updateSize);
router.patch('/:id/toggle-status', toggleStatus);
router.patch('/:id/restore', restoreSize);

// Delete routes
router.delete('/:id', deleteSize);

export default router;
