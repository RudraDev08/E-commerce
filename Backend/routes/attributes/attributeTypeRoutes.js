import express from 'express';
import {
    createAttributeType,
    getAttributeTypes,
    getAttributeType,
    updateAttributeType,
    deleteAttributeType,
    getAttributeTypesByCategory
} from '../../controllers/attributeType.controller.js';

const router = express.Router();

// Routes
router.post('/', createAttributeType);
router.get('/', getAttributeTypes);
router.get('/category/:categoryId', getAttributeTypesByCategory);
router.get('/:id', getAttributeType);
router.put('/:id', updateAttributeType);
router.delete('/:id', deleteAttributeType);

export default router;
