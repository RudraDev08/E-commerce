import Category from '../models/Category/CategorySchema.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import { buildTree, buildBreadcrumb } from '../utils/buildTree.js';
import fs from 'fs';

class CategoryService {
  async createCategory(data, file) {
    const slug = await generateUniqueSlug(data.name);
    
    const categoryData = {
      ...data,
      slug,
      image: file ? file.path : null
    };

    if (data.parentId) {
      const parent = await Category.findById(data.parentId);
      if (!parent || parent.isDeleted) {
        throw new Error('Parent category not found');
      }
    }

    const category = await Category.create(categoryData);
    return await Category.findById(category._id).populate('parentId', 'name slug');
  }

  async getCategories(filters = {}) {
    const { search, status, parentId, page = 1, limit = 10, includeDeleted = false } = filters;
    
    const query = { isDeleted: includeDeleted };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (parentId !== undefined) {
      query.parentId = parentId === 'null' ? null : parentId;
    }

    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      Category.find(query)
        .populate('parentId', 'name slug')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Category.countDocuments(query)
    ]);

    return {
      categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getCategoryTree() {
    const categories = await Category.find({ isDeleted: false, status: 'Active' })
      .populate('parentId', 'name slug')
      .sort({ priority: -1, name: 1 });

    return buildTree(categories);
  }

  async getCategoryById(id) {
    const category = await Category.findOne({ _id: id, isDeleted: false })
      .populate('parentId', 'name slug');

    if (!category) {
      throw new Error('Category not found');
    }

    const breadcrumb = await buildBreadcrumb(Category, id);

    return { category, breadcrumb };
  }

  async updateCategory(id, data, file) {
    const category = await Category.findOne({ _id: id, isDeleted: false });
    
    if (!category) {
      throw new Error('Category not found');
    }

    // Check circular reference
    if (data.parentId) {
      if (data.parentId === id) {
        throw new Error('Category cannot be its own parent');
      }

      const parent = await Category.findById(data.parentId);
      if (!parent || parent.isDeleted) {
        throw new Error('Parent category not found');
      }

      if (await this.isDescendant(id, data.parentId)) {
        throw new Error('Cannot set a descendant as parent (circular reference)');
      }
    }

    // Update slug if name changed
    if (data.name && data.name !== category.name) {
      data.slug = await generateUniqueSlug(data.name, id);
    }

    // Handle image update
    if (file) {
      if (category.image && fs.existsSync(category.image)) {
        fs.unlinkSync(category.image);
      }
      data.image = file.path;
    }

    Object.assign(category, data);
    await category.save();

    return await Category.findById(id).populate('parentId', 'name slug');
  }

  async deleteCategory(id) {
    const category = await Category.findOne({ _id: id, isDeleted: false });
    
    if (!category) {
      throw new Error('Category not found');
    }

    const hasChildren = await Category.exists({ parentId: id, isDeleted: false });
    if (hasChildren) {
      throw new Error('Cannot delete category with active children');
    }

    category.isDeleted = true;
    await category.save();

    return { message: 'Category deleted successfully' };
  }

  async isDescendant(ancestorId, descendantId) {
    let current = await Category.findById(descendantId);
    
    while (current && current.parentId) {
      if (current.parentId.toString() === ancestorId) {
        return true;
      }
      current = await Category.findById(current.parentId);
    }
    
    return false;
  }

  async getActiveParentCategories() {
    return await Category.find({ 
      isDeleted: false, 
      status: 'Active' 
    })
    .select('name slug parentId priority')
    .sort({ priority: -1, name: 1 });
  }
}

export default new CategoryService();