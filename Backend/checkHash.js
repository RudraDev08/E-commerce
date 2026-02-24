import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel';

async function check() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const allVM = await db.collection('variantmasters').find({ configHash: '358f43d7b6abe2ffaca5e233a73f3cbb052f1e6d5188043a98d718666f86ec4d6' }).toArray();
    console.log("Docs with this hash:", allVM.length);
    if (allVM.length > 0) console.log(allVM);
    const count = await db.collection('variantmasters').countDocuments();
    console.log("Total docs in variantmasters: ", count);
    await mongoose.disconnect();
}
check();
