# Variant-First E-commerce Architecture
## Complete System Design (React + Node.js + MongoDB/PostgreSQL)

---

## 🎯 CORE PHILOSOPHY

**Variant = Sellable Unit**  
No `product_master` table. The variant IS the product.

---

## 📊 DATABASE SCHEMA

### 1️⃣ MASTER TABLES (Reusable Data)

#### A. Size Master
```sql
CREATE TABLE size_master (
    size_id VARCHAR(36) PRIMARY KEY,
    category ENUM('storage', 'ram', 'clothing', 'shoe', 'display', 'other') NOT NULL,
    value VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_size (category, value)
);

-- Indexes
CREATE INDEX idx_size_category ON size_master(category);
CREATE INDEX idx_size_active ON size_master(is_active);
```

**MongoDB Schema:**
```javascript
// models/SizeMaster.js
const sizeSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ['storage', 'ram', 'clothing', 'shoe', 'display', 'other'],
        required: true
    },
    value: { type: String, required: true },
    displayName: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

sizeSchema.index({ category: 1, value: 1 }, { unique: true });
sizeSchema.index({ isActive: 1 });

module.exports = mongoose.model('SizeMaster', sizeSchema);
```

#### B. Color Master
```sql
CREATE TABLE color_master (
    color_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    hex_code VARCHAR(7) NOT NULL,
    category ENUM('solid', 'metallic', 'gradient', 'pattern') DEFAULT 'solid',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_color_active ON color_master(is_active);
```

**MongoDB Schema:**
```javascript
// models/ColorMaster.js
const colorSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    hexCode: { type: String, required: true },
    category: {
        type: String,
        enum: ['solid', 'metallic', 'gradient', 'pattern'],
        default: 'solid'
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

colorSchema.index({ isActive: 1 });

module.exports = mongoose.model('ColorMaster', colorSchema);
```

#### C. Attribute Master (Flexible Attributes)
```sql
CREATE TABLE attribute_master (
    attribute_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('single_select', 'multi_select', 'text', 'number') DEFAULT 'single_select',
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attribute_values (
    value_id VARCHAR(36) PRIMARY KEY,
    attribute_id VARCHAR(36) NOT NULL,
    value VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (attribute_id) REFERENCES attribute_master(attribute_id) ON DELETE CASCADE,
    UNIQUE KEY unique_attr_value (attribute_id, value)
);
```

**MongoDB Schema:**
```javascript
// models/AttributeMaster.js
const attributeValueSchema = new mongoose.Schema({
    value: { type: String, required: true },
    displayName: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
});

const attributeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    type: {
        type: String,
        enum: ['single_select', 'multi_select', 'text', 'number'],
        default: 'single_select'
    },
    isRequired: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    values: [attributeValueSchema]
}, { timestamps: true });

module.exports = mongoose.model('AttributeMaster', attributeSchema);
```

---

### 2️⃣ VARIANT MASTER (CORE ENTITY)

```sql
CREATE TABLE variant_master (
    variant_id VARCHAR(36) PRIMARY KEY,
    
    -- Product Grouping
    product_group VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- Variant Specifics
    sku VARCHAR(100) NOT NULL UNIQUE,
    color_id VARCHAR(36),
    
    -- Pricing
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    
    -- Physical
    weight DECIMAL(8, 2),
    length DECIMAL(8, 2),
    width DECIMAL(8, 2),
    height DECIMAL(8, 2),
    
    -- Content
    description TEXT,
    specifications JSON,
    
    -- Status
    status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (color_id) REFERENCES color_master(color_id),
    INDEX idx_product_group (product_group),
    INDEX idx_sku (sku),
    INDEX idx_status (status),
    INDEX idx_brand_category (brand, category)
);
```

