import { generateVariantCombinations, previewCombinations } from '../services/variantCombinationGenerator.service.js';

/**
 * ========================================================================
 * VARIANT COMBINATION CONTROLLER
 * ========================================================================
 * Handles API endpoints for generating variant combinations
 * ========================================================================
 */

/**
 * POST /api/variants/generate-combinations
 * Generate all possible combinations of attributes
 * 
 * Request Body:
 * {
 *   "productGroup": "IPHONE-15-PRO",
 *   "productName": "iPhone 15 Pro",
 *   "brand": "Apple",
 *   "category": "smartphones",
 *   "storageIds": ["size_id_1", "size_id_2"],  // e.g., [1TB, 512GB]
 *   "ramIds": ["size_id_3", "size_id_4"],      // e.g., [12GB, 8GB]
 *   "colorIds": ["color_id_1", "color_id_2"],  // e.g., [Silver, Black]
 *   "basePrice": 99999,
 *   "description": "...",
 *   "specifications": {...},
 *   "images": [...]
 * }
 */
export const generateCombinations = async (req, res) => {
    try {
        const {
            productGroup,
            productName,
            brand,
            category,
            storageIds,
            ramIds,
            colorIds,
            basePrice,
            description,
            specifications,
            images
        } = req.body;

        // Validation
        if (!productGroup || !productName) {
            return res.status(400).json({
                success: false,
                message: 'productGroup and productName are required'
            });
        }

        if ((!storageIds || storageIds.length === 0) && (!ramIds || ramIds.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'At least one size attribute (storage or RAM) is required'
            });
        }

        if (!colorIds || colorIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one color is required'
            });
        }

        // Generate combinations
        const result = await generateVariantCombinations({
            productGroup,
            productName,
            brand,
            category,
            storageIds,
            ramIds,
            colorIds,
            basePrice: Number(basePrice) || 0,
            description,
            specifications,
            images
        });

        return res.status(201).json({
            success: true,
            message: `Successfully generated ${result.totalGenerated} variants`,
            data: result
        });

    } catch (error) {
        console.error('Error generating combinations:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate variant combinations',
            error: error.message
        });
    }
};

/**
 * POST /api/variants/preview-combinations
 * Preview what combinations will be generated (without creating them)
 * 
 * Request Body:
 * {
 *   "productGroup": "IPHONE-15-PRO",
 *   "brand": "Apple",
 *   "storageIds": ["size_id_1", "size_id_2"],
 *   "ramIds": ["size_id_3", "size_id_4"],
 *   "colorIds": ["color_id_1", "color_id_2"]
 * }
 */
export const previewCombinationsEndpoint = async (req, res) => {
    try {
        const {
            productGroup,
            brand,
            storageIds,
            ramIds,
            colorIds
        } = req.body;

        const result = await previewCombinations({
            productGroup,
            brand,
            storageIds,
            ramIds,
            colorIds
        });

        return res.status(200).json({
            success: true,
            message: `Preview: ${result.totalCombinations} combinations will be generated`,
            data: result
        });

    } catch (error) {
        console.error('Error previewing combinations:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to preview combinations',
            error: error.message
        });
    }
};

export default {
    generateCombinations,
    previewCombinationsEndpoint
};
