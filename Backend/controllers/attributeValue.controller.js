import AttributeValue from '../models/AttributeValue.model.js';
import AttributeType from '../models/AttributeType.model.js';
import slugify from 'slugify';
import { validateCategoryRequirements } from '../utils/attributeValidators.js';

// Create Attribute Value
export const createAttributeValue = async (req, res) => {
    try {
        const {
            attributeType,
            name,
            displayName,
            value,
            description,
            displayOrder,
            visualData,
            technicalData,
            measurements,
            materialData,
            styleData,
            pricingModifiers,
            inventoryModifiers,
            availabilityRules,
            compatibilityRules,
            displayAssets,
            seo,
            translations,
            customFields,
            applicableCategories,
            metadata // Keep for backward compatibility/generic data
        } = req.body;

        // Verify attribute type exists
        const attrType = await AttributeType.findById(attributeType);
        if (!attrType) {
            return res.status(404).json({
                success: false,
                message: 'Attribute type not found'
            });
        }

        // Step 4: Validate Category Behavior
        const validation = validateCategoryRequirements(attrType, req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const slug = slugify(name, { lower: true, strict: true });
        // Ensure code is unique per type
        const code = `${attrType.code}-${name.toUpperCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`;

        const attributeValue = await AttributeValue.create({
            attributeType,
            name: name.toUpperCase(),
            slug,
            code,
            displayName,
            value,
            description,
            displayOrder: displayOrder || 0,

            // Structured Data Sections
            visualData,
            technicalData,
            measurements,
            materialData,
            styleData,
            pricingModifiers,
            inventoryModifiers,
            availabilityRules,
            compatibilityRules,
            displayAssets,
            seo,
            translations,
            customFields,

            applicableCategories,
            // Metadata (legacy support or extra data)
            metadata,

            createdBy: 'admin'
        });

        res.status(201).json({
            success: true,
            message: 'Attribute value created successfully',
            data: attributeValue
        });
    } catch (error) {
        console.error('Create attribute value error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Attribute value with this code already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create attribute value'
        });
    }
};

// Get All Attribute Values
export const getAttributeValues = async (req, res) => {
    try {
        const {
            attributeType,
            sizeGroup,
            gender,
            colorFamily,
            status,
            search,
            page = 1,
            limit = 100
        } = req.query;

        const query = { isDeleted: false };

        if (attributeType) query.attributeType = attributeType;
        if (status) query.status = status;

        // Updated filters for new schema structure
        if (sizeGroup) query['measurements.sizeGroup'] = sizeGroup;
        if (gender) query['measurements.gender'] = gender;
        if (colorFamily) query['visualData.colorFamily'] = colorFamily;

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { displayName: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [attributeValues, total] = await Promise.all([
            AttributeValue.find(query)
                .populate('attributeType', 'name displayName displayType')
                .populate('applicableCategories', 'name slug')
                .sort({ displayOrder: 1, name: 1 })
                .limit(parseInt(limit))
                .skip(skip),
            AttributeValue.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: attributeValues,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get attribute values error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch attribute values'
        });
    }
};

// Get Attribute Values by Type
export const getAttributeValuesByType = async (req, res) => {
    try {
        const { attributeTypeId } = req.params;
        const { sizeGroup, gender, colorFamily, category } = req.query;

        const filters = {};
        if (sizeGroup) filters.sizeGroup = sizeGroup;
        if (gender) filters.gender = gender;
        if (colorFamily) filters.colorFamily = colorFamily;
        if (category) filters.category = category;

        const attributeValues = await AttributeValue.findByType(attributeTypeId, filters);

        res.json({
            success: true,
            data: attributeValues
        });
    } catch (error) {
        console.error('Get attribute values by type error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch attribute values'
        });
    }
};

// Get Single Attribute Value
export const getAttributeValue = async (req, res) => {
    try {
        const attributeValue = await AttributeValue.findOne({
            _id: req.params.id,
            isDeleted: false
        })
            .populate('attributeType', 'name displayName displayType')
            .populate('applicableCategories', 'name slug');

        if (!attributeValue) {
            return res.status(404).json({
                success: false,
                message: 'Attribute value not found'
            });
        }

        res.json({
            success: true,
            data: attributeValue
        });
    } catch (error) {
        console.error('Get attribute value error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch attribute value'
        });
    }
};

// Update Attribute Value
export const updateAttributeValue = async (req, res) => {
    try {
        const attributeValue = await AttributeValue.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!attributeValue) {
            return res.status(404).json({
                success: false,
                message: 'Attribute value not found'
            });
        }

        const updates = { ...req.body, updatedBy: 'admin' };

        // Don't allowing updating attributeType usually, but if needed logic should go here
        delete updates.attributeType;

        if (updates.name) {
            updates.slug = slugify(updates.name, { lower: true, strict: true });
        }

        Object.assign(attributeValue, updates);
        await attributeValue.save();

        res.json({
            success: true,
            message: 'Attribute value updated successfully',
            data: attributeValue
        });
    } catch (error) {
        console.error('Update attribute value error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update attribute value'
        });
    }
};

// Delete Attribute Value
export const deleteAttributeValue = async (req, res) => {
    try {
        const attributeValue = await AttributeValue.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!attributeValue) {
            return res.status(404).json({
                success: false,
                message: 'Attribute value not found'
            });
        }

        await attributeValue.softDelete('admin');

        res.json({
            success: true,
            message: 'Attribute value deleted successfully'
        });
    } catch (error) {
        console.error('Delete attribute value error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete attribute value'
        });
    }
};

// Bulk Create Attribute Values
export const bulkCreateAttributeValues = async (req, res) => {
    try {
        const { attributeType, values } = req.body;

        if (!Array.isArray(values) || values.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of values'
            });
        }

        // Verify attribute type exists
        const attrType = await AttributeType.findById(attributeType);
        if (!attrType) {
            return res.status(404).json({
                success: false,
                message: 'Attribute type not found'
            });
        }

        const preparedValues = values.map(val => ({
            ...val,
            attributeType,
            name: val.name.toUpperCase(),
            slug: slugify(val.name, { lower: true, strict: true }),
            code: `${attrType.code}-${val.name.toUpperCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`,
            createdBy: 'admin'
        }));

        const createdValues = await AttributeValue.insertMany(preparedValues, { ordered: false });

        res.status(201).json({
            success: true,
            message: `${createdValues.length} attribute values created successfully`,
            data: createdValues
        });
    } catch (error) {
        console.error('Bulk create attribute values error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create attribute values'
        });
    }
};

// Reorder Attribute Values
export const reorderAttributeValues = async (req, res) => {
    try {
        const { reorderData } = req.body;

        if (!Array.isArray(reorderData) || reorderData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide reorder data array'
            });
        }

        const bulkOps = reorderData.map(({ valueId, newDisplayOrder }) => ({
            updateOne: {
                filter: { _id: valueId },
                update: { displayOrder: newDisplayOrder, updatedBy: 'admin' }
            }
        }));

        await AttributeValue.bulkWrite(bulkOps);

        res.json({
            success: true,
            message: 'Attribute values reordered successfully'
        });
    } catch (error) {
        console.error('Reorder attribute values error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to reorder attribute values'
        });
    }
};
