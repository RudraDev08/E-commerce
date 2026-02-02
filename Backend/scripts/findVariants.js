// Quick script to check which database has your variants
import mongoose from 'mongoose';

const checkDatabases = async () => {
    try {
        // Connect to MongoDB server (not specific database)
        await mongoose.connect('mongodb://localhost:27017/');

        const admin = mongoose.connection.db.admin();
        const { databases } = await admin.listDatabases();

        console.log('\n📊 CHECKING ALL DATABASES FOR VARIANTS\n');
        console.log('='.repeat(80));

        for (const dbInfo of databases) {
            const dbName = dbInfo.name;

            // Skip system databases
            if (['admin', 'config', 'local'].includes(dbName)) continue;

            try {
                const db = mongoose.connection.client.db(dbName);
                const collections = await db.listCollections().toArray();
                const collectionNames = collections.map(c => c.name);

                // Check for variant-related collections
                const hasVariants = collectionNames.some(name =>
                    name.toLowerCase().includes('variant')
                );

                if (hasVariants) {
                    console.log(`\n🔍 Database: ${dbName}`);
                    console.log('-'.repeat(80));

                    // Count variants
                    const variantCollections = collectionNames.filter(name =>
                        name.toLowerCase().includes('variant')
                    );

                    for (const collName of variantCollections) {
                        const count = await db.collection(collName).countDocuments();
                        console.log(`   ${collName}: ${count} documents`);

                        if (count > 0) {
                            const sample = await db.collection(collName).findOne();
                            console.log(`   Sample SKU: ${sample?.sku || 'N/A'}`);
                        }
                    }

                    // Check for inventory
                    const inventoryCollections = collectionNames.filter(name =>
                        name.toLowerCase().includes('inventory')
                    );

                    if (inventoryCollections.length > 0) {
                        console.log('\n   Inventory Collections:');
                        for (const collName of inventoryCollections) {
                            const count = await db.collection(collName).countDocuments();
                            console.log(`   ${collName}: ${count} documents`);
                        }
                    }
                }
            } catch (err) {
                console.log(`   Error checking ${dbName}: ${err.message}`);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n✅ Check complete!\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

checkDatabases();
