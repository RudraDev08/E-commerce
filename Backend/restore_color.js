import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URL);
    const res = await mongoose.connection.db.collection('attributetypes').updateOne(
        { _id: new mongoose.Types.ObjectId('6984d6b237975efce7ce9324') },
        { $set: { isDeleted: false, status: 'active', createsVariant: true } }
    );
    console.log('Update Result:', res);
    await mongoose.disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
