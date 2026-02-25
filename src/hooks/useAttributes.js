import { useState, useCallback } from 'react';
import { attributeTypeAPI, attributeValueAPI } from '../Api/api';
import toast from 'react-hot-toast';

const useAttributes = () => {
    const [loading, setLoading] = useState(false);
    const [attributeTypes, setAttributeTypes] = useState([]);
    const [attributeValues, setAttributeValues] = useState([]);
    const [selectedAttribute, setSelectedAttribute] = useState(null);

    // Attribute Types
    const fetchAttributeTypes = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await attributeTypeAPI.getAll(params);
            setAttributeTypes(response.data.data || []);
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch attributes');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getAttributeTypeById = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await attributeTypeAPI.getById(id);
            const data = response.data.data || response.data;
            setSelectedAttribute(data);
            return data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch attribute details');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createAttributeType = async (data) => {
        setLoading(true);
        try {
            const response = await attributeTypeAPI.create(data);
            toast.success('Attribute created successfully');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create attribute');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateAttributeType = async (id, data) => {
        setLoading(true);
        try {
            const response = await attributeTypeAPI.update(id, data);
            toast.success('Attribute updated successfully');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update attribute');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteAttributeType = async (id) => {
        setLoading(true);
        try {
            await attributeTypeAPI.delete(id);
            toast.success('Attribute deleted successfully');
            setAttributeTypes(prev => prev.filter(attr => attr._id !== id));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete attribute');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Attribute Values
    const fetchAttributeValues = useCallback(async (typeId) => {
        setLoading(true);
        try {
            const response = await attributeValueAPI.getByType(typeId);
            setAttributeValues(response.data.data || []);
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch attribute values');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createAttributeValue = async (data) => {
        try {
            const response = await attributeValueAPI.create(data);
            toast.success('Value added successfully');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add value');
            throw error;
        }
    };

    const updateAttributeValue = async (id, data) => {
        try {
            const response = await attributeValueAPI.update(id, data);
            toast.success('Value updated successfully');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update value');
            throw error;
        }
    };

    const deleteAttributeValue = async (id) => {
        try {
            await attributeValueAPI.delete(id);
            toast.success('Value deleted successfully');
            setAttributeValues(prev => prev.filter(val => val._id !== id));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete value');
            throw error;
        }
    };

    const reorderAttributeValues = async (items) => {
        try {
            await attributeValueAPI.reorder({ items });
            toast.success('Order updated');
        } catch (error) {
            toast.error('Failed to reorder items');
        }
    }

    return {
        loading,
        attributeTypes,
        attributeValues,
        selectedAttribute,
        fetchAttributeTypes,
        getAttributeTypeById,
        createAttributeType,
        updateAttributeType,
        deleteAttributeType,
        fetchAttributeValues,
        createAttributeValue,
        updateAttributeValue,
        deleteAttributeValue,
        reorderAttributeValues
    };
};

export default useAttributes;