**MongoDB Schema:**
```javascript
// models/VariantMaster.js
const variantSchema = new mongoose.Schema({
    // Product Grouping
    productGroup: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    brand: { type: String, index: true },
    category: { type: String, index: true },
    subcategory: String,
    
    // Variant Specifics
    sku: { type: String, required: true, unique: true, index: true },
    color: { type: mongoose.Schema.Types.ObjectId, ref: 'ColorMaster' },
    
    // Pricing
    price: { type: Number, required: true },
    compareAtPrice: Number,
    costPrice: Number,
    
    // Physical
    weight: Number,
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: { type: String, default: 'cm' }
    },
    
    // Content
    description: String,
    specifications: mongoose.Schema.Types.Mixed,
    
    // Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'deleted'],
        default: 'active',
        index: true
    }
}, { timestamps: true });

// Compound indexes for performance
variantSchema.index({ productGroup: 1, status: 1 });
variantSchema.index({ brand: 1, category: 1 });

module.exports = mongoose.model('VariantMaster', variantSchema);
```

---

### 3️⃣ VARIANT CONFIGURATION MAPPING

#### Variant Size Mapping
```sql
CREATE TABLE variant_size_mapping (
    mapping_id VARCHAR(36) PRIMARY KEY,
    variant_id VARCHAR(36) NOT NULL,
    size_id VARCHAR(36) NOT NULL,
    category VARCHAR(50) NOT NULL,
    value VARCHAR(50) NOT NULL,
    FOREIGN KEY (variant_id) REFERENCES variant_master(variant_id) ON DELETE CASCADE,
    FOREIGN KEY (size_id) REFERENCES size_master(size_id),
    UNIQUE KEY unique_variant_size (variant_id, size_id)
);

CREATE INDEX idx_variant_size ON variant_size_mapping(variant_id);
```

**MongoDB Schema:**
```javascript
// Embedded in VariantMaster
sizes: [{
    sizeId: { type: mongoose.Schema.Types.ObjectId, ref: 'SizeMaster' },
    category: String,
    value: String
}]
```

#### Variant Attribute Mapping
```sql
CREATE TABLE variant_attribute_mapping (
    mapping_id VARCHAR(36) PRIMARY KEY,
    variant_id VARCHAR(36) NOT NULL,
    attribute_id VARCHAR(36) NOT NULL,
    value_id VARCHAR(36),
    custom_value TEXT,
    FOREIGN KEY (variant_id) REFERENCES variant_master(variant_id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES attribute_master(attribute_id),
    FOREIGN KEY (value_id) REFERENCES attribute_values(value_id)
);

CREATE INDEX idx_variant_attr ON variant_attribute_mapping(variant_id);
```

**MongoDB Schema:**
```javascript
// Embedded in VariantMaster
attributes: [{
    attributeId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeMaster' },
    valueId: mongoose.Schema.Types.ObjectId,
    customValue: String
}]
```

---

### 4️⃣ IMAGE MANAGEMENT

```sql
CREATE TABLE variant_images (
    image_id VARCHAR(36) PRIMARY KEY,
    variant_id VARCHAR(36) NOT NULL,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    is_primary BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    alt_text VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (variant_id) REFERENCES variant_master(variant_id) ON DELETE CASCADE,
    INDEX idx_variant_images (variant_id),
    INDEX idx_primary (variant_id, is_primary)
);
```

**MongoDB Schema:**
```javascript
// Embedded in VariantMaster
images: [{
    url: { type: String, required: true },
    thumbnailUrl: String,
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    altText: String
}]
```

---

### 5️⃣ INVENTORY SYSTEM

```sql
CREATE TABLE warehouse_master (
    warehouse_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE variant_inventory (
    inventory_id VARCHAR(36) PRIMARY KEY,
    variant_id VARCHAR(36) NOT NULL,
    warehouse_id VARCHAR(36) NOT NULL,
    quantity INT DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    available_quantity INT GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    reorder_level INT DEFAULT 0,
    reorder_quantity INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (variant_id) REFERENCES variant_master(variant_id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse_master(warehouse_id),
    UNIQUE KEY unique_variant_warehouse (variant_id, warehouse_id),
    INDEX idx_variant_inventory (variant_id),
    INDEX idx_warehouse_inventory (warehouse_id)
);

CREATE TABLE inventory_transactions (
    transaction_id VARCHAR(36) PRIMARY KEY,
    inventory_id VARCHAR(36) NOT NULL,
    variant_id VARCHAR(36) NOT NULL,
    warehouse_id VARCHAR(36) NOT NULL,
    transaction_type ENUM('in', 'out', 'reserved', 'released', 'adjustment') NOT NULL,
    quantity INT NOT NULL,
    reference_type VARCHAR(50),
    reference_id VARCHAR(36),
    notes TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES variant_inventory(inventory_id),
    FOREIGN KEY (variant_id) REFERENCES variant_master(variant_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse_master(warehouse_id),
    INDEX idx_variant_transactions (variant_id),
    INDEX idx_transaction_date (created_at)
);
```

