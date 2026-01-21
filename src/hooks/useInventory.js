import { useState, useEffect, useCallback } from 'react';
import { inventoryApi } from '../Api/inventory/inventoryApi';

export const useInventory = () => {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchInventories = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryApi.getAllInventories(filters);
      setInventories(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await inventoryApi.getInventoryStats();
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const createInventory = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryApi.createInventory(data);
      await fetchInventories();
      await fetchStats();
      return { success: true, data: response.data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateInventory = async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryApi.updateInventory(id, data);
      await fetchInventories();
      await fetchStats();
      return { success: true, data: response.data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const adjustStock = async (adjustmentData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryApi.adjustStock(adjustmentData);
      await fetchInventories();
      await fetchStats();
      return { success: true, data: response.data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
    fetchStats();
  }, [fetchInventories, fetchStats]);

  return {
    inventories,
    loading,
    error,
    stats,
    fetchInventories,
    createInventory,
    updateInventory,
    adjustStock,
    refetch: fetchInventories,
  };
};

export const useInventoryLedger = (productId) => {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLedger = useCallback(async (filters = {}) => {
    if (!productId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryApi.getInventoryLedger(productId, filters);
      setLedger(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchLedger();
    }
  }, [productId, fetchLedger]);

  return {
    ledger,
    loading,
    error,
    refetch: fetchLedger,
  };
};