import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getVariants } from './controllers/variant/productVariantController.js';
dotenv.config();
async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel');
    const req = { query: { productId: "698c16f46d627036d3cb56f7" } };
    const res = {
        status: (s) => ({ json: (j) => console.log('STATUS:', s, 'JSON:', JSON.stringify(j, null, 2)) }),
        json: (j) => console.log('JSON:', JSON.stringify(j, null, 2))
    };
    await getVariants(req, res);
    await mongoose.disconnect();
}
check();
