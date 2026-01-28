import { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../api/api';

export const useInventory = () => {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchInventories = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryAPI.getAll(filters);
      // Backend now returns { data: [...], pagination: {...} }
      // We set inventories to the list.
      // Ideally we should exposure pagination metadata too but for now we keep it compatible.
      setInventories(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await inventoryAPI.getStats();
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const createInventory = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryAPI.create(data);
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
      const response = await inventoryAPI.update(id, data);
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
      const response = await inventoryAPI.adjustStock(adjustmentData);
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

  const bulkUpdate = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryAPI.bulkUpdate(data);
      await fetchInventories();
      await fetchStats();
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message || 'Failed to bulk update inventory');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getLedger = useCallback(async (productId, params) => {
    // Exposing simple getLedger if needed, though useInventoryLedger exists
    return inventoryAPI.getLedger(productId, params);
  }, []);

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
    bulkUpdate, // Add this
    getLedger,
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
      const response = await inventoryAPI.getLedger(productId, filters);
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