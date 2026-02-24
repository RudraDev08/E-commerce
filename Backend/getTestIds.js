import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel';

async function getTestIds() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const product = await db.collection('products').findOne({}, { projection: { _id: 1, name: 1 } });
    const color = await db.collection('colors').findOne({ status: 'active' }, { projection: { _id: 1, name: 1 } });
    console.log("PRODUCT_ID=" + product._id);
    console.log("COLOR_ID=" + color._id);
    await mongoose.disconnect();
}
getTestIds();
