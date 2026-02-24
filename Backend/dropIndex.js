import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
    try {
        await mongoose.connection.db.collection('variantmasters').dropIndex('canonicalId_1');
        console.log("Index dropped");
    } catch (e) {
        console.log(e.message);
    }
    await mongoose.disconnect();
}
check();
