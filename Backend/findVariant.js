import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel';
async function findVariant() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const v = await db.collection('variantmasters').findOne({});
    console.log("Variant Sample:", JSON.stringify(v, null, 2));
    await mongoose.disconnect();
}
findVariant();
