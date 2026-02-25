import mongoose from 'mongoose';
const MONGO_URI = 'mongodb://localhost:27017/AdminPanel';

async function inspect() {
    await mongoose.connect(MONGO_URI);

    // Check variantmasters
    const variantCollection = mongoose.connection.db.collection('variantmasters');
    const inventoryCollection = mongoose.connection.db.collection('inventorymasters');
    const ledgerCollection = mongoose.connection.db.collection('inventoryledgers');

    const variant = await variantCollection.findOne({ isDeleted: { $ne: true } });
    if (!variant) {
        console.log('No active variants found in variantmasters.');
        process.exit(0);
    }

    const variantId = variant._id;
    const productGroupId = variant.productGroup || variant.productId || variant.productGroupId;

    console.log(`Target Variant ID: ${variantId}`);
    console.log(`SKU: ${variant.sku}`);
    console.log(`Product Group ID: ${productGroupId}`);

    // STEP 1 — VERIFY VARIANT COUNT
    const variantCount = await variantCollection.countDocuments({
        $or: [
            { productGroup: productGroupId },
            { productId: productGroupId },
            { productGroupId: productGroupId }
        ],
        isDeleted: { $ne: true }
    });
    console.log(`\nSTEP 1 - Variant Count for this product: ${variantCount}`);

    // STEP 2 — CHECK INVENTORY DOCUMENT COUNT
    const inventoryDocCount = await inventoryCollection.countDocuments({ variantId: variantId });
    console.log(`STEP 2 - Inventory Document Count for this variant: ${inventoryDocCount}`);

    // STEP 3 — CHECK STOCK NUMBERS
    const inventoryDocs = await inventoryCollection.find({ variantId: variantId }).toArray();
    console.log('\nSTEP 3 - Stock Numbers:');
    let sumTotal = 0;
    let sumReserved = 0;
    inventoryDocs.forEach((doc, i) => {
        console.log(`Document ${i + 1} (${doc._id}):`);
        console.log(`  sku: ${doc.sku}`);
        console.log(`  totalStock: ${doc.totalStock}`);
        console.log(`  reservedStock: ${doc.reservedStock}`);
        console.log(`  availableStock: ${doc.availableStock}`);
        sumTotal += (doc.totalStock || 0);
        sumReserved += (doc.reservedStock || 0);
    });
    console.log(`\nSum of totalStock across all docs: ${sumTotal}`);

    // STEP 4 — CHECK WAREHOUSE SPLIT
    console.log('\nSTEP 4 - Warehouse Split Details:');
    inventoryDocs.forEach((doc, i) => {
        console.log(`Doc ${i + 1}:`);
        console.log(`  warehouseId: ${doc.warehouseId || 'N/A'}`);
        console.log(`  warehouseLocation: ${doc.warehouseLocation || 'N/A'}`);
        console.log(`  locations array length: ${doc.locations ? doc.locations.length : 0}`);
    });

    // STEP 5 — CHECK LEDGER ENTRIES
    const ledgerCount = await ledgerCollection.countDocuments({ variantId: variantId });
    console.log(`\nSTEP 5 - Ledger Entry Count: ${ledgerCount}`);

    // STEP 6 - Any duplicates?
    const allInventory = await inventoryCollection.find().toArray();
    const variantIdsInInventory = allInventory.map(i => i.variantId.toString());
    const uniqueVariantIds = [...new Set(variantIdsInInventory)];
    console.log(`\nUnique Variant IDs in Inventory: ${uniqueVariantIds.length}`);
    console.log(`Total Inventory Documents: ${allInventory.length}`);

    process.exit(0);
}

inspect().catch(err => {
    console.error(err);
    process.exit(1);
});
