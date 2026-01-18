import categoryService from '../../services/category.service.js';

class CategoryController {
  async create(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body, req.file);
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await categoryService.getCategories(req.query);
      res.json({
        success: true,
        data: result.categories,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getTree(req, res, next) {
    try {
      const tree = await categoryService.getCategoryTree();
      res.json({
        success: true,
        data: tree
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await categoryService.getCategoryById(req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body, req.file);
      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await categoryService.deleteCategory(req.params.id);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async getParents(req, res, next) {
    try {
      const categories = await categoryService.getActiveParentCategories();
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();