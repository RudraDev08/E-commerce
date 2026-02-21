import AttributeType from '../models/AttributeType.model.js';
import slugify from 'slugify';

// Create Attribute Type
export const createAttributeType = async (req, res) => {
    try {
        const {
            name,
            displayName,
            displayType,
            valueType,
            category,
            isRequired,
            allowMultiple,
            affectsPrice,
            affectsStock,
            showInFilters,
            showInVariants,
            displayOrder,
            applicableCategories,
            description,
            helpText,
            icon
        } = req.body;

        const slug = slugify(name, { lower: true, strict: true });
        const code = name.toUpperCase().replace(/\s+/g, '_');

        const attributeType = await AttributeType.create({
            name,
            slug,
            code,
            displayName: displayName || name,
            displayType,
            valueType,
            category,
            isRequired,
            allowMultiple,
            affectsPrice,
            affectsStock,
            showInFilters,
            showInVariants,
            displayOrder: displayOrder || 0,
            applicableCategories,
            description,
            helpText,
            icon
        });

        res.status(201).json({
            success: true,
            message: 'Attribute type created successfully',
            data: attributeType
        });
    } catch (error) {
        console.error('Create attribute type error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create attribute type'
        });
    }
};

// Get All Attribute Types
export const getAttributeTypes = async (req, res) => {
    try {
        const { category, status, search, page = 1, limit = 50 } = req.query;

        const query = { isDeleted: false };

        if (category) query.category = category;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { displayName: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [attributeTypes, total] = await Promise.all([
            AttributeType.find(query)
                .populate('applicableCategories', 'name slug')
                .sort({ displayOrder: 1, name: 1 })
                .limit(parseInt(limit))
                .skip(skip),
            AttributeType.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: attributeTypes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get attribute types error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch attribute types'
        });
    }
};

// Get Single Attribute Type
export const getAttributeType = async (req, res) => {
    try {
        const attributeType = await AttributeType.findOne({
            _id: req.params.id,
            isDeleted: false
        }).populate('applicableCategories', 'name slug');

        if (!attributeType) {
            return res.status(404).json({
                success: false,
                message: 'Attribute type not found'
            });
        }

        res.json({
            success: true,
            data: attributeType
        });
    } catch (error) {
        console.error('Get attribute type error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch attribute type'
        });
    }
};

// Update Attribute Type
export const updateAttributeType = async (req, res) => {
    try {
        const attributeType = await AttributeType.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!attributeType) {
            return res.status(404).json({
                success: false,
                message: 'Attribute type not found'
            });
        }

        const updates = { ...req.body };

        if (updates.name) {
            updates.slug = slugify(updates.name, { lower: true, strict: true });
            updates.code = updates.name.toUpperCase().replace(/\s+/g, '_');
        }

        Object.assign(attributeType, updates);
        await attributeType.save();

        res.json({
            success: true,
            message: 'Attribute type updated successfully',
            data: attributeType
        });
    } catch (error) {
        console.error('Update attribute type error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update attribute type'
        });
    }
};

// Delete Attribute Type
export const deleteAttributeType = async (req, res) => {
    try {
        const attributeType = await AttributeType.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!attributeType) {
            return res.status(404).json({
                success: false,
                message: 'Attribute type not found'
            });
        }

        attributeType.isDeleted = true;
        attributeType.deletedAt = new Date();
        await attributeType.save();

        res.json({
            success: true,
            message: 'Attribute type deleted successfully'
        });
    } catch (error) {
        console.error('Delete attribute type error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete attribute type'
        });
    }
};

// Get Attribute Types by Category
export const getAttributeTypesByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const attributeTypes = await AttributeType.findByCategory(categoryId);

        res.json({
            success: true,
            data: attributeTypes
        });
    } catch (error) {
        console.error('Get attribute types by category error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch attribute types'
        });
    }
};
