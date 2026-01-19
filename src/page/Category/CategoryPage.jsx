import { useState, useCallback } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import  CategoryForm  from '../../components/Category/CategoryForm';
import  CategoryTable  from '../../components/Category/CategoryTable';
import  CategoryTree  from '../../components/Category/CategoryTree';
import  DeleteCategoryModal  from '../../components/Category/DeleteCategoryModal';
import  {useCategories}  from '../../hooks/useCategories';

const CategoryPage = () => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTreeView, setShowTreeView] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    categories,
    pagination,
    loading,
    filters,
    setFilters,
    createCategory,
    updateCategory,
    deleteCategory
  } = useCategories();

  // Unified cleanup for closing the form modal
  const handleCloseForm = useCallback(() => {
    setShowFormModal(false);
    setSelectedCategory(null);
  }, []);

  const handleCreateClick = useCallback(() => {
    setSelectedCategory(null);
    setShowFormModal(true);
  }, []);

  const handleEditClick = useCallback((category) => {
    setSelectedCategory(category);
    setShowFormModal(true);
  }, []);

  const handleDeleteClick = useCallback((category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  }, []);

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory._id, formData);
        toast.success('Category updated successfully!');
      } else {
        await createCategory(formData);
        toast.success('Category created successfully!');
      }
      handleCloseForm();
    } catch (error) {
      // Since your interceptor wraps errors in new Error(message),
      // we can directly use error.message
      const errorMessage = error.message || 'Failed to save category';
      toast.error(errorMessage);
      console.error('Form submission error:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;

    setDeleteLoading(true);
    
    try {
      await deleteCategory(selectedCategory._id);
      toast.success('Category deleted successfully!');
      setShowDeleteModal(false);
      setSelectedCategory(null);
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete category';
      toast.error(errorMessage);
      console.error('Delete error:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedCategory(null);
  }, []);

  // Helper for filter updates
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, [setFilters]);

  const handlePageChange = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
  }, [setFilters]);

  const toggleView = useCallback(() => {
    setShowTreeView(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                Category Management
              </h1>
              <p className="text-gray-500 mt-1">
                Organize and manage your product hierarchy
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant={showTreeView ? 'primary' : 'outline'}
                onClick={toggleView}
                className="transition-all duration-200"
              >
                {showTreeView ? 'Table View' : 'Tree View'}
              </Button>
              <Button 
                onClick={handleCreateClick} 
                className="shadow-sm"
              >
                <Plus size={20} className="mr-2" />
                New Category
              </Button>
            </div>
          </div>

          {/* Filters Bar - Hidden in Tree View */}
          {!showTreeView && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
              <div className="md:col-span-2 relative">
                <Search 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                  size={18} 
                />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                />
              </div>

              <div className="relative">
                <Filter 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                  size={18} 
                />
                <select
                  value={filters.status || ''}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white cursor-pointer"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm min-h-[400px]">
          {showTreeView ? (
            <div className="p-6">
              <CategoryTree 
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            </div>
          ) : (
            <CategoryTable
              categories={categories}
              pagination={pagination}
              loading={loading}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showFormModal}
          onClose={handleCloseForm}
          title={selectedCategory ? 'Edit Category' : 'Create New Category'}
          size="lg"
        >
          <CategoryForm
            category={selectedCategory}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseForm}
            loading={formLoading}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteCategoryModal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          category={selectedCategory}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
        />
      </div>
    </div>
  );
};

export default CategoryPage;