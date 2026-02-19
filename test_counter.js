import mongoose from 'mongoose';
import Counter from './Backend/models/Counter.js';

async function testCounter() {
    const uri = 'mongodb://localhost:27017/AdminPanel';
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Connected');

        console.log('Testing Counter update...');
        const counter = await Counter.findByIdAndUpdate(
            'test_id',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        console.log('✅ Counter result:', counter);
    } catch (err) {
        console.error('❌ Failed:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

testCounter();