**MongoDB Schema:**
```javascript
// models/VariantInventory.js
const inventorySchema = new mongoose.Schema({
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'VariantMaster', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseMaster', required: true },
    quantity: { type: Number, default: 0 },
    reservedQuantity: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    reorderQuantity: { type: Number, default: 0 }
}, { timestamps: true });

inventorySchema.virtual('availableQuantity').get(function() {
    return this.quantity - this.reservedQuantity;
});

inventorySchema.index({ variant: 1, warehouse: 1 }, { unique: true });

// models/InventoryTransaction.js
const transactionSchema = new mongoose.Schema({
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'VariantInventory', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'VariantMaster', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseMaster', required: true },
    transactionType: {
        type: String,
        enum: ['in', 'out', 'reserved', 'released', 'adjustment'],
        required: true
    },
    quantity: { type: Number, required: true },
    referenceType: String,
    referenceId: String,
    notes: String,
    createdBy: String
}, { timestamps: true });

transactionSchema.index({ variant: 1, createdAt: -1 });
```

---

## 🚀 API STRUCTURE (Node.js + Express)

### Backend API Endpoints

```javascript
// routes/variant.routes.js
const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variant.controller');

// Get variants by product group (for PDP)
router.get('/group/:productGroup', variantController.getByProductGroup);

// Get single variant
router.get('/:variantId', variantController.getById);

// Create variant
router.post('/', variantController.create);

// Update variant
router.put('/:variantId', variantController.update);

// Delete variant
router.delete('/:variantId', variantController.delete);

// Get available configurations
router.get('/group/:productGroup/configurations', variantController.getConfigurations);

// Check stock
router.get('/:variantId/stock', variantController.getStock);

module.exports = router;
```

### Controller Implementation

```javascript
// controllers/variant.controller.js
const VariantMaster = require('../models/VariantMaster');
const VariantInventory = require('../models/VariantInventory');

exports.getByProductGroup = async (req, res) => {
    try {
        const { productGroup } = req.params;
        
        const variants = await VariantMaster.find({
            productGroup,
            status: 'active'
        })
        .populate('color')
        .populate('sizes.sizeId')
        .lean();
        
        // Get inventory for all variants
        const variantIds = variants.map(v => v._id);
        const inventory = await VariantInventory.find({
            variant: { $in: variantIds }
        }).lean();
        
        // Map inventory to variants
        const inventoryMap = {};
        inventory.forEach(inv => {
            if (!inventoryMap[inv.variant]) {
                inventoryMap[inv.variant] = 0;
            }
            inventoryMap[inv.variant] += inv.quantity - inv.reservedQuantity;
        });
        
        // Attach stock to variants
        const variantsWithStock = variants.map(v => ({
            ...v,
            totalStock: inventoryMap[v._id] || 0,
            inStock: (inventoryMap[v._id] || 0) > 0
        }));
        
        res.json({
            success: true,
            data: variantsWithStock
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getConfigurations = async (req, res) => {
    try {
        const { productGroup } = req.params;
        
        const variants = await VariantMaster.find({
            productGroup,
            status: 'active'
        })
        .populate('color')
        .populate('sizes.sizeId')
        .lean();
        
        // Extract unique configurations
        const configurations = {
            sizes: {},
            colors: [],
            attributes: {}
        };
        
        variants.forEach(variant => {
            // Group sizes by category
            variant.sizes?.forEach(size => {
                if (!configurations.sizes[size.category]) {
                    configurations.sizes[size.category] = [];
                }
                if (!configurations.sizes[size.category].find(s => s.value === size.value)) {
                    configurations.sizes[size.category].push({
                        id: size.sizeId._id,
                        value: size.value,
                        displayName: size.sizeId.displayName
                    });
                }
            });
            
            // Unique colors
            if (variant.color && !configurations.colors.find(c => c.id === variant.color._id.toString())) {
                configurations.colors.push({
                    id: variant.color._id,
                    name: variant.color.name,
                    hexCode: variant.color.hexCode
                });
            }
        });
        
        res.json({
            success: true,
            data: configurations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.create = async (req, res) => {
    try {
        const variantData = req.body;
        
        // Generate SKU if not provided
        if (!variantData.sku) {
            variantData.sku = await generateSKU(variantData);
        }
        
        const variant = new VariantMaster(variantData);
        await variant.save();
        
        // Initialize inventory for default warehouse
        const defaultWarehouse = await WarehouseMaster.findOne({ isDefault: true });
        if (defaultWarehouse) {
            await VariantInventory.create({
                variant: variant._id,
                warehouse: defaultWarehouse._id,
                quantity: 0,
                reservedQuantity: 0
            });
        }
        
        res.status(201).json({
            success: true,
            data: variant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Helper function
async function generateSKU(variantData) {
    const prefix = variantData.brand?.substring(0, 3).toUpperCase() || 'VAR';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}
```

