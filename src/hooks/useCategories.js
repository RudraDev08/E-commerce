import { useState, useEffect, useCallback } from 'react';
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

  /* ================= FETCH ================= */
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryApi.getAll(filters);
      setCategories(res.data);
      setPagination(res.pagination);
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /* ================= CREATE ================= */
  const createCategory = async (formData) => {
    try {
      const res = await categoryApi.create(formData);
      toast.success(res.message || 'Category created');
      await fetchCategories();
      return res.data;
    } catch (error) {
      toast.error(error);
      throw error;
    }
  };

  /* ================= UPDATE ================= */
  const updateCategory = async (id, formData) => {
    try {
      const res = await categoryApi.update(id, formData);
      toast.success(res.message || 'Category updated');
      await fetchCategories();
      return res.data;
    } catch (error) {
      toast.error(error);
      throw error;
    }
  };

  /* ================= STATUS ================= */
  const updateStatus = async (id, status) => {
    try {
      const res = await categoryApi.updateStatus(id, status);
      toast.success(res.message || 'Status updated');
      await fetchCategories();
      return res.data;
    } catch (error) {
      toast.error(error);
      throw error;
    }
  };

  /* ================= DELETE ================= */
  const deleteCategory = async (id) => {
    try {
      const res = await categoryApi.delete(id);
      toast.success(res.message || 'Category deleted');
      await fetchCategories();
    } catch (error) {
      toast.error(error);
      throw error;
    }
  };

  /* ================= EFFECT ================= */
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    pagination,
    loading,
    filters,
    setFilters,
    createCategory,
    updateCategory,
    updateStatus,
    deleteCategory,
    refetch: fetchCategories
  };
};
