import AttributeType from '../models/AttributeType.model.js';
import slugify from 'slugify';

// Create Attribute Type
export const createAttributeType = async (req, res) => {
    try {
        const {
            name,
            displayName,
            inputType,
            displayStyle,
            category,
            attributeRole,
            showInFilters,
            showInVariants,
            description,
            validationRules,
            measurementConfig,
            code: providedCode,
            internalKey: providedInternalKey,
            canonicalId: providedCanonicalId
        } = req.body;

        const slug = slugify(name, { lower: true, strict: true });
        const code = providedCode || name.toUpperCase().replace(/\s+/g, '_');

        // Generate required enterprise fields if missing
        const internalKey = providedInternalKey || `ATTR_${code}`;
        const canonicalId = providedCanonicalId || code;

        const attributeType = await AttributeType.create({
            name,
            slug,
            code,
            internalKey,
            canonicalId,
            displayName: displayName || name,
            inputType: inputType || 'dropdown',
            displayStyle: displayStyle || 'inline',
            category: category || 'specification',
            attributeRole: attributeRole || (category === 'specification' ? 'SPECIFICATION' : 'VARIANT'),
            showInFilters: showInFilters ?? true,
            showInVariants: showInVariants ?? true,
            description,
            validationRules: validationRules || {
                isRequired: req.body.isRequired || false,
                allowMultipleSelection: req.body.allowMultiple || false
            },
            measurementConfig: measurementConfig || {
                hasMeasurements: false,
                unit: 'none'
            }
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

        // 🟣 Phase 4.3 Dimension Locking (Prevent changing createsVariant without confirmation)
        if (updates.createsVariant !== undefined && updates.createsVariant !== attributeType.createsVariant) {
            if (updates.allowRegeneration !== true) {
                return res.status(400).json({
                    success: false,
                    message: "Changing 'createsVariant' affects the entire variant matrix. Please confirm by setting 'allowRegeneration': true in the request."
                });
            }
        }

        // Handle slug and code generation if name changed and code not provided
        if (updates.name && !updates.code) {
            updates.slug = slugify(updates.name, { lower: true, strict: true });
            updates.code = updates.name.toUpperCase().replace(/\s+/g, '_');
        } else if (updates.code) {
            updates.code = updates.code.toUpperCase().replace(/\s+/g, '_');
            if (updates.name) {
                updates.slug = slugify(updates.name, { lower: true, strict: true });
            }
        }

        // Update attribute role based on category if not explicitly provided
        if (updates.category && !updates.attributeRole) {
            updates.attributeRole = updates.category === 'specification' ? 'SPECIFICATION' : 'VARIANT';
        }

        // Strip immutable fields from update payload to avoid accidental overwrites
        delete updates.internalKey;
        delete updates.canonicalId;
        delete updates._id;
        delete updates.__v;
        delete updates.allowRegeneration;

        // Use $set + runValidators:false so old records missing enterprise fields
        // (internalKey, canonicalId) don't fail validation on partial updates
        const updated = await AttributeType.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            { $set: updates },
            { new: true, runValidators: false }
        );

        res.json({
            success: true,
            message: 'Attribute type updated successfully',
            data: updated
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
        // Use findOneAndUpdate with $set instead of .save() to avoid
        // triggering full-document validation on old records that pre-date
        // the internalKey / canonicalId required fields.
        const result = await AttributeType.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            { $set: { isDeleted: true, deletedAt: new Date() } },
            { new: true, runValidators: false }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Attribute type not found'
            });
        }

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

        // PRIMARY: try category-scoped fetch
        let attributeTypes = await AttributeType.findByCategory(categoryId);

        let isCategoryScoped = true;
        let fallback = false;

        // FALLBACK: if no attributes are linked to this category, return all active types
        // This is intentional — admins can use Section B before category ↔ attribute links are set up.
        if (!attributeTypes || attributeTypes.length === 0) {
            attributeTypes = await AttributeType.find({
                status: 'active',
                isDeleted: false,
            }).sort({ displayOrder: 1, name: 1 }).limit(100);

            isCategoryScoped = false;
            fallback = true;
        }

        res.json({
            success: true,
            data: attributeTypes,
            isCategoryScoped,
            fallback,
        });
    } catch (error) {
        console.error('Get attribute types by category error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch attribute types'
        });
    }
};
