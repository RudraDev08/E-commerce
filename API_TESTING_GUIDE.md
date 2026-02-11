# Variant-First E-commerce API Testing Guide

## 🧪 API ENDPOINTS REFERENCE

Base URL: `http://localhost:5000/api`

---

## 📋 PUBLIC ENDPOINTS (Customer-Facing)

### 1. Get Variants by Product Group

**Endpoint:** `GET /variants/group/:productGroup`

**Description:** Fetch all active variants for a product group with stock information

**Example Request:**
```bash
curl http://localhost:5000/api/variants/group/FOLD6_2024
```

**Example Response:**
```json
{
    "success": true,
    "count": 4,
    "data": [
        {
            "_id": "64a7f3d0e1234567890abcde",
            "productGroup": "FOLD6_2024",
            "productName": "Samsung Galaxy Z Fold 6",
            "brand": "Samsung",
            "category": "Smartphones",
            "sku": "SAM-FOLD6-512GB-12GB-BLK",
            "color": {
                "_id": "64a7f3d0e1234567890abcd1",
                "name": "Phantom Black",
                "hexCode": "#1a1a1a"
            },
            "sizes": [
                {
                    "sizeId": {
                        "_id": "64a7f3d0e1234567890abcd2",
                        "category": "storage",
                        "value": "512GB",
                        "displayName": "512 GB"
                    },
                    "category": "storage",
                    "value": "512GB"
                },
                {
                    "sizeId": {
                        "_id": "64a7f3d0e1234567890abcd3",
                        "category": "ram",
                        "value": "12GB",
                        "displayName": "12 GB RAM"
                    },
                    "category": "ram",
                    "value": "12GB"
                }
            ],
            "price": 164999,
            "compareAtPrice": 174999,
            "images": [
                {
                    "url": "https://example.com/image1.jpg",
                    "isPrimary": true,
                    "sortOrder": 0
                }
            ],
            "totalStock": 150,
            "inStock": true,
            "discountPercentage": 6
        }
    ]
}
```

---

### 2. Get Product Configurations

**Endpoint:** `GET /variants/group/:productGroup/configurations`

**Description:** Get all available configurations (sizes, colors) for a product group

**Example Request:**
```bash
curl http://localhost:5000/api/variants/group/FOLD6_2024/configurations
```

**Example Response:**
```json
{
    "success": true,
    "data": {
        "sizes": {
            "storage": [
                {
                    "id": "64a7f3d0e1234567890abcd2",
                    "value": "256GB",
                    "displayName": "256 GB",
                    "sortOrder": 2
                },
                {
                    "id": "64a7f3d0e1234567890abcd3",
                    "value": "512GB",
                    "displayName": "512 GB",
                    "sortOrder": 3
                }
            ],
            "ram": [
                {
                    "id": "64a7f3d0e1234567890abcd4",
                    "value": "8GB",
                    "displayName": "8 GB RAM",
                    "sortOrder": 2
                },
                {
                    "id": "64a7f3d0e1234567890abcd5",
                    "value": "12GB",
                    "displayName": "12 GB RAM",
                    "sortOrder": 3
                }
            ]
        },
        "colors": [
            {
                "id": "64a7f3d0e1234567890abcd1",
                "name": "Phantom Black",
                "hexCode": "#1a1a1a",
                "category": "solid"
            },
            {
                "id": "64a7f3d0e1234567890abcd6",
                "name": "Phantom Silver",
                "hexCode": "#c0c0c0",
                "category": "metallic"
            }
        ],
        "productInfo": {
            "name": "Samsung Galaxy Z Fold 6",
            "brand": "Samsung",
            "category": "Smartphones",
            "subcategory": "Foldable"
        }
    }
}
```

---

### 3. Get Single Variant

**Endpoint:** `GET /variants/:variantId`

**Description:** Get detailed information about a specific variant

**Example Request:**
```bash
curl http://localhost:5000/api/variants/64a7f3d0e1234567890abcde
```

**Example Response:**
```json
{
    "success": true,
    "data": {
        "_id": "64a7f3d0e1234567890abcde",
        "productGroup": "FOLD6_2024",
        "productName": "Samsung Galaxy Z Fold 6",
        "sku": "SAM-FOLD6-512GB-12GB-BLK",
        "price": 164999,
        "description": "The most powerful foldable phone...",
        "specifications": {
            "display": "7.6\" AMOLED",
            "processor": "Snapdragon 8 Gen 3",
            "battery": "4400mAh"
        },
        "stock": {
            "total": 150,
            "reserved": 5,
            "available": 145
        }
    }
}
```

