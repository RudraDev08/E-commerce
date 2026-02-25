import mongoose from 'mongoose';
import fs from 'fs';

const MONGO_URI = 'mongodb://localhost:27017/AdminPanel';

async function remediate() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const invMasterColl = db.collection('inventorymasters');
    const invLedgerColl = db.collection('inventoryledgers');
    const variantColl = db.collection('variantmasters');

    // 1. BACKUP
    const orphanedMasters = await invMasterColl.find({}).toArray();
    const orphanedLedgers = await invLedgerColl.find({}).toArray();

    fs.writeFileSync('orphaned_inventory_backup.json', JSON.stringify({
        masters: orphanedMasters,
        ledgers: orphanedLedgers,
        timestamp: new Date().toISOString()
    }, null, 2));
    console.log(`Backed up ${orphanedMasters.length} masters and ${orphanedLedgers.length} ledgers.`);

    // 2. CLEANUP
    const masterDeleteResult = await invMasterColl.deleteMany({});
    const ledgerDeleteResult = await invLedgerColl.deleteMany({});
    console.log(`Deleted ${masterDeleteResult.deletedCount} orphaned inventory records.`);
    console.log(`Deleted ${ledgerDeleteResult.deletedCount} orphaned ledger entries.`);

    // 3. INITIALIZE ACTIVE VARIANT INVENTORY
    const activeVariant = await variantColl.findOne({ _id: new mongoose.Types.ObjectId('699ebfc5f261904041b4d5b9') });

    if (activeVariant) {
        console.log('Found active variant:', activeVariant.sku);

        const newInventory = {
            variantId: activeVariant._id,
            productId: activeVariant.productGroupId,
            sku: activeVariant.sku,
            totalStock: 50, // Setting to 50 as a default restock for testing
            reservedStock: 0,
            availableStock: 50,
            lowStockThreshold: 5,
            warehouseLocation: 'Default',
            status: 'IN_STOCK',
            locations: [{
                warehouseId: new mongoose.Types.ObjectId('698c16056d627036d3cb5730'), // Default WH from diagnostics
                stock: 50,
                lastUpdated: new Date()
            }],
            lastUpdated: new Date(),
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const insertResult = await invMasterColl.insertOne(newInventory);
        console.log('Created new inventory document with ID:', insertResult.insertedId);

        // 4. CREATE INITIAL LEDGER ENTRY
        const newLedger = {
            variantId: activeVariant._id,
            productId: activeVariant.productGroupId,
            sku: activeVariant.sku,
            transactionType: 'STOCK_IN',
            quantity: 50,
            stockBefore: { total: 0, reserved: 0, available: 0 },
            stockAfter: { total: 50, reserved: 0, available: 50 },
            reason: 'INITIAL_STOCK_REMEDIATION',
            notes: 'System remediation of orphaned inventory',
            performedBy: 'REMEDIATION_SCRIPT',
            transactionDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await invLedgerColl.insertOne(newLedger);
        console.log('Created initial ledger entry.');
    } else {
        console.error('Active variant 699ebfc5f261904041b4d5b9 not found!');
    }

    process.exit(0);
}

remediate().catch(err => {
    console.error('Remediation FAILED:', err);
    process.exit(1);
});