---

## 🎨 FRONTEND IMPLEMENTATION (React + Tailwind)

### Product Detail Page Component

```jsx
// components/ProductDetailPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductDetailPage = ({ productGroup }) => {
    const [variants, setVariants] = useState([]);
    const [configurations, setConfigurations] = useState(null);
    const [selectedConfig, setSelectedConfig] = useState({});
    const [currentVariant, setCurrentVariant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProductData();
    }, [productGroup]);

    const loadProductData = async () => {
        try {
            const [variantsRes, configRes] = await Promise.all([
                axios.get(`/api/variants/group/${productGroup}`),
                axios.get(`/api/variants/group/${productGroup}/configurations`)
            ]);

            setVariants(variantsRes.data.data);
            setConfigurations(configRes.data.data);

            // Auto-select first available variant
            if (variantsRes.data.data.length > 0) {
                const firstVariant = variantsRes.data.data[0];
                setCurrentVariant(firstVariant);
                
                // Pre-select configurations
                const initialConfig = {};
                firstVariant.sizes?.forEach(size => {
                    initialConfig[size.category] = size.sizeId._id;
                });
                if (firstVariant.color) {
                    initialConfig.color = firstVariant.color._id;
                }
                setSelectedConfig(initialConfig);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading product:', error);
            setLoading(false);
        }
    };

    const handleConfigChange = (type, value) => {
        const newConfig = { ...selectedConfig, [type]: value };
        setSelectedConfig(newConfig);

        // Find matching variant
        const matchingVariant = findMatchingVariant(newConfig);
        if (matchingVariant) {
            setCurrentVariant(matchingVariant);
        }
    };

    const findMatchingVariant = (config) => {
        return variants.find(variant => {
            // Check color match
            if (config.color && variant.color?._id !== config.color) {
                return false;
            }

            // Check all size categories match
            const sizeMatches = variant.sizes?.every(size => {
                return config[size.category] === size.sizeId._id;
            });

            return sizeMatches;
        });
    };

    const getAvailableOptions = (type, value) => {
        // Filter variants that match current selection except for the changing type
        const tempConfig = { ...selectedConfig, [type]: value };
        
        return variants.some(variant => {
            if (type === 'color') {
                if (variant.color?._id !== value) return false;
            } else {
                const sizeMatch = variant.sizes?.find(s => s.category === type);
                if (!sizeMatch || sizeMatch.sizeId._id !== value) return false;
            }

            // Check other selections
            return Object.entries(tempConfig).every(([key, val]) => {
                if (key === type) return true;
                if (key === 'color') {
                    return variant.color?._id === val;
                } else {
                    const size = variant.sizes?.find(s => s.category === key);
                    return size && size.sizeId._id === val;
                }
            });
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!currentVariant) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Product not found</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Image Gallery */}
                <div className="space-y-4">
                    <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                        <img
                            src={currentVariant.images?.find(img => img.isPrimary)?.url || currentVariant.images?.[0]?.url}
                            alt={currentVariant.productName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {currentVariant.images?.map((img, idx) => (
                            <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition">
                                <img src={img.thumbnailUrl || img.url} alt="" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wide">{currentVariant.brand}</p>
                        <h1 className="text-3xl font-bold text-gray-900 mt-2">{currentVariant.productName}</h1>
                        <div className="mt-4 flex items-baseline gap-3">
                            <span className="text-4xl font-bold text-gray-900">₹{currentVariant.price.toLocaleString()}</span>
                            {currentVariant.compareAtPrice && (
                                <span className="text-xl text-gray-500 line-through">₹{currentVariant.compareAtPrice.toLocaleString()}</span>
                            )}
                        </div>
                    </div>

                    {/* SKU and Stock */}
                    <div className="flex items-center gap-4 text-sm">
                        <span className="font-mono text-gray-600">SKU: {currentVariant.sku}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            currentVariant.inStock 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {currentVariant.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                    </div>

                    {/* Size Selectors */}
                    {configurations && Object.entries(configurations.sizes).map(([category, sizes]) => (
                        <div key={category} className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-900 capitalize">
                                {category}
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {sizes.map(size => {
                                    const isAvailable = getAvailableOptions(category, size.id);
                                    const isSelected = selectedConfig[category] === size.id;
                                    
                                    return (
                                        <button
                                            key={size.id}
                                            onClick={() => handleConfigChange(category, size.id)}
                                            disabled={!isAvailable}
                                            className={`
                                                px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all
                                                ${isSelected 
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900' 
                                                    : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                                                }
                                                ${!isAvailable && 'opacity-40 cursor-not-allowed'}
                                            `}
                                        >
                                            {size.displayName}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Color Selector */}
                    {configurations?.colors && configurations.colors.length > 0 && (
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-900">Color</label>
                            <div className="flex gap-3">
                                {configurations.colors.map(color => {
                                    const isAvailable = getAvailableOptions('color', color.id);
                                    const isSelected = selectedConfig.color === color.id;
                                    
                                    return (
                                        <button
                                            key={color.id}
                                            onClick={() => handleConfigChange('color', color.id)}
                                            disabled={!isAvailable}
                                            className={`
                                                relative w-12 h-12 rounded-full border-2 transition-all
                                                ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-300'}
                                                ${!isAvailable && 'opacity-40 cursor-not-allowed'}
                                            `}
                                            title={color.name}
                                        >
                                            <span
                                                className="absolute inset-1 rounded-full"
                                                style={{ backgroundColor: color.hexCode }}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {currentVariant.description && (
                        <div className="pt-6 border-t border-gray-200">
                            <p className="text-gray-700 leading-relaxed">{currentVariant.description}</p>
                        </div>
                    )}

                    {/* Add to Cart */}
                    <button
                        disabled={!currentVariant.inStock}
                        className="w-full bg-indigo-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {currentVariant.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
```