---

### 4. Get Variant Stock

**Endpoint:** `GET /variants/:variantId/stock`

**Description:** Get warehouse-wise stock breakdown for a variant

**Example Request:**
```bash
curl http://localhost:5000/api/variants/64a7f3d0e1234567890abcde/stock
```

**Example Response:**
```json
{
    "success": true,
    "data": {
        "total": {
            "total": 150,
            "reserved": 5,
            "available": 145
        },
        "warehouses": [
            {
                "warehouse": {
                    "_id": "64a7f3d0e1234567890abc01",
                    "name": "Main Warehouse - Delhi",
                    "code": "WH-DEL"
                },
                "quantity": 50,
                "reserved": 2,
                "available": 48
            },
            {
                "warehouse": {
                    "_id": "64a7f3d0e1234567890abc02",
                    "name": "Mumbai Distribution Center",
                    "code": "WH-MUM"
                },
                "quantity": 100,
                "reserved": 3,
                "available": 97
            }
        ]
    }
}
```

---

## 🔒 ADMIN ENDPOINTS (Protected)

### 5. Create Variant

**Endpoint:** `POST /variants`

**Description:** Create a new variant (admin only)

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/variants \
  -H "Content-Type: application/json" \
  -d '{
    "productGroup": "FOLD6_2024",
    "productName": "Samsung Galaxy Z Fold 6",
    "brand": "Samsung",
    "category": "Smartphones",
    "subcategory": "Foldable",
    "color": "64a7f3d0e1234567890abcd1",
    "sizes": [
        {
            "sizeId": "64a7f3d0e1234567890abcd2",
            "category": "storage",
            "value": "512GB"
        },
        {
            "sizeId": "64a7f3d0e1234567890abcd3",
            "category": "ram",
            "value": "12GB"
        }
    ],
    "price": 164999,
    "compareAtPrice": 174999,
    "description": "Premium foldable smartphone",
    "images": [
        {
            "url": "https://example.com/image1.jpg",
            "isPrimary": true,
            "sortOrder": 0
        }
    ]
}'
```

**Example Response:**
```json
{
    "success": true,
    "message": "Variant created successfully",
    "data": {
        "_id": "64a7f3d0e1234567890abcde",
        "sku": "SAM-FOLD6-512GB-12GB-BLK-A1B",
        "configHash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
        "productGroup": "FOLD6_2024",
        "price": 164999
    }
}
```

---

### 6. Update Variant

**Endpoint:** `PUT /variants/:id`

**Description:** Update variant details (admin only)

**Example Request:**
```bash
curl -X PUT http://localhost:5000/api/variants/64a7f3d0e1234567890abcde \
  -H "Content-Type: application/json" \
  -d '{
    "price": 159999,
    "compareAtPrice": 174999,
    "description": "Updated description"
}'
```

**Example Response:**
```json
{
    "success": true,
    "message": "Variant updated successfully",
    "data": {
        "_id": "64a7f3d0e1234567890abcde",
        "price": 159999,
        "compareAtPrice": 174999
    }
}
```

---

### 7. Delete Variant (Soft Delete)

**Endpoint:** `DELETE /variants/:id`

**Description:** Soft delete a variant (admin only)

**Example Request:**
```bash
curl -X DELETE http://localhost:5000/api/variants/64a7f3d0e1234567890abcde
```

**Example Response:**
```json
{
    "success": true,
    "message": "Variant deleted successfully",
    "data": {
        "_id": "64a7f3d0e1234567890abcde",
        "status": "deleted"
    }
}
```

---

### 8. Adjust Inventory

**Endpoint:** `POST /variants/inventory/adjust`

**Description:** Adjust stock levels (admin only)

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/variants/inventory/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "variantId": "64a7f3d0e1234567890abcde",
    "warehouseId": "64a7f3d0e1234567890abc01",
    "adjustment": 50,
    "transactionType": "in",
    "notes": "New stock received from supplier"
}'
```

**Example Response:**
```json
{
    "success": true,
    "message": "Inventory adjusted successfully",
    "data": {
        "_id": "64a7f3d0e1234567890inv01",
        "variant": "64a7f3d0e1234567890abcde",
        "warehouse": "64a7f3d0e1234567890abc01",
        "quantity": 100,
        "reservedQuantity": 0,
        "availableQuantity": 100
    }
}
```

---

### 9. Add Images to Variant

**Endpoint:** `POST /variants/:id/images`

