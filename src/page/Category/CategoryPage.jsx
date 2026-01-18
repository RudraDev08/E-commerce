import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { CategoryForm } from '../../components/Category/CategoryForm';
import { CategoryTable } from '../../components/Category/CategoryTable';
import { CategoryTree } from '../../components/Category/CategoryTree';
import { DeleteCategoryModal } from '../../components/Category/DeleteCategoryModal';
import { useCategories } from '../../hooks/useCategories';

export const CategoryPage = () => {
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

  const handleCreateClick = () => {
    setSelectedCategory(null);
    setShowFormModal(true);
  };

  const handleEditClick = (category) => {
    setSelectedCategory(category);
    setShowFormModal(true);
  };

  const handleDeleteClick = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory._id, formData);
      } else {
        await createCategory(formData);
      }
      setShowFormModal(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await deleteCategory(selectedCategory._id);
      setShowDeleteModal(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleStatusFilter = (e) => {
    setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
              <p className="text-gray-500 mt-1">Manage your product categories</p>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <Button
                variant={showTreeView ? 'primary' : 'outline'}
                onClick={() => setShowTreeView(!showTreeView)}
              >
                {showTreeView ? 'Table View' : 'Tree View'}
              </Button>
              <Button onClick={handleCreateClick}>
                <Plus size={20} className="mr-2" />
                New Category
              </Button>
            </div>
          </div>

          {/* Filters */}
          {!showTreeView && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={filters.search}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={filters.status}
                  onChange={handleStatusFilter}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {showTreeView ? (
          <CategoryTree />
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

        {/* Form Modal */}
        <Modal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setSelectedCategory(null);
          }}
          title={selectedCategory ? 'Edit Category' : 'Create New Category'}
          size="lg"
        >
          <CategoryForm
            category={selectedCategory}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowFormModal(false);
              setSelectedCategory(null);
            }}
            loading={formLoading}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteCategoryModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedCategory(null);
          }}
          category={selectedCategory}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
        />
      </div>
    </div>
  );
};

export default CategoryPage;