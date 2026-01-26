import express from 'express';
import {
    createColor,
    getColors,
    getColor,
    updateColor,
    deleteColor,
    toggleStatus,
    bulkCreateColors,
    restoreColor
} from '../../controllers/color.controller.js';

const router = express.Router();

// Create routes
router.post('/', createColor);
router.post('/bulk', bulkCreateColors);

// Read routes
router.get('/', getColors);
router.get('/:id', getColor);

// Update routes
router.put('/:id', updateColor);
router.patch('/:id/toggle-status', toggleStatus);
router.patch('/:id/restore', restoreColor);

// Delete routes
router.delete('/:id', deleteColor);

export default router;
