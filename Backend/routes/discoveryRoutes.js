import express from 'express';
import { getExploreFilters, searchProducts } from '../controllers/discovery.controller.js';

const router = express.Router();

// Get dynamic filters based on context (category, etc)
router.post('/filters', getExploreFilters);

// Smart search "red cotton xl"
router.get('/search', searchProducts);

export default router;
