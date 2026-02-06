import { generateVariants } from '../services/variantGenerator.service.js';
import UnifiedVariant from '../models/UnifiedVariant.model.js';

// Generate Variants
export const generateProductVariants = async (req, res) => {
    try {
        const { productId } = req.params;
        const { selectedAttributes, baseProductData } = req.body;

        // Validate inputs
        if (!productId || !selectedAttributes || !Array.isArray(selectedAttributes)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data. Required: productId, selectedAttributes (array)'
            });
        }

        // Add userId to base data
        const generationData = {
            ...baseProductData,
            userId: req.user?._id
        };

        const result = await generateVariants(productId, selectedAttributes, generationData);

        res.status(201).json({
            success: true,
            message: `Successfully generated ${result.totalGenerated} variants`,
            data: result.variants
        });

    } catch (error) {
        console.error('Variant generation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate variants'
        });
    }
};

// Get Variants for Product
export const getProductVariants = async (req, res) => {
    try {
        const { productId } = req.params;
        const variants = await UnifiedVariant.findByProduct(productId);

        res.json({
            success: true,
            data: variants
        });
    } catch (error) {
        console.error('Get variants error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch variants'
        });
    }
};
