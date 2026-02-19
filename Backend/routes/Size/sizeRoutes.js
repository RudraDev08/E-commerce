import express from 'express';
import {
    createSize,
    getSizes,
    getSize,
    updateSize,
    deleteSize,
    toggleLock,
    toggleStatus,

    bulkCreateSizes
} from '../../controllers/sizeMaster.controller.js';

const router = express.Router();

// Bulk operations (must come before /:id routes)
router.post('/bulk', bulkCreateSizes);

// CRUD routes
router.post('/', createSize);
router.get('/', getSizes);
router.get('/:id', getSize);
router.put('/:id', updateSize);
router.delete('/:id', deleteSize);

// Governance routes
router.patch('/:id/lock', toggleLock);
router.patch('/:id/toggle-status', toggleStatus);


export default router;

