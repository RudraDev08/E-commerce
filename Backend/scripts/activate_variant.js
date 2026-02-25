import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/AdminPanel';

async function fixStatus() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const variantColl = db.collection('variantmasters');

    const result = await variantColl.updateOne(
        { _id: new mongoose.Types.ObjectId('699ebfc5f261904041b4d5b9') },
        { $set: { status: 'ACTIVE' } }
    );

    console.log('Update result:', result.modifiedCount);
    process.exit(0);
}

fixStatus();
