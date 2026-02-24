import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URL);
    const res = await mongoose.connection.db.collection('attributetypes').updateMany(
        { name: { $in: [/ram/i, /storage/i] } },
        { $set: { createsVariant: true } }
    );
    console.log('Update Result:', res);
    await mongoose.disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
