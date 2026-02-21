import express from 'express';
import {
  createVariant,
  getVariantsByProductGroup,
  getVariantById,
  updateVariant,
  setVariantInactive,
} from '../../controllers/variant/variantController.js';
import {
  createVariant as createVariantLegacy,
  getVariants as getVariantsLegacy,
  updateVariant as updateVariantLegacy,
  deleteVariant as deleteVariantLegacy,
} from '../../controllers/variant/productVariantController.js';
import {
  generateCombinations,
  previewCombinationsEndpoint,
} from '../../controllers/variantCombination.controller.js';
import { upload } from '../../config/multer.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER-FACING (new enterprise schema)
// GET /api/variants/by-group/:productGroupId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/by-group/:productGroupId', getVariantsByProductGroup);

// ─────────────────────────────────────────────────────────────────────────────
// COMBINATION PREVIEW / GENERATOR (Admin utility)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/generate-combinations', generateCombinations);
router.post('/preview-combinations', previewCombinationsEndpoint);

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY ADMIN ROUTE — VariantBuilder in admin panel
// GET /api/variants/product/:productId
// Queries old Variant model (variantSchema.js) with `product` field
// ─────────────────────────────────────────────────────────────────────────────
router.get('/product/:productId', (req, res) => {
  req.query.productId = req.params.productId;
  return getVariantsLegacy(req, res);
});

// Read all variants (with optional ?productId query): GET /api/variants
router.get('/', getVariantsLegacy);

// Create (bulk + single): POST /api/variants
router.post('/', upload.array('images', 10), createVariantLegacy);

// Update: PUT /api/variants/:id
router.put('/:id', upload.array('images', 10), updateVariantLegacy);

// Delete: DELETE /api/variants/:id
router.delete('/:id', deleteVariantLegacy);

export default router;
