import express from 'express';
import {
  createVariant,
  getVariantsByProductGroup,
  getVariantById,
  updateVariant,
  setVariantInactive,
  cloneVariant,
  getProductGroupSnapshot,
  getMatrixPreview,
  repairVariant,
  repairProductGroupVariants,
} from '../../controllers/variant/variantController.js';
import {
  createVariant as createVariantLegacy,
  getVariants as getVariantsLegacy,
  updateVariant as updateVariantLegacy,
  deleteVariant as deleteVariantLegacy,
} from '../../controllers/variant/productVariantController.js';

import { upload } from '../../config/multer.js';
import { validateCategoryScope } from '../../middlewares/categoryScope.middleware.js';
import {
  previewDimensions,
  generateDimensions,
  diffDimensionsHandler,
  getGenerationJobStatus
} from '../../controllers/variant/variantDimension.controller.js';

const router = express.Router();


// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER-FACING (new enterprise schema)
// GET /api/variants/by-group/:productGroupId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/by-group/:productGroupId', getVariantsByProductGroup);

// ✅ Step 3 — PDP Uses Snapshot Only
// GET /api/variants/group/:id/snapshot
router.get('/group/:id/snapshot', getProductGroupSnapshot);

// ✅ 6.3 Matrix Visualization
// GET /api/variants/group/:id/matrix
router.get('/group/:id/matrix', getMatrixPreview);

// ─────────────────────────────────────────────────────────────────────────────
// ENTERPRISE VARIANT CREATION (new VariantMaster schema)
// POST /api/variants/enterprise
// validateCategoryScope → Layer 1 HTTP guard (fast fail)
// VariantMaster.pre('save') → Layer 2 Mongoose model guard (catch-all)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/enterprise', validateCategoryScope, createVariant);
router.post('/enterprise/:id/clone', validateCategoryScope, cloneVariant);

// ─────────────────────────────────────────────────────────────────────────────
// V2 — N-DIMENSIONAL ENGINE  (COLOR × SIZE × RAM × STORAGE × ...N)
// POST /api/variants/v2/preview-dimensions
// POST /api/variants/v2/generate-dimensions
// POST /api/variants/v2/diff-dimensions
// ─────────────────────────────────────────────────────────────────────────────
router.post('/v2/preview-dimensions', previewDimensions);
router.post('/preview', previewDimensions); // Phase 2.2 Alias
router.post('/v2/generate-dimensions', validateCategoryScope, generateDimensions);
router.get('/v2/jobs/:id', getGenerationJobStatus);
router.post('/v2/diff-dimensions', diffDimensionsHandler);  // pure in-process, no auth needed

// ✅ 10. Integrity Repair Path
router.post('/:id/repair', repairVariant);
router.post('/group/:id/repair', repairProductGroupVariants);


// ─────────────────────────────────────────────────────────────────────────────
// LEGACY ADMIN ROUTE — VariantBuilder in admin panel
// GET /api/variants/product/:productId
// Queries old Variant model (variantSchema.js) with `product` field
// ─────────────────────────────────────────────────────────────────────────────
router.get('/product/:productGroupId', getVariantsByProductGroup);

// Read all variants (with optional ?productId query): GET /api/variants
router.get('/', getVariantsLegacy);

// Create (bulk + single): POST /api/variants
router.post('/', upload.array('images', 10), createVariantLegacy);

// Update: PUT /api/variants/:id
router.put('/:id', updateVariant);

// Delete: DELETE /api/variants/:id
router.delete('/:id', deleteVariantLegacy);

export default router;