---

## 📋 SAMPLE VARIANT CREATION WORKFLOW

```javascript
// Example: Creating a Samsung Fold 6 variant
const createVariant = async () => {
    // 1. Get or create size masters
    const storage512 = await SizeMaster.findOne({ category: 'storage', value: '512GB' });
    const ram12 = await SizeMaster.findOne({ category: 'ram', value: '12GB' });
    
    // 2. Get or create color
    const blackColor = await ColorMaster.findOne({ name: 'Phantom Black' });
    
    // 3. Create variant
    const variant = await VariantMaster.create({
        productGroup: 'FOLD6_2024',
        productName: 'Samsung Galaxy Z Fold 6',
        brand: 'Samsung',
        category: 'Smartphones',
        subcategory: 'Foldable',
        sku: 'SAM-FOLD6-512-12-BLK',
        color: blackColor._id,
        sizes: [
            { sizeId: storage512._id, category: 'storage', value: '512GB' },
            { sizeId: ram12._id, category: 'ram', value: '12GB' }
        ],
        price: 164999,
        compareAtPrice: 174999,
        costPrice: 140000,
        weight: 239,
        dimensions: { length: 15.5, width: 6.7, height: 0.6, unit: 'cm' },
        description: 'The most powerful foldable phone...',
        specifications: {
            display: '7.6" AMOLED',
            processor: 'Snapdragon 8 Gen 3',
            battery: '4400mAh'
        },
        images: [
            { url: '/images/fold6-black-1.jpg', isPrimary: true, sortOrder: 0 },
            { url: '/images/fold6-black-2.jpg', isPrimary: false, sortOrder: 1 }
        ],
        status: 'active'
    });
    
    // 4. Initialize inventory
    const warehouse = await WarehouseMaster.findOne({ code: 'WH-MAIN' });
    await VariantInventory.create({
        variant: variant._id,
        warehouse: warehouse._id,
        quantity: 50,
        reservedQuantity: 0,
        reorderLevel: 10,
        reorderQuantity: 20
    });
    
    return variant;
};
```

