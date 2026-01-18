import { useState, useEffect } from 'react';
import categoryApi from '../Api/Category/categoryApi';
import toast from 'react-hot-toast';

export const useCategories = (initialFilters = {}) => {
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    ...initialFilters
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await categoryApi.getAll(filters);
      setCategories(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (formData) => {
    try {
      const { data } = await categoryApi.create(formData);
      toast.success(data.message);
      await fetchCategories();
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create category';
      toast.error(message);
      throw error;
    }
  };

  const updateCategory = async (id, formData) => {
    try {
      const { data } = await categoryApi.update(id, formData);
      toast.success(data.message);
      await fetchCategories();
      return data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update category';
      toast.error(message);
      throw error;
    }
  };

  const deleteCategory = async (id) => {
    try {
      const { data } = await categoryApi.delete(id);
      toast.success(data.message);
      await fetchCategories();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete category';
      toast.error(message);
      throw error;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [filters.page, filters.limit, filters.search, filters.status]);

  return {
    categories,
    pagination,
    loading,
    filters,
    setFilters,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories
  };
};