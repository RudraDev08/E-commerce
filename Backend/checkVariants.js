import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel';

async function check() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const countP = await db.collection('productvariants').countDocuments({ product: new mongoose.Types.ObjectId("698c16f46d627036d3cb56f7") });
    const docsV = await db.collection('variantmasters').find({ productGroupId: new mongoose.Types.ObjectId("698c16f46d627036d3cb56f7") }).toArray();
    console.log("productvariants count:", countP);
    console.log("variantmasters count:", docsV.length);
    console.log("variantmasters status:", docsV.map(v => v.status));
    console.log("variantmasters configHash:", docsV.map(v => v.configHash));
    await mongoose.disconnect();
}
check();
