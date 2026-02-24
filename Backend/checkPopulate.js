import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VariantMaster from './models/masters/VariantMaster.enterprise.js';
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
    const objectId = new mongoose.Types.ObjectId("698c16f46d627036d3cb56f7");
    const query = { productGroupId: objectId, isDeleted: { $ne: true } };

    try {
        const variants = await VariantMaster.find(query)
            .populate('colorId', 'name displayName hexCode rgbCode colorFamily')
            .populate('sizes.sizeId', 'value displayName category')
            .populate({
                path: 'attributeValueIds',
                select: 'name displayName code attributeType',
                populate: {
                    path: 'attributeType',
                    select: 'name displayName _id',
                    model: 'AttributeType'
                }
            })
            .lean();
        console.log("Variants found:", variants.length);
        console.log("Variant id:", variants[0]?._id);
    } catch (e) {
        console.log("ERROR populated:", e);
    }

    await mongoose.disconnect();
}
check();
