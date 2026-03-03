import express from 'express';
import {
    getExploreFilters,
    searchProducts,
    browseCategory,
    getSimilarProducts,
} from '../controllers/discovery.controller.js';

const router = express.Router();

// Dynamic facet filters for a category/attribute set
router.post('/filters', getExploreFilters);

// Smart search: /discovery/search?q=red+cotton+xl&category=shirts
router.get('/search', searchProducts);

// Category browse: /discovery/browse/:categorySlug
router.get('/browse/:categorySlug', browseCategory);

// Similar products: /discovery/similar/:variantId
router.get('/similar/:variantId', getSimilarProducts);

export default router;
