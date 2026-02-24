import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel';

async function check() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const color = await db.collection('colors').findOne({ _id: new mongoose.Types.ObjectId("69772f8a97b9a60be9d74c42") });
    console.log("Color status:", color?.status, "| lifecycleState:", color?.lifecycleState, "| isDeleted:", color?.isDeleted);
    await mongoose.disconnect();
}
check();
