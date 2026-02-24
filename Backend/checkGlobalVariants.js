import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel';

async function check() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const allVM = await db.collection('variantmasters').find({}).toArray();
    console.log(JSON.stringify(allVM, null, 2));
    await mongoose.disconnect();
}
check();
