import express from 'express';
import {
    createAttributeValue,
    getAttributeValues,
    getAttributeValuesByType,
    getAttributeValue,
    updateAttributeValue,
    deleteAttributeValue,
    bulkCreateAttributeValues,
    reorderAttributeValues
} from '../../controllers/attributeValue.controller.js';

const router = express.Router();

// Specific routes first
router.get('/type/:attributeTypeId', getAttributeValuesByType);
router.post('/bulk', bulkCreateAttributeValues);
router.put('/reorder', reorderAttributeValues);

// General routes
router.post('/', createAttributeValue);
router.get('/', getAttributeValues);
router.get('/:id', getAttributeValue);
router.put('/:id', updateAttributeValue);
router.delete('/:id', deleteAttributeValue);

export default router;