**Description:** Add images to an existing variant (admin only)

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/variants/64a7f3d0e1234567890abcde/images \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
        {
            "url": "https://example.com/image2.jpg",
            "thumbnailUrl": "https://example.com/thumb2.jpg",
            "isPrimary": false,
            "sortOrder": 1,
            "altText": "Side view"
        }
    ]
}'
```

**Example Response:**
```json
{
    "success": true,
    "message": "Images added successfully",
    "data": {
        "_id": "64a7f3d0e1234567890abcde",
        "images": [
            {
                "url": "https://example.com/image1.jpg",
                "isPrimary": true,
                "sortOrder": 0
            },
            {
                "url": "https://example.com/image2.jpg",
                "isPrimary": false,
                "sortOrder": 1
            }
        ]
    }
}
```

---

## 🧪 POSTMAN COLLECTION

Import this JSON into Postman for easy testing:

```json
{
    "info": {
        "name": "Variant-First E-commerce API",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "Public APIs",
            "item": [
                {
                    "name": "Get Variants by Product Group",
                    "request": {
                        "method": "GET",
                        "header": [],
                        "url": {
                            "raw": "{{baseUrl}}/variants/group/FOLD6_2024",
                            "host": ["{{baseUrl}}"],
                            "path": ["variants", "group", "FOLD6_2024"]
                        }
                    }
                },
                {
                    "name": "Get Configurations",
                    "request": {
                        "method": "GET",
                        "header": [],
                        "url": {
                            "raw": "{{baseUrl}}/variants/group/FOLD6_2024/configurations",
                            "host": ["{{baseUrl}}"],
                            "path": ["variants", "group", "FOLD6_2024", "configurations"]
                        }
                    }
                }
            ]
        },
        {
            "name": "Admin APIs",
            "item": [
                {
                    "name": "Create Variant",
                    "request": {
                        "method": "POST",
                        "header": [
                            {
                                "key": "Content-Type",
                                "value": "application/json"
                            }
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n    \"productGroup\": \"FOLD6_2024\",\n    \"productName\": \"Samsung Galaxy Z Fold 6\",\n    \"brand\": \"Samsung\",\n    \"category\": \"Smartphones\",\n    \"price\": 164999\n}"
                        },
                        "url": {
                            "raw": "{{baseUrl}}/variants",
                            "host": ["{{baseUrl}}"],
                            "path": ["variants"]
                        }
                    }
                }
            ]
        }
    ],
    "variable": [
        {
            "key": "baseUrl",
            "value": "http://localhost:5000/api"
        }
    ]
}
```

---

## 🔍 ERROR RESPONSES

### 400 Bad Request
```json
{
    "success": false,
    "message": "Missing required fields: productGroup, productName, price"
}
```

### 404 Not Found
```json
{
    "success": false,
    "message": "Variant not found"
}
```

### 409 Conflict (Duplicate)
```json
{
    "success": false,
    "message": "Duplicate configHash. This configuration already exists."
}
```

### 500 Internal Server Error
```json
{
    "success": false,
    "message": "Failed to create variant",
    "error": "Detailed error message"
}
```

---

## 📊 TESTING WORKFLOW

1. **Seed Database**
   ```bash
   node Backend/scripts/seedDatabase.js
   ```

2. **Test Public Endpoints**
   ```bash
   # Get all variants for FOLD6_2024
   curl http://localhost:5000/api/variants/group/FOLD6_2024
   
   # Get configurations
   curl http://localhost:5000/api/variants/group/FOLD6_2024/configurations
   ```

3. **Test Admin Endpoints**
   ```bash
   # Create new variant
   curl -X POST http://localhost:5000/api/variants \
     -H "Content-Type: application/json" \
     -d @new-variant.json
   ```

4. **Test Frontend Integration**
   - Open `http://localhost:3000`
   - Navigate to product detail page
   - Test variant selection
   - Verify stock display

---

## ✅ VALIDATION CHECKLIST

- [ ] All variants have unique SKU
- [ ] All variants have unique configHash
- [ ] Duplicate configurations are rejected
- [ ] Stock is calculated correctly across warehouses
- [ ] Images are properly sorted
- [ ] Only one primary image per variant
- [ ] Soft delete works (status = 'deleted')
- [ ] Inventory adjustments create transaction records
- [ ] Configuration extraction is accurate
- [ ] Frontend selectors disable unavailable options

---

**API Version:** 1.0  
**Last Updated:** 2026-02-11  
**Base URL:** `http://localhost:5000/api`
