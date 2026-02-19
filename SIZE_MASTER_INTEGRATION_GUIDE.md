# Size Master Integration Guide

## 1. Variant Association (Decrement/Increment)

When associating a size to a variant, you **MUST** update the usage count on the Size Master to ensure deletion protection works.

### Example: `VariantService.js`

```javascript
import SizeMaster from '../models/masters/SizeMaster.enterprise.js';
import VariantMaster from '../models/masters/VariantMaster.enterprise.js';
import mongoose from 'mongoose';

export const createVariant = async (variantData) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Create Variant
        const variant = new VariantMaster(variantData);
        await variant.save({ session });

        // 2. Increment Usage Count for the Size
        // Assuming variantData.sizeId is the reference
        if (variantData.sizeId) {
            await SizeMaster.incrementUsage(variantData.sizeId);
        }

        await session.commitTransaction();
        return variant;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

export const deleteVariant = async (variantId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const variant = await VariantMaster.findById(variantId).session(session);
        if (!variant) throw new Error('Variant not found');

        // 1. Decrement Usage Count
        if (variant.sizeId) {
            await SizeMaster.decrementUsage(variant.sizeId);
        }

        // 2. Archive Variant
        variant.lifecycleState = 'ARCHIVED';
        await variant.save({ session });

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
```

## 2. Text Search Optimization

The controller now uses `$text` search. Ensure you have run:

```javascript
db.sizes.createIndex({ value: "text", displayName: "text", canonicalId: "text" })
```

(The model definition handles this automatically on app startup, but good to verify).

## 3. Cursor Pagination

The API now strictly requires base64 cursors for pagination.

**Request format:**
`GET /api/sizes?cursor=ey...&sort=createdAt`

**Descending Logic:**
If sorting by `createdAt` (descending), the next page will fetch items OLDER than the cursor.
