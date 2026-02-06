import AttributeType from '../models/AttributeType.model.js';
import AttributeValue from '../models/AttributeValue.model.js';
import UnifiedVariant from '../models/UnifiedVariant.model.js';
import mongoose from 'mongoose';

/**
 * Variant Generator Service
 * Handles the complex logic of generating variants from product features
 */

/**
 * Generate variants for a product
 * @param {string} productId - The product ID
 * @param {Array} selectedAttributes - Array of { attributeTypeId, attributeValueIds: [] }
 * @param {Object} baseProductData - { price, skuBase, stock, etc }
 */
export const generateVariants = async (productId, selectedAttributes, baseProductData) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Fetch all relevant Attribute Types to check 'showInVariants' and sorting
        const attributeTypeIds = selectedAttributes.map(a => a.attributeTypeId);
        const attributeTypes = await AttributeType.find({ _id: { $in: attributeTypeIds } });

        // Filter only variant-generating attributes
        const variantAttributes = attributeTypes
            .filter(at => at.showInVariants)
            .sort((a, b) => {
                // Sort by priority (high to low) then display order
                const pA = a.sortingConfig?.variantGenerationPriority || 0;
                const pB = b.sortingConfig?.variantGenerationPriority || 0;
                if (pA !== pB) return pB - pA;
                return (a.sortingConfig?.displayOrder || 0) - (b.sortingConfig?.displayOrder || 0);
            });

        // 2. Prepare values for variant generation
        // Structure: [ [Val1A, Val1B], [Val2A, Val2B] ] sorted by attribute priority
        const generationPool = [];
        const attributeValueMap = new Map(); // Cache for checking rules

        for (const attrType of variantAttributes) {
            const selection = selectedAttributes.find(s => s.attributeTypeId.toString() === attrType._id.toString());
            if (selection && selection.attributeValueIds.length > 0) {
                // Fetch values to check enabled/status and for cache
                const values = await AttributeValue.find({
                    _id: { $in: selection.attributeValueIds },
                    isDeleted: false,
                    status: 'active'
                });

                // Cache for rule checking
                values.forEach(v => attributeValueMap.set(v._id.toString(), v));

                // Add to pool
                generationPool.push(values);
            }
        }

        if (generationPool.length === 0) {
            throw new Error('No variant-generating attributes selected');
        }

        // 3. Generate Cartesian Product
        const cartesianProduct = (arrays) => {
            return arrays.reduce((acc, curr) => {
                return acc.flatMap(a => curr.map(b => [a, b].flat()));
            }, [[]]);
        };

        // Note: generationPool is Array of Arrays of AttributeValue Documents
        const combinations = cartesianProduct(generationPool);

        const validVariants = [];

        // 4. Validate Combinations & Build Data
        for (const combination of combinations) {
            // combination is Array of AttributeValue documents

            // Check Incompatibility Logic
            let isInvalid = false;
            for (let i = 0; i < combination.length; i++) {
                for (let j = i + 1; j < combination.length; j++) {
                    const valA = combination[i];
                    const valB = combination[j];

                    // Check if A is incompatible with B
                    if (valA.isIncompatibleWith && valA.isIncompatibleWith(valB)) {
                        isInvalid = true;
                        break;
                    }
                    // Check if B is incompatible with A
                    if (valB.isIncompatibleWith && valB.isIncompatibleWith(valA)) {
                        isInvalid = true;
                        break;
                    }
                }
                if (isInvalid) break;
            }

            if (isInvalid) continue;

            // Calculate Price & SKU
            let price = baseProductData.price || 0;
            let skuParts = [baseProductData.skuBase];
            let stock = baseProductData.stock || 0;

            const variantAttributes = [];

            let totalFixedModifier = 0;
            let totalPercentageModifier = 0;

            for (const attrVal of combination) {
                // Collect Modifiers for Price Calculation
                if (attrVal.pricingModifiers) {
                    const { modifierType, value } = attrVal.pricingModifiers;
                    if (modifierType === 'fixed') {
                        totalFixedModifier += value;
                    } else if (modifierType === 'percentage') {
                        totalPercentageModifier += value;
                    }
                }

                // SKU Construction (Use code suffix)
                if (attrVal.code) {
                    skuParts.push(attrVal.code.split('-').pop());
                }

                variantAttributes.push({
                    attributeType: attrVal.attributeType,
                    attributeValue: attrVal._id
                });
            }

            // Step 6: Apply Price Engine Logic
            // Order: Base -> Fixed -> Percentage
            // Formula: (Base + Sum(Fixed)) * (1 + Sum(Percentage)/100)
            price = (price + totalFixedModifier) * (1 + (totalPercentageModifier / 100));

            // Final SKU
            const sku = skuParts.join('-');

            validVariants.push({
                product: productId,
                attributes: variantAttributes,
                sku: sku,
                price: Math.round(price * 100) / 100, // Round 2 decimals
                stock: stock, // Default stock
                status: 'active',
                createdBy: baseProductData.userId
            });
        }

        // 5. Bulk Write to DB
        // First, verify unique SKUs
        const uniqueVariants = [];
        const skuSet = new Set();

        for (const v of validVariants) {
            if (skuSet.has(v.sku)) {
                v.sku = `${v.sku}-${Math.floor(Math.random() * 1000)}`;
            }
            skuSet.add(v.sku);
            uniqueVariants.push(v);
        }

        // Perform Insert
        const createdVariants = await UnifiedVariant.insertMany(uniqueVariants, { session });

        await session.commitTransaction();
        session.endSession();

        return {
            totalGenerated: createdVariants.length,
            variants: createdVariants
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
