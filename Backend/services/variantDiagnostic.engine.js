import crypto from 'crypto';
import ProductGroupMaster from '../models/masters/ProductGroupMaster.enterprise.js';
import VariantMaster from '../models/masters/VariantMaster.enterprise.js';

/**
 * Antigravity Deep Diagnostic Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Performs a full end-to-end structural inspection before variant generation.
 * Never fails silently. Returns a complete invariant report.
 */
export class VariantDiagnosticEngine {
    /**
     * @param {Object} incomingPayload
     * @returns {Promise<Object>}
     */
    static async runDiagnostic(incomingPayload) {
        try {
            // ====================================================
            // SECTION 0 — INPUT SNAPSHOT
            // ====================================================
            console.log("=== DIAGNOSTIC: INPUT SNAPSHOT ===");
            console.log(JSON.stringify(incomingPayload, null, 2));

            const { productGroupId, tenantId, baseDimensions, basePrice, brand } = incomingPayload;

            if (!productGroupId) {
                throw new Error("MISSING_PRODUCT_GROUP_ID");
            }
            if (!baseDimensions) {
                throw new Error("MISSING_BASE_DIMENSIONS");
            }

            // ====================================================
            // SECTION 1 — PRODUCT GROUP INSPECTION
            // ====================================================
            const productGroup = await ProductGroupMaster.findById(productGroupId).lean();

            if (!productGroup) {
                throw new Error("INVALID_PRODUCT_GROUP");
            }

            console.log("\n==============================");
            console.log("🔍 ANTIGRAVITY RUNTIME DEBUG");
            console.log("==============================\n");

            // 1️⃣ ProductGroup Snapshot
            console.log("📦 ProductGroup ID:", productGroupId);
            console.log("🏢 ProductGroup Tenant:", productGroup?.tenantId);

            console.log("\n📚 ProductGroup.attributeDimensions:");
            productGroup?.attributeDimensions?.forEach((dim, index) => {
                console.log(`  [${index}] key: ${dim.key}`);
                console.log(`       createsVariant: ${dim.createsVariant}`);
                console.log(`       valuesCount: ${dim.values?.length}`);
                console.log(`       isActive: ${dim.isActive}`);
            });

            // 2️⃣ Required Variant Dimensions
            const requiredDimensions = productGroup?.attributeDimensions?.filter(d => d.createsVariant === true);

            console.log("\n🎯 Required Dimensions:");
            requiredDimensions?.forEach((dim, index) => {
                console.log(`  [${index}] key: ${dim.key}`);
            });

            console.log("RequiredDimensionsCount:", requiredDimensions?.length);

            if (!requiredDimensions || requiredDimensions.length === 0) {
                throw new Error("NO_VARIANT_CREATING_DIMENSIONS");
            }

            // 3️⃣ Incoming Payload Snapshot
            console.log("\n📥 Incoming baseDimensions (RAW):");
            console.log(JSON.stringify(baseDimensions, null, 2));

            // 4️⃣ Dimension-by-Dimension Check
            requiredDimensions?.forEach((dim) => {
                const incoming = baseDimensions?.[dim.key];

                console.log(`\n🔎 Checking Dimension: ${dim.key}`);
                console.log("   Exists:", incoming !== undefined);
                console.log("   IsArray:", Array.isArray(incoming));
                console.log("   RawValue:", incoming);
                console.log("   Length:", incoming?.length);
            });

            // 5️⃣ Explicit Size Debug
            console.log("\n📏 SIZE DEBUG SECTION");

            const sizeDim = requiredDimensions?.find(d => d.key === "size");

            console.log("Size Dimension Present:", !!sizeDim);

            if (sizeDim) {
                const sizeInput = baseDimensions?.["size"];

                console.log("Incoming size raw:", sizeInput);
                console.log("Is Array:", Array.isArray(sizeInput));
                console.log("Size Length:", sizeInput?.length);
                console.log("Size Empty Check:",
                    !Array.isArray(sizeInput) || sizeInput.length === 0
                );
            }

            // 6️⃣ Attribute Value Collection
            let collectedIds = [];

            requiredDimensions?.forEach((dim) => {
                const values = baseDimensions?.[dim.key] || [];
                collectedIds.push(...values);
            });

            console.log("\n🧩 Collected attributeValueIds BEFORE dedupe:", collectedIds);

            const uniqueIds = [...new Set(collectedIds)];
            const sortedIds = uniqueIds.sort();

            console.log("Unique attributeValueIds:", uniqueIds);
            console.log("Sorted attributeValueIds:", sortedIds);

            const canonicalKey = sortedIds.join('|');

            console.log("\n🔐 Canonical Key:", canonicalKey);

            const configHash = crypto
                .createHash("sha256")
                .update(canonicalKey)
                .digest("hex");

            console.log("🔐 Config Hash:", configHash);

            console.log("\n==============================\n");

            // ====================================================
            // SECTION 2 — TENANT VALIDATION
            // ====================================================
            const requestTenantId = tenantId || 'GLOBAL';
            const pgTenantId = productGroup.tenantId || 'GLOBAL';
            if (requestTenantId !== pgTenantId) {
                throw new Error("TENANT_SCOPE_VIOLATION");
            }

            // ====================================================
            // SECTION 3 — DIMENSION INPUT VALIDATION
            // ====================================================
            const validatedAttributeValueIds = [];

            for (const dimension of requiredDimensions) {
                // Determine key safely (favor dimension.key, fallback to name/attributeName)
                const key = dimension.key || dimension.name?.toLowerCase() || dimension.attributeName?.toLowerCase();

                if (!baseDimensions[key]) {
                    throw new Error(`MISSING_REQUIRED_DIMENSION:${key}`);
                }

                if (!Array.isArray(baseDimensions[key]) || baseDimensions[key].length === 0) {
                    throw new Error(`EMPTY_REQUIRED_DIMENSION:${key}`);
                }

                const valueIds = baseDimensions[key];

                // Ensure schema values array exists
                const schemaValues = Array.isArray(dimension.values) ? dimension.values : [];

                for (const valueId of valueIds) {
                    const matchedValue = schemaValues.find(v => {
                        const vId = typeof v === 'object' ? (v.id || v._id)?.toString() : v?.toString();
                        return vId === valueId?.toString();
                    });

                    if (!matchedValue) {
                        throw new Error(`INVALID_VALUE_ID:${key}`);
                    }

                    if (typeof matchedValue === 'object') {
                        const valTenantId = matchedValue.tenantId || 'GLOBAL';
                        if (valTenantId !== pgTenantId) {
                            throw new Error(`VALUE_TENANT_MISMATCH:${key}`);
                        }

                        if (matchedValue.isActive === false) {
                            throw new Error(`INACTIVE_VALUE:${key}`);
                        }
                    }
                    validatedAttributeValueIds.push(valueId?.toString());
                }
            }

            // ====================================================
            // SECTION 4 — SIZE SYNCHRONIZATION CHECK
            // ====================================================
            const hasSizeDimension = requiredDimensions.some(d => {
                const k = d.key || d.name?.toLowerCase() || d.attributeName?.toLowerCase();
                return k === 'size';
            });

            if (hasSizeDimension) {
                if (!baseDimensions['size'] || !Array.isArray(baseDimensions['size']) || baseDimensions['size'].length === 0) {
                    throw new Error("MISSING_REQUIRED_SIZE_DIMENSION");
                }
            } else {
                if (baseDimensions['size'] && Array.isArray(baseDimensions['size']) && baseDimensions['size'].length > 0) {
                    throw new Error("UNEXPECTED_SIZE_ARRAY");
                }
            }

            // ====================================================
            // SECTION 5 — HASH CANONICALIZATION CHECK
            // ====================================================
            const uniqueValidatedIds = new Set(validatedAttributeValueIds);

            if (uniqueValidatedIds.size !== requiredDimensions.length) {
                throw new Error("DIMENSION_COUNT_MISMATCH");
            }

            const sortedIds = Array.from(uniqueValidatedIds).sort();
            const canonicalKey = sortedIds.join('|');
            const configHash = crypto.createHash('sha256').update(canonicalKey).digest('hex');

            console.log("=== DIAGNOSTIC: IDENTITY RESOLUTION ===");
            console.log("canonicalKey:", canonicalKey);
            console.log("configHash:", configHash);

            // ====================================================
            // SECTION 6 — CROSS VARIANT UNIQUENESS CHECK
            // ====================================================
            const existingVariant = await VariantMaster.findOne({
                productGroupId,
                configHash
            }).lean();

            if (existingVariant) {
                throw new Error("DUPLICATE_VARIANT_COMBINATION");
            }

            // ====================================================
            // SECTION 7 — DB UNIQUE INDEX CHECK
            // ====================================================
            let hasIndex = false;
            try {
                // Ensure indexes are built on memory connection before retrieving them
                await VariantMaster.syncIndexes();
                const indexes = await VariantMaster.collection.listIndexes().toArray();
                hasIndex = indexes.some(idx =>
                    idx.key &&
                    idx.key.productGroupId === 1 &&
                    idx.key.configHash === 1 &&
                    idx.unique === true
                );
            } catch (err) {
                console.warn("[VariantDiagnosticEngine] Index lookup exception:", err.message);
                // Fallback: Check schema indexes if DB call fails
                const schemaIndexes = VariantMaster.schema.indexes();
                hasIndex = schemaIndexes.some(idx => {
                    const fields = idx[0];
                    const options = idx[1];
                    return fields.productGroupId === 1 && fields.configHash === 1 && options.unique === true;
                });
            }

            if (!hasIndex) {
                throw new Error("MISSING_DB_UNIQUE_INDEX");
            }

            // ====================================================
            // SECTION 8 — FINAL STRUCTURAL REPORT
            // ====================================================
            return {
                success: true,
                structuralState: "READY_TO_GENERATE",
                invariantReport: {
                    requiredDimensionsCount: requiredDimensions.length,
                    mappedDimensionsCount: uniqueValidatedIds.size,
                    sizeDimensionPresent: hasSizeDimension,
                    canonicalKey,
                    configHash
                }
            };

        } catch (error) {
            // Never fail silently. Surface the explicit hard error.
            return {
                success: false,
                structuralState: error.message,
                invariantReport: null,
                stack: error.stack
            };
        }
    }
}
