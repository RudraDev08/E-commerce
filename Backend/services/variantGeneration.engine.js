import ProductGroupMaster from '../models/masters/ProductGroupMaster.enterprise.js';
import VariantMaster from '../models/masters/VariantMaster.enterprise.js';

/**
 * Antigravity Variant Generation Guard Layer
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates structurally valid product variants using ProductGroup as 
 * the single source of truth and enforces strict tenant and size synchronization rules.
 */
export class VariantGenerationEngine {
    /**
     * @param {Object} input
     * @param {string} input.productGroupId
     * @param {string} input.brand
     * @param {number} input.basePrice
     * @param {string} input.tenantId
     * @param {Object} input.baseDimensions - { [dimensionKey]: string[] }
     * @returns {Promise<Object>}
     */
    static async generateVariantFromProductGroup({ productGroupId, brand, basePrice, tenantId, baseDimensions }) {
        let requiredDimensionsCount = 0;
        let mappedDimensionsCount = 0;
        let sizeResolved = false;

        try {
            // STEP 1 — Fetch ProductGroup
            if (!productGroupId) {
                throw new Error('INVALID_PRODUCT_GROUP');
            }

            const productGroup = await ProductGroupMaster.findById(productGroupId).lean();
            if (!productGroup || !productGroup.attributeDimensions) {
                throw new Error('INVALID_PRODUCT_GROUP');
            }

            // Tenant Scope Guard
            const requestTenantId = tenantId || 'GLOBAL';
            const pgTenantId = productGroup.tenantId || 'GLOBAL';
            if (pgTenantId !== requestTenantId) {
                throw new Error('TENANT_SCOPE_VIOLATION');
            }

            // STEP 2 — Determine Required Dimensions
            const requiredDimensions = productGroup.attributeDimensions.filter(d => d.createsVariant === true);
            requiredDimensionsCount = requiredDimensions.length;

            if (requiredDimensions.length === 0) {
                throw new Error('INVALID_PRODUCT_GROUP');
            }

            // STEP 3 — Validate baseDimensions (Tenant + Value Guard + Size)
            const attributeDimensions = [];
            let attributeValueIds = [];
            let sizes = [];

            let hasSizeDimension = false;

            for (const dimension of requiredDimensions) {
                const key = dimension.key || dimension.name?.toLowerCase() || dimension.attributeName?.toLowerCase();
                const isSizeDim = key === 'size';
                if (isSizeDim) hasSizeDimension = true;

                const valueIds = baseDimensions?.[key];

                if (!valueIds || !Array.isArray(valueIds) || valueIds.length === 0) {
                    if (isSizeDim) {
                        throw new Error('MISSING_REQUIRED_SIZE_DIMENSION');
                    }
                    throw new Error(`MISSING_REQUIRED_DIMENSION: ${key}`);
                }

                const valueId = valueIds[0]?.toString();

                // Validate that each valueId exists in dimension.values and tenant is correct
                const schemaValues = Array.isArray(dimension.values) ? dimension.values : [];

                const matchedValue = schemaValues.find(v => {
                    const vId = typeof v === 'object' ? (v.id || v._id)?.toString() : v?.toString();
                    return vId === valueId;
                });

                if (!matchedValue) {
                    throw new Error(`INVALID_VALUE_SCOPE: ${key}`);
                }

                // Check tenant and active status if the value is an object
                if (typeof matchedValue === 'object') {
                    const valTenantId = matchedValue.tenantId || 'GLOBAL';
                    if (valTenantId !== pgTenantId) {
                        throw new Error(`INVALID_VALUE_SCOPE: ${key}`);
                    }
                    if (matchedValue.isActive === false) {
                        throw new Error(`INVALID_VALUE_SCOPE: ${key}`);
                    }
                }

                attributeDimensions.push({
                    dimensionId: dimension._id || dimension.attributeId || dimension.dimensionId,
                    key,
                    name: dimension.name || dimension.attributeName
                });

                attributeValueIds.push(valueId);

                if (isSizeDim) {
                    const label = typeof matchedValue === 'object' ? (matchedValue.label || matchedValue.name || matchedValue.value || valueId) : valueId;
                    sizes.push({
                        sizeId: valueId,
                        label
                    });
                    sizeResolved = true;
                }
            }

            // Strict Size Synchronization Guarantee
            if (hasSizeDimension) {
                const numSizeValuesInAttr = attributeValueIds.filter(v => sizes.some(s => s.sizeId === v)).length;
                if (sizes.length !== numSizeValuesInAttr) {
                    throw new Error('SIZE_SYNC_VIOLATION');
                }
            } else {
                if (baseDimensions['size'] && baseDimensions['size'].length > 0) {
                    throw new Error('UNEXPECTED_SIZE_ARRAY');
                }
                sizes = [];
            }

            mappedDimensionsCount = attributeDimensions.length;

            // Final Validation Before Save
            if (mappedDimensionsCount !== requiredDimensionsCount) {
                throw new Error('INVALID_DIMENSION_INPUT');
            }
            if (attributeValueIds.length !== new Set(attributeValueIds).size) {
                throw new Error('INVALID_DIMENSION_INPUT'); // Duplicate or empty
            }

            // STEP 5 — Build Variant Object
            const variant = new VariantMaster({
                productGroupId,
                brand,
                price: basePrice,
                attributeDimensions,
                attributeValueIds,
                sizes,
                status: 'DRAFT',
                governance: {
                    identityVersion: 1
                },
                tenantId: pgTenantId
            });

            // STEP 6 — Persist
            await variant.save();

            return {
                success: true,
                structuralState: 'GENERATED',
                requiredDimensionsCount,
                mappedDimensionsCount,
                sizeResolved,
                variant: variant.toObject()
            };

        } catch (error) {
            let structuralState = 'INVALID_DIMENSION_INPUT';

            const msg = error.message;
            if (msg === 'INVALID_PRODUCT_GROUP') {
                structuralState = 'INVALID_PRODUCT_GROUP';
            } else if (msg === 'TENANT_SCOPE_VIOLATION') {
                structuralState = 'TENANT_SCOPE_VIOLATION';
            } else if (msg === 'SIZE_SYNC_VIOLATION') {
                structuralState = 'SIZE_SYNC_VIOLATION';
            }

            return {
                success: false,
                structuralState,
                requiredDimensionsCount,
                mappedDimensionsCount,
                sizeResolved,
                variant: null
            };
        }
    }
}
