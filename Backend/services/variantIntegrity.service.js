import mongoose from 'mongoose';
import VariantMaster from '../models/masters/VariantMaster.enterprise.js';
import ProductGroupMaster from '../models/masters/ProductGroupMaster.enterprise.js';
import CategoryAttribute from '../models/CategoryAttribute.model.js';
import AttributeType from '../models/AttributeType.model.js';
import inventoryService from './inventory.service.js';

/**
 * Antigravity Structural Integrity Enforcement Agent
 * ─────────────────────────────────────────────────────────────────────────────
 * Detects, diagnoses, and deterministically repairs broken product variants.
 */
export class VariantIntegrityService {
    /**
     * @param {Object} variant - The variant document
     * @returns {Promise<Object>}
     */
    static async validateAndRepairVariant(variant) {
        // Output format explicitly specified
        const result = {
            success: false,
            structuralState: 'VALID',
            issuesFound: [],
            fixesApplied: [],
            invariantReport: {
                requiredDimensionsCount: 0,
                mappedDimensionsCount: 0,
                sizeRequired: false,
                sizeResolved: false,
            },
            finalVariant: null
        };

        try {
            // Ensure variant is a plain object for manipulation and rollback
            let v = variant.toObject ? variant.toObject() : { ...variant };
            const originalVStr = JSON.stringify(v); // Copy for post-repair rollback if needed

            // Invariant 1: productGroupId exists
            if (!v.productGroupId) {
                result.structuralState = 'CORRUPT_DATA';
                result.issuesFound.push('Missing productGroupId');
                result.finalVariant = v;
                return result;
            }

            // ── STEP 1: Fetch ProductGroup ──────────────────────────────────
            const productGroup = await ProductGroupMaster.findById(v.productGroupId).lean();

            if (!productGroup) {
                result.structuralState = 'INVALID_PRODUCT_GROUP';
                result.issuesFound.push('ProductGroup does not exist');
                result.finalVariant = v; // Do not modify
                return result;
            }

            // Invariant 2: ProductGroup.attributeDimensions exists
            if (!productGroup.attributeDimensions || !Array.isArray(productGroup.attributeDimensions)) {
                result.structuralState = 'INVALID_PRODUCT_GROUP';
                result.issuesFound.push('ProductGroup missing attributeDimensions');
                result.finalVariant = v;
                return result;
            }

            // ── STEP 2: Extract Required Variant Dimensions ─────────────────
            const requiredDimensions = productGroup.attributeDimensions.filter(d => d.createsVariant === true);
            result.invariantReport.requiredDimensionsCount = requiredDimensions.length;

            if (requiredDimensions.length === 0) {
                result.structuralState = 'CRITICAL';
                result.issuesFound.push('ProductGroup has no variant-generating dimensions.');
                result.finalVariant = v; // Do NOT modify variant
                return result;
            }

            // ── STEP 3: Validate Variant Structure ──────────────────────────
            let isMissingAttrDims = !v.attributeDimensions || v.attributeDimensions.length === 0;
            let isMissingAttrValueIds = !v.attributeValueIds || v.attributeValueIds.length === 0;
            let hasLegacyColorId = !!v.colorId;

            if (isMissingAttrDims) {
                result.issuesFound.push('Missing attributeDimensions');
            }

            if (isMissingAttrValueIds) {
                result.issuesFound.push('Missing attributeValueIds');
            }

            // Detect orphaned attributeValueIds
            if (!isMissingAttrValueIds && v.attributeDimensions && v.attributeDimensions.length > 0) {
                const validDimValues = v.attributeDimensions.map(d => d.valueId?.toString()).filter(Boolean);
                const hasOrphans = v.attributeValueIds.some(id => !validDimValues.includes(id?.toString()));
                if (hasOrphans) {
                    result.issuesFound.push('Orphaned attributeValueIds');
                }
            }

            // Check Size requirements
            const sizeDimSchema = requiredDimensions.find(d =>
                d.name?.toLowerCase() === 'size' ||
                d.attributeName?.toLowerCase() === 'size'
            );

            if (sizeDimSchema) {
                result.invariantReport.sizeRequired = true;
                if (!v.sizes || v.sizes.length === 0) {
                    result.issuesFound.push('Missing sizes when Size dimension required');
                } else {
                    result.invariantReport.sizeResolved = true;
                }
            }

            // Detect standalone colorId skipping dimension structure
            if (hasLegacyColorId) {
                const colorDimInVariant = v.attributeDimensions?.find(d =>
                    d.attributeName?.toLowerCase() === 'color' ||
                    d.attributeId?.toString() === v.colorId?.toString()
                );

                if (!colorDimInVariant || colorDimInVariant.valueId?.toString() !== v.colorId?.toString()) {
                    result.issuesFound.push('Legacy colorId without structured mapping');
                }
            }

            // ── STEP 4: Repair Strategy ─────────────────────────────────────
            if (isMissingAttrDims) {
                // Rebuild from schema
                v.attributeDimensions = requiredDimensions.map(rd => ({
                    attributeId: rd.attributeId || rd._id,
                    attributeName: rd.name || rd.attributeName,
                    valueId: null
                }));
                result.fixesApplied.push('Rebuilt attributeDimensions from requiredDimensions schema');
            }

            if (isMissingAttrValueIds || hasLegacyColorId) {
                const legacyValues = [];
                if (v.colorId) legacyValues.push(v.colorId.toString());
                const fallbackSizeId = v.sizeId || (v.sizes && v.sizes[0]?.sizeId?.toString());
                if (fallbackSizeId) legacyValues.push(fallbackSizeId.toString());

                if (legacyValues.length > 0 && isMissingAttrValueIds) {
                    v.attributeValueIds = legacyValues;
                    result.fixesApplied.push('Mapped legacy fields into attributeValueIds');
                } else if (isMissingAttrValueIds) {
                    // Select deterministic default: first value from each required dimension
                    v.attributeValueIds = requiredDimensions.map(rd => {
                        const firstVal = Array.isArray(rd.values) && rd.values.length > 0 ? rd.values[0] : null;
                        return typeof firstVal === 'object' && firstVal !== null ? (firstVal.id || firstVal._id) : firstVal;
                    }).filter(Boolean);

                    if (v.attributeValueIds.length > 0) {
                        result.fixesApplied.push('Applied deterministic defaults to missing attributeValueIds');
                    }
                }
            }

            if (result.invariantReport.sizeRequired && (!v.sizes || v.sizes.length === 0)) {
                let resolvedSizeId = null;
                const schemaValues = Array.isArray(sizeDimSchema.values)
                    ? sizeDimSchema.values.map(val => typeof val === 'object' ? (val.id || val._id)?.toString() : val?.toString())
                    : [];

                if (schemaValues.length > 0 && v.attributeValueIds) {
                    resolvedSizeId = v.attributeValueIds.find(id => schemaValues.includes(id?.toString()));
                }

                if (!resolvedSizeId && (v.sizeId || v._doc?.sizeId)) {
                    resolvedSizeId = v.sizeId || v._doc?.sizeId;
                }

                if (resolvedSizeId) {
                    v.sizes = [{ sizeId: resolvedSizeId, category: 'DIMENSION' }];
                    result.invariantReport.sizeResolved = true;
                    result.fixesApplied.push('Populated sizes from resolved size attribute value');
                }
            }

            if (hasLegacyColorId) {
                // Convert into Color dimension value
                const colorDimSchema = requiredDimensions.find(d =>
                    d.name?.toLowerCase() === 'color' || d.attributeName?.toLowerCase() === 'color'
                );

                if (colorDimSchema && v.attributeDimensions) {
                    const mappedColorDim = v.attributeDimensions.find(d =>
                        d.attributeId?.toString() === colorDimSchema.attributeId?.toString() ||
                        d.attributeName?.toLowerCase() === 'color'
                    );

                    if (mappedColorDim) {
                        mappedColorDim.valueId = v.colorId;
                    } else {
                        v.attributeDimensions.push({
                            attributeId: colorDimSchema.attributeId || colorDimSchema._id,
                            attributeName: colorDimSchema.name || colorDimSchema.attributeName || 'Color',
                            valueId: v.colorId
                        });
                    }
                }

                delete v.colorId;
                result.fixesApplied.push('Converted standalone colorId to Color dimension value');
            }

            // Rule Sync: Ensure attributeValueIds contains all valueIds from attributeDimensions
            if (v.attributeDimensions?.length > 0) {
                const validDimValues = v.attributeDimensions.map(d => d.valueId?.toString()).filter(Boolean);
                const currentIds = (v.attributeValueIds || []).map(id => id.toString());

                const missingInIds = validDimValues.filter(id => !currentIds.includes(id));
                if (missingInIds.length > 0) {
                    v.attributeValueIds = [...new Set([...currentIds, ...validDimValues])];
                    result.fixesApplied.push('Synchronized attributeValueIds with dimensions');
                }
            }

            // Re-initialize inventory if doing a full repair
            if (result.fixesApplied.length > 0) {
                try {
                    await inventoryService.initializeInventory(v._id);
                } catch (invErr) {
                    result.issuesFound.push('Inventory sync failed: ' + invErr.message);
                }
            }

            // ── STEP 5: Post-Repair Validation ──────────────────────────────
            result.invariantReport.mappedDimensionsCount = v.attributeDimensions?.filter(d => !!d.valueId).length || 0;

            const hasValidDims = v.attributeDimensions && v.attributeDimensions.length === requiredDimensions.length;
            const dimsArePopulated = v.attributeDimensions && v.attributeDimensions.every(d => d.valueId);
            const valuesMatchDims = v.attributeValueIds && v.attributeValueIds.length === v.attributeDimensions?.length;
            const sizeSatisfied = !result.invariantReport.sizeRequired || result.invariantReport.sizeResolved;
            const noStandaloneColor = v.colorId === undefined;
            const notEmptyValues = v.attributeValueIds?.length > 0;

            const isFullyValid = hasValidDims && dimsArePopulated && valuesMatchDims && sizeSatisfied && noStandaloneColor && notEmptyValues;

            if (!isFullyValid) {
                // Roll back changes
                const rollbackV = JSON.parse(originalVStr);
                result.success = false;
                result.structuralState = 'CORRUPT_DATA';
                result.fixesApplied = []; // Roll back fixes
                result.finalVariant = rollbackV;
                result.issuesFound.push('Post-repair validation failed. Rolled back.');
                return result;
            }

            // ── STEP 6: Lifecycle Promotion ─────────────────────────────────
            v.status = 'ACTIVE';
            v.governance = v.governance || {};
            v.governance.identityVersion = (v.governance.identityVersion || 0) + 1;
            v.updatedAt = new Date();

            result.success = true;
            result.structuralState = result.issuesFound.length > 0 ? 'REPAIRED' : 'VALID';
            result.finalVariant = v;

            // Optional persistence
            if (result.fixesApplied.length > 0) {
                const unsetOps = {};
                // Force unset standalone colorId if it existed originally
                if (originalVStr.includes('colorId') && !v.colorId) {
                    unsetOps.colorId = "";
                }

                const updatePayload = { $set: v };
                if (Object.keys(unsetOps).length > 0) updatePayload.$unset = unsetOps;

                await VariantMaster.findByIdAndUpdate(v._id, updatePayload, { runValidators: false });
            }

            return result;

        } catch (error) {
            result.success = false;
            result.structuralState = 'CORRUPT_DATA';
            result.issuesFound.push(`Exception during enforcement: ${error.message}`);
            result.finalVariant = variant;
            return result;
        }
    }
}
