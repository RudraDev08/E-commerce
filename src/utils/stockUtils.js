/**
 * Utility functions for stock calculations and formatting
 */

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num || 0);
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const getStockStatusColor = (currentStock, reorderLevel, minimumLevel) => {
  if (currentStock === 0) return 'bg-red-100 text-red-800';
  if (currentStock <= minimumLevel) return 'bg-red-100 text-red-800';
  if (currentStock <= reorderLevel) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};

export const getStatusBadgeColor = (status) => {
  const colors = {
    ACTIVE: 'bg-green-100 text-green-800',
    BLOCKED: 'bg-red-100 text-red-800',
    DISCONTINUED: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getTransactionTypeColor = (type) => {
  const colors = {
    IN: 'bg-green-100 text-green-800',
    OUT: 'bg-red-100 text-red-800',
    ADJUST: 'bg-blue-100 text-blue-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export const calculateStockHealth = (currentStock, reorderLevel, maximumLevel) => {
  if (currentStock === 0) return { label: 'Out of Stock', percentage: 0 };
  if (currentStock <= reorderLevel) return { label: 'Low Stock', percentage: 25 };
  
  const percentage = Math.min(100, (currentStock / maximumLevel) * 100);
  
  if (percentage >= 75) return { label: 'Healthy', percentage };
  if (percentage >= 50) return { label: 'Adequate', percentage };
  return { label: 'Low', percentage };
};

export const validateStockAdjustment = (type, quantity, currentStock) => {
  if (!quantity || quantity === 0) {
    return { valid: false, error: 'Quantity must be greater than 0' };
  }
  
  if (type === 'OUT' && Math.abs(quantity) > currentStock) {
    return { valid: false, error: 'Insufficient stock for OUT transaction' };
  }
  
  if (type === 'ADJUST') {
    const newStock = currentStock + quantity;
    if (newStock < 0) {
      return { valid: false, error: 'Adjustment would result in negative stock' };
    }
  }
  
  return { valid: true };
};

export const generateSKU = (productName) => {
  const prefix = productName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 3);
  
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${random}`;
};