import mongoose from 'mongoose';
import Variant from '../models/Variant.model.js';
import InventoryLedger from '../models/inventory/InventoryLedger.model.js';

const MONGO_URI = 'mongodb://localhost:27017/zeno-panel';

async function checkInventory() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check Variants
        console.log('='.repeat(60));
        console.log('📦 CHECKING VARIANTS');
        console.log('='.repeat(60));

        const totalVariants = await Variant.countDocuments();
        const activeVariants = await Variant.countDocuments({ isDeleted: false });
        const deletedVariants = await Variant.countDocuments({ isDeleted: true });

        console.log(`Total Variants: ${totalVariants}`);
        console.log(`Active Variants: ${activeVariants}`);
        console.log(`Deleted Variants: ${deletedVariants}\n`);

        if (activeVariants > 0) {
            console.log('Active Variant Details:');
            console.log('-'.repeat(60));
            const variants = await Variant.find({ isDeleted: false })
                .populate('productId', 'name')
                .limit(20);

            variants.forEach((v, idx) => {
                console.log(`\n${idx + 1}. Variant ID: ${v._id}`);
                console.log(`   SKU: ${v.sku}`);
                console.log(`   Product: ${v.productId?.name || 'N/A'}`);
                console.log(`   Attributes: ${JSON.stringify(v.attributes)}`);
                console.log(`   Stock: ${v.stock || 0}`);
                console.log(`   Price: ₹${v.price || 0}`);
            });
        }

        // Check Inventory Ledger
        console.log('\n\n' + '='.repeat(60));
        console.log('📊 CHECKING INVENTORY LEDGER');
        console.log('='.repeat(60));

        const totalLedgerEntries = await InventoryLedger.countDocuments();
        console.log(`Total Ledger Entries: ${totalLedgerEntries}\n`);

        if (totalLedgerEntries > 0) {
            console.log('Recent Ledger Entries:');
            console.log('-'.repeat(60));
            const ledgerEntries = await InventoryLedger.find()
                .sort({ transactionDate: -1 })
                .limit(10);

            ledgerEntries.forEach((entry, idx) => {
                console.log(`\n${idx + 1}. Transaction Type: ${entry.transactionType}`);
                console.log(`   Variant ID: ${entry.variantId}`);
                console.log(`   SKU: ${entry.sku}`);
                console.log(`   Quantity: ${entry.quantity}`);
                console.log(`   Reason: ${entry.reason}`);
                console.log(`   Before: ${JSON.stringify(entry.stockBefore)}`);
                console.log(`   After: ${JSON.stringify(entry.stockAfter)}`);
                console.log(`   Date: ${entry.transactionDate}`);
            });
        } else {
            console.log('⚠️  No inventory ledger entries found!');
            console.log('   This means no stock movements have been recorded.');
        }

        // Stock Summary
        console.log('\n\n' + '='.repeat(60));
        console.log('📈 STOCK SUMMARY');
        console.log('='.repeat(60));

        const stockStats = await Variant.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    totalStock: { $sum: '$stock' },
                    avgStock: { $avg: '$stock' },
                    maxStock: { $max: '$stock' },
                    minStock: { $min: '$stock' },
                    zeroStockCount: {
                        $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
                    },
                    lowStockCount: {
                        $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', 10] }] }, 1, 0] }
                    },
                    inStockCount: {
                        $sum: { $cond: [{ $gt: ['$stock', 10] }, 1, 0] }
                    }
                }
            }
        ]);

        if (stockStats.length > 0) {
            const stats = stockStats[0];
            console.log(`Total Stock Across All Variants: ${stats.totalStock || 0}`);
            console.log(`Average Stock per Variant: ${Math.round(stats.avgStock || 0)}`);
            console.log(`Maximum Stock: ${stats.maxStock || 0}`);
            console.log(`Minimum Stock: ${stats.minStock || 0}`);
            console.log(`\nStock Status:`);
            console.log(`  Out of Stock (0): ${stats.zeroStockCount || 0} variants`);
            console.log(`  Low Stock (1-10): ${stats.lowStockCount || 0} variants`);
            console.log(`  In Stock (>10): ${stats.inStockCount || 0} variants`);
        }

        // Recommendations
        console.log('\n\n' + '='.repeat(60));
        console.log('💡 RECOMMENDATIONS');
        console.log('='.repeat(60));

        if (activeVariants === 0) {
            console.log('❌ No variants found! You need to:');
            console.log('   1. Create products in Product Master');
            console.log('   2. Create variants in Variant Builder');
        } else if (totalLedgerEntries === 0) {
            console.log('⚠️  Variants exist but no inventory ledger entries!');
            console.log('   This means:');
            console.log('   - Stock updates are not being tracked');
            console.log('   - No audit trail exists');
            console.log('   - You should update stock through Inventory Management');
        } else {
            console.log('✅ Inventory system is operational!');
            console.log(`   - ${activeVariants} active variants`);
            console.log(`   - ${totalLedgerEntries} ledger entries`);
            console.log('   - Stock movements are being tracked');
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Inventory check complete!');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Error checking inventory:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

checkInventory();
