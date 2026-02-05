# Product System Rollback & Recovery Strategy

This document outlines the standard operating procedures for recovering from data errors, accidentally deleted items, and version conflicts in the Product Management System.

## 1. Soft Delete & Restore

The system implements a "Trash" mechanism (Soft Delete) for Products, Variants, Categories, and Brands.

### Recovery from Accidental Deletion
**Scenario**: An admin accidentally deletes a product.
**Solution**:
1. Navigate to the **Product List**.
2. Filter status by **"Archived/Trash"** (or toggle "Show Deleted").
3. Select the product(s).
4. Click **"Restore"**.

**API Endpoint**: 
`PATCH /api/products/:id/restore`

**Impact**:
- Product is returned to `draft` or previous status.
- Product is removed from the "Deleted" index.
- SKU/Slug conflicts are checked during restore.

## 2. Optimistic Concurrency & Overwrites

To prevent multiple admins from overwriting each other's work, the system uses **Optimistic Locking**.

### Handling Version Conflicts
**Scenario**: Admin A opens a product. Admin B opens the same product, makes changes, and saves. Admin A tries to save afterwards.
**Error**: `409 Conflict: Product has been modified by another user.`

**Solution**:
1. The UI will notify Admin A.
2. Admin A must **refresh the page** to load the latest version (Admin B's changes).
3. Admin A re-applies their changes and saves.

**Mechanism**:
- Every product has a `version` field (incrementing number).
- Updates must send the `version` they started with.
- If `DB.version !== Request.version`, the update is rejected.

## 3. Bulk Operation Rollback

**Scenario**: A bulk upload CSV contained incorrect pricing for 500 items.

**Strategy**:
Currently, we do not support "Undo" for bulk operations. Recovery must be performed using a **Reversal Update**.

**Procedure**:
1. Identify the list of affected SKUs (from the Upload Log).
2. Prepare a **Correction CSV** with the correct values.
3. Perform a **Bulk Update** using the correction CSV.

**Prevention**:
- Always use **"Draft"** status for bulk imports.
- Review a sample set before publishing.

## 4. Database Point-in-Time Recovery (Disaster Recovery)

**Scenario**: Catastrophic data corruption.

**Procedure** (Managed by DevOps):
1. Stop the API writes (Maintenance Mode).
2. Restore MongoDB from the latest **Hourly Snapshot**.
3. Replay valid Audit Logs (if available) to catch up.

### Backup Schedule
- **Full Backup**: Daily (02:00 UTC)
- **Incremental**: Hourly
- **Retention**: 30 Days

## 5. Pricing Error Recovery

**Scenario**: A product was listed at ₹10 instead of ₹1000.

**Immediate Action**:
1. **Unpublish** the product immediately via Admin Panel or API.
   `PATCH /api/products/:id/unpublish`
2. Cancel pending orders containing this product (Order Management System).
   - Use "Pricing Error" as cancellation reason.
   - Refund customers automatically.
3. Correct the price and re-publish.

## 6. Audit Logs

All critical actions are logged. Use `ActivityLog` to investigate who changed what and when.

- **Collection**: `activity_logs`
- **Actions Logged**: Create, Update, Delete, Publish, Bulk Import.
- **Data**: User ID, IP, Old Value, New Value (for sensitive fields).