---

## ⚡ PERFORMANCE OPTIMIZATION

### Indexing Strategy

```javascript
// Critical indexes for 10,000+ variants

// 1. Product Group lookup (most common query)
db.variantmaster.createIndex({ productGroup: 1, status: 1 });

// 2. SKU lookup (unique identifier)
db.variantmaster.createIndex({ sku: 1 }, { unique: true });

// 3. Category browsing
db.variantmaster.createIndex({ category: 1, subcategory: 1, status: 1 });

// 4. Brand filtering
db.variantmaster.createIndex({ brand: 1, status: 1 });

// 5. Inventory lookups
db.variantinventory.createIndex({ variant: 1, warehouse: 1 }, { unique: true });

// 6. Transaction history
db.inventorytransactions.createIndex({ variant: 1, createdAt: -1 });
```

### Caching Strategy

```javascript
// services/cache.service.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

exports.getProductGroupVariants = async (productGroup) => {
    const cacheKey = `variants:${productGroup}`;
    
    // Check cache
    let variants = cache.get(cacheKey);
    if (variants) {
        return variants;
    }
    
    // Fetch from DB
    variants = await VariantMaster.find({ productGroup, status: 'active' })
        .populate('color')
        .populate('sizes.sizeId')
        .lean();
    
    // Cache result
    cache.set(cacheKey, variants);
    
    return variants;
};

// Invalidate cache on variant update
exports.invalidateProductGroup = (productGroup) => {
    cache.del(`variants:${productGroup}`);
};
```

---

## 🎯 ADVANTAGES OF THIS ARCHITECTURE

✅ **No Product Table Complexity** - Simpler schema, fewer joins  
✅ **SKU-First** - Every sellable item has unique identifier  
✅ **Flexible Attributes** - Easy to add new configuration types  
✅ **Master Reuse** - Centralized size/color management  
✅ **Scalable** - Optimized for 10,000+ variants  
✅ **Clean API** - Simple endpoints, clear data flow  
✅ **Frontend-Friendly** - Easy to build dynamic selectors  
✅ **Inventory Accurate** - Warehouse-level stock tracking  

---

## 📦 DEPLOYMENT CHECKLIST

- [ ] Set up MongoDB with replica set (for transactions)
- [ ] Create all indexes
- [ ] Seed size and color masters
- [ ] Configure Redis for caching
- [ ] Set up image CDN
- [ ] Implement rate limiting
- [ ] Add API documentation (Swagger)
- [ ] Set up monitoring (New Relic/DataDog)
- [ ] Configure backup strategy
- [ ] Load testing for 10K+ variants

---

**Architecture Version:** 1.0  
**Last Updated:** 2026-02-11  
**Tech Stack:** React + Node.js + MongoDB + Tailwind CSS
