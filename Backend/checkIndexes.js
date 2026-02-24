import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
    const indexes = await mongoose.connection.db.collection('variantmasters').indexes();
    console.log(JSON.stringify(indexes, null, 2));
    await mongoose.disconnect();
}
check();
