import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VariantMaster from './models/masters/VariantMaster.enterprise.js';
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
    const q1 = { productGroupId: new mongoose.Types.ObjectId("698c16f46d627036d3cb56f7") };
    const q2 = { ...q1, isDeleted: { $ne: true } };

    const count1 = await VariantMaster.countDocuments(q1);
    const count2 = await VariantMaster.countDocuments(q2);

    console.log("Without isDeleted:", count1);
    console.log("With isDeleted:", count2);

    const doc = await VariantMaster.findOne(q1).lean();
    console.log("Document fields:", Object.keys(doc || {}));
    if (doc) console.log("isDeleted:", doc.isDeleted);

    await mongoose.disconnect();
}
check();
