// Validation utility functions for inventory operations

export const validateInventoryMaster = (data) => {
  const errors = {};

  // Required fields
  if (!data.productId?.trim()) {
    errors.productId = 'Product ID is required';
  }
  if (!data.productName?.trim()) {
    errors.productName = 'Product name is required';
  }
  if (!data.sku?.trim()) {
    errors.sku = 'SKU is required';
  }
  if (data.costPrice === undefined || data.costPrice === null) {
    errors.costPrice = 'Cost price is required';
  }

  // Numeric validations
  if (data.costPrice < 0) {
    errors.costPrice = 'Cost price cannot be negative';
  }
  if (data.openingStock < 0) {
    errors.openingStock = 'Opening stock cannot be negative';
  }
  if (data.minimumStockLevel < 0) {
    errors.minimumStockLevel = 'Minimum stock level cannot be negative';
  }
  if (data.reorderLevel < 0) {
    errors.reorderLevel = 'Reorder level cannot be negative';
  }

  // Business logic validations
  if (data.maximumStockLevel && data.minimumStockLevel && 
      data.maximumStockLevel <= data.minimumStockLevel) {
    errors.maximumStockLevel = 'Maximum stock must be greater than minimum stock';
  }
  if (data.reorderQuantity && data.reorderQuantity <= 0) {
    errors.reorderQuantity = 'Reorder quantity must be greater than 0';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateStockAdjustment = (data) => {
  const errors = {};

  if (!data.productId?.trim()) {
    errors.productId = 'Product ID is required';
  }
  if (!data.transactionType) {
    errors.transactionType = 'Transaction type is required';
  }
  if (!['IN', 'OUT', 'ADJUST'].includes(data.transactionType)) {
    errors.transactionType = 'Invalid transaction type';
  }
  if (data.quantity === undefined || data.quantity === null) {
    errors.quantity = 'Quantity is required';
  }
  if (data.quantity === 0) {
    errors.quantity = 'Quantity cannot be zero';
  }
  if (!data.reason?.trim()) {
    errors.reason = 'Reason is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const sanitizeInput = (data) => {
  const sanitized = { ...data };
  
  // Trim string fields
  if (sanitized.productId) sanitized.productId = sanitized.productId.trim();
  if (sanitized.productName) sanitized.productName = sanitized.productName.trim();
  if (sanitized.sku) sanitized.sku = sanitized.sku.trim().toUpperCase();
  if (sanitized.barcode) sanitized.barcode = sanitized.barcode.trim();
  if (sanitized.reason) sanitized.reason = sanitized.reason.trim();
  
  // Parse numeric fields
  if (sanitized.openingStock) sanitized.openingStock = Number(sanitized.openingStock);
  if (sanitized.costPrice) sanitized.costPrice = Number(sanitized.costPrice);
  if (sanitized.minimumStockLevel) sanitized.minimumStockLevel = Number(sanitized.minimumStockLevel);
  if (sanitized.maximumStockLevel) sanitized.maximumStockLevel = Number(sanitized.maximumStockLevel);
  if (sanitized.reorderLevel) sanitized.reorderLevel = Number(sanitized.reorderLevel);
  if (sanitized.reorderQuantity) sanitized.reorderQuantity = Number(sanitized.reorderQuantity);
  if (sanitized.quantity) sanitized.quantity = Number(sanitized.quantity);
  
  return sanitized;
};