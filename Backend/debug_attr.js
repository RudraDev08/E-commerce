import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URL);
    const at = await mongoose.connection.db.collection('attributetypes').find({
        name: /color/i,
        isDeleted: { $ne: true }
    }).toArray();
    console.log(JSON.stringify(at, null, 2));
    await mongoose.disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
