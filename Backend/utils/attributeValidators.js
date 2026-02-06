/**
 * Validates Attribute Value data based on the Attribute Type category
 * @param {Object} attributeType - The full attribute type object
 * @param {Object} data - The attribute value input data
 * @returns {Object} result - { isValid: boolean, error: string|null }
 */
export const validateCategoryRequirements = (attributeType, data) => {
    const category = attributeType.category;

    // Define required fields per category
    // This ensures data integrity as per Step 4
    const categoryRules = {
        visual: {
            requiredSection: 'visualData',
            requiredFields: [['hexCode', 'patternImage', 'primaryImage', 'swatchValue']], // At least one of these
            params: ['colorCode', 'swatches', 'images']
        },
        technical: {
            requiredSection: 'technicalData',
            requiredFields: [['numericValue', 'specifications', 'processor', 'ram', 'storage']], // At least one
            params: ['numericValue', 'unit', 'specs']
        },
        physical: {
            requiredSection: 'measurements',
            requiredFields: [['chest', 'waist', 'length', 'height', 'width', 'sizeGroup', 'weight']], // At least one (simplified check)
            params: ['measurements', 'conversions']
        },
        material: {
            requiredSection: 'materialData',
            requiredFields: [['composition', 'primaryMaterial']],
            params: ['composition', 'properties', 'care']
        },
        style: {
            requiredSection: 'styleData',
            requiredFields: [['fitType', 'occasions', 'seasons', 'styleCategory']],
            params: ['fit', 'occasion', 'season']
        }
    };

    const rule = categoryRules[category];

    // If no specific rule (e.g., 'specification' category), we allow generic usage
    if (!rule) return { isValid: true };

    const sectionData = data[rule.requiredSection];

    // Check if the section exists
    if (!sectionData || Object.keys(sectionData).length === 0) {
        return {
            isValid: false,
            error: `Category '${category}' requires '${rule.requiredSection}' to be populated with ${rule.params.join(', ')}.`
        };
    }

    // Check valid fields inside the section
    // Logic: At least one of the major fields for that category must be present
    // For arrays like requiredFields: [['a', 'b']], it means (a OR b) must exist
    const hasValidFields = rule.requiredFields.every(fieldGroup => {
        return fieldGroup.some(field => {
            const value = sectionData[field];
            return value !== undefined && value !== null && value !== '';
        });
    });

    if (!hasValidFields) {
        return {
            isValid: false,
            error: `Category '${category}' data in '${rule.requiredSection}' is missing required fields. Needs at least one of: ${rule.requiredFields.flat().join(', ')}`
        };
    }

    return { isValid: true };
};
