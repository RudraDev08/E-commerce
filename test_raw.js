import mongoose from 'mongoose';

async function testRaw() {
    const uri = 'mongodb://localhost:27017/AdminPanel';
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('State:', mongoose.connection.readyState);

        console.log('Testing Raw update...');
        const res = await mongoose.connection.db.collection('counters').findOneAndUpdate(
            { _id: 'test_raw' },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' }
        );
        console.log('✅ Raw result:', res);
    } catch (err) {
        console.error('❌ Failed:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

testRaw();
