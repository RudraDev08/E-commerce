import api from './axios.config';

/**
 * Variant API Service — Enterprise Edition
 * All calls target the backend VariantMaster (enterprise model).
 * productId is always normalized and validated before any network call.
 */

const OBJECTID_REGEX = /^[a-f\d]{24}$/i;

// ── Get all variants (admin, no productId filter) ──────────────────────────
export const getVariants = async (params = {}) => {
    return await api.get('/variants', { params });
};

// ── Get variants by product ID (customer PDP) ──────────────────────────────
// Uses /variants/product/:id which maps to getVariantsByProductGroup with
// ?raw=true suppressed — returns fully-populated enterprise documents.
export const getVariantsByProduct = async (productId) => {
    if (!productId) {
        throw new Error('getVariantsByProduct: productId is required');
    }

    const normalizedId =
        typeof productId === 'object'
            ? String(productId._id ?? productId)
            : String(productId);

    if (!OBJECTID_REGEX.test(normalizedId)) {
        throw new Error(`getVariantsByProduct: invalid ObjectId "${normalizedId}"`);
    }

    // /variants/product/:productGroupId → getVariantsByProductGroup (enterprise)
    return await api.get(`/variants/product/${normalizedId}`);
};

// ── Get single variant by ID ───────────────────────────────────────────────
export const getVariantById = async (id) => {
    return await api.get(`/variants/${id}`);
};

// ── Validate variant before add-to-cart (Phase 6 freshness check) ──────────
export const validateVariantForCart = async ({ variantId, quantity, clientPrice }) => {
    return await api.post('/variants/validate', { variantId, quantity, clientPrice });
};

// ── Get sizes (active, non-deleted) ───────────────────────────────────────
export const getSizes = async () => {
    return await api.get('/sizes', {
        params: { status: 'active', isDeleted: false }
    });
};

// ── Get colors (active, non-deleted) ──────────────────────────────────────
export const getColors = async () => {
    return await api.get('/colors', {
        params: { status: 'active', isDeleted: false }
    });
};

export default {
    getVariants,
    getVariantsByProduct,
    getVariantById,
    validateVariantForCart,
    getSizes,
    getColors
};

