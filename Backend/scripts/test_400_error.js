import mongoose from 'mongoose';
const MONGO_URI = 'mongodb://localhost:27017/AdminPanel';

async function test() {
    await mongoose.connect(MONGO_URI);
    const variantId = '699ebfc5f261904041b4d5b9';

    console.log('Testing mongoose.Types.ObjectId(variantId)...');
    try {
        const id = mongoose.Types.ObjectId(variantId);
        console.log('Result type:', typeof id);
        console.log('Result value:', id);
        console.log('Is valid:', mongoose.Types.ObjectId.isValid(id));
    } catch (e) {
        console.log('Calling without new FAILED:', e.message);
    }

    console.log('\nTesting aggregate with match...');
    const coll = mongoose.connection.db.collection('inventorymasters');
    try {
        const result = await coll.aggregate([
            { $match: { variantId: mongoose.Types.ObjectId(variantId) } }
        ]).toArray();
        console.log('Aggregate success, result count:', result.length);
    } catch (e) {
        console.log('Aggregate FAILED:', e.message);
    }

    process.exit(0);
}

test();
