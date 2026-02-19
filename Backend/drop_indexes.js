import mongoose from 'mongoose';

async function dropIndexes() {
    const uri = 'mongodb://localhost:27017/AdminPanel';
    try {
        await mongoose.connect(uri);
        console.log('Dropping indexes on sizes collection...');
        await mongoose.connection.db.collection('sizes').dropIndexes();
        console.log('✅ All indexes dropped (except _id)');
    } catch (err) {
        console.error('❌ Failed:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

dropIndexes();
