// ========================================================================
// ATTRIBUTE KEY CONSTANTS (LOCKED - DO NOT MODIFY)
// These are the ONLY allowed attribute keys for variants
// ========================================================================

/**
 * Allowed variant attribute keys
 * These keys are used consistently across:
 * - Variant Master (backend)
 * - Product Detail Page (frontend)
 * - Cart Context (frontend)
 * - Checkout (frontend)
 */
export const VARIANT_ATTRIBUTE_KEYS = {
    COLOR_ID: 'colorId',    // ✅ REQUIRED: Reference to Color Master _id
    STORAGE: 'storage',     // Optional: e.g., "128GB", "256GB", "512GB"
    RAM: 'ram',             // Optional: e.g., "8GB", "12GB", "16GB"
    SIZE: 'size'            // Optional: e.g., "S", "M", "L", "XL"
};

/**
 * Validate variant attributes structure
 * @param {Object} attributes - Variant attributes object
 * @returns {boolean} - True if valid
 */
export const validateVariantAttributes = (attributes) => {
    if (!attributes || typeof attributes !== 'object') {
        return false;
    }

    // Check all keys are allowed
    const allowedKeys = Object.values(VARIANT_ATTRIBUTE_KEYS);
    const attributeKeys = Object.keys(attributes);

    const hasInvalidKeys = attributeKeys.some(key => !allowedKeys.includes(key));
    if (hasInvalidKeys) {
        console.error('Invalid attribute keys found:', attributeKeys);
        return false;
    }

    return true;
};

/**
 * Get display name for attribute key
 * @param {string} key - Attribute key
 * @returns {string} - Display name
 */
export const getAttributeDisplayName = (key) => {
    const displayNames = {
        [VARIANT_ATTRIBUTE_KEYS.COLOR_ID]: 'Color',
        [VARIANT_ATTRIBUTE_KEYS.STORAGE]: 'Storage',
        [VARIANT_ATTRIBUTE_KEYS.RAM]: 'RAM',
        [VARIANT_ATTRIBUTE_KEYS.SIZE]: 'Size'
    };

    return displayNames[key] || key;
};

/**
 * Check if attribute key is colorId
 * @param {string} key - Attribute key
 * @returns {boolean}
 */
export const isColorAttribute = (key) => {
    return key === VARIANT_ATTRIBUTE_KEYS.COLOR_ID;
};

// ========================================================================
// HARD RULES (NON-NEGOTIABLE)
// ========================================================================

/**
 * RULE 1: Never use 'color' as attribute key
 * ✅ CORRECT: attributes.colorId = "color_id_123"
 * ❌ WRONG:   attributes.color = "Phantom Black"
 */

/**
 * RULE 2: Always resolve color via Color Master
 * ✅ CORRECT: colorMaster.find(c => c._id === attributes.colorId)
 * ❌ WRONG:   colorMaster.find(c => c.name === attributes.color)
 */

/**
 * RULE 3: Attribute keys are case-sensitive
 * ✅ CORRECT: attributes.colorId
 * ❌ WRONG:   attributes.ColorId or attributes.colorid
 */

/**
 * RULE 4: All variant matching must use these exact keys
 * ✅ CORRECT: v.attributes.colorId === selectedAttributes.colorId
 * ❌ WRONG:   v.attributes.color === selectedAttributes.color
 */

/**
 * RULE 5: Cart must store attributes as-is (snapshot)
 * ✅ CORRECT: cartItem.attributes = variant.attributes
 * ❌ WRONG:   cartItem.color = variant.attributes.colorId
 */

export default VARIANT_ATTRIBUTE_KEYS;
