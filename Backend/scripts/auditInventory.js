import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
await mongoose.connect(uri);
const db = mongoose.connection.db;

const totalVariants = await db.collection('variantmasters').countDocuments();
const activeVariants = await db.collection('variantmasters').countDocuments({ isDeleted: { $ne: true } });
const totalInventory = await db.collection('inventorymasters').countDocuments();

const variants = await db.collection('variantmasters').find({}, { projection: { _id: 1, sku: 1, status: 1, isDeleted: 1 } }).toArray();
const inventoryDocs = await db.collection('inventorymasters').find({}, { projection: { variantId: 1 } }).toArray();
const inventorySet = new Set(inventoryDocs.map(i => i.variantId?.toString()));
const orphans = variants.filter(v => !inventorySet.has(v._id.toString()));

console.log('=== DB AUDIT ===');
console.log('Total variantmasters:', totalVariants);
console.log('Non-deleted variants:', activeVariants);
console.log('Total inventorymasters:', totalInventory);
console.log('Orphaned variants (no inventory):', orphans.length);
orphans.slice(0, 10).forEach(v => console.log('  Orphan:', v._id, v.sku, v.status, 'deleted:', v.isDeleted));

await mongoose.disconnect();
