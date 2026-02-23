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
import { validateCategoryScope } from '../../middlewares/categoryScope.middleware.js';
import {
  previewDimensions,
  generateDimensions,
  diffDimensionsHandler,
} from '../../controllers/variant/variantDimension.controller.js';

const router = express.Router();


// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER-FACING (new enterprise schema)
// GET /api/variants/by-group/:productGroupId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/by-group/:productGroupId', getVariantsByProductGroup);

// ─────────────────────────────────────────────────────────────────────────────
// ENTERPRISE VARIANT CREATION (new VariantMaster schema)
// POST /api/variants/enterprise
// validateCategoryScope → Layer 1 HTTP guard (fast fail)
// VariantMaster.pre('save') → Layer 2 Mongoose model guard (catch-all)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/enterprise', validateCategoryScope, createVariant);

// ─────────────────────────────────────────────────────────────────────────────
// V2 — N-DIMENSIONAL ENGINE  (COLOR × SIZE × RAM × STORAGE × ...N)
// POST /api/variants/v2/preview-dimensions
// POST /api/variants/v2/generate-dimensions
// POST /api/variants/v2/diff-dimensions
// ─────────────────────────────────────────────────────────────────────────────
router.post('/v2/preview-dimensions', previewDimensions);
router.post('/v2/generate-dimensions', validateCategoryScope, generateDimensions);
router.post('/v2/diff-dimensions', diffDimensionsHandler);  // pure in-process, no auth needed

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY COMBINATION GENERATOR (still supported — do not remove)
// POST /api/variants/generate-combinations  (COLOR × STORAGE × RAM only)
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
