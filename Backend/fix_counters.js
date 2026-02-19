import mongoose from 'mongoose';

async function fixCounters() {
    const uri = 'mongodb://localhost:27017/AdminPanel';
    try {
        await mongoose.connect(uri);
        console.log('Connected to DB');

        console.log('Dropping index name_1 on counters collection');
        try {
            await mongoose.connection.db.collection('counters').dropIndex('name_1');
            console.log('✅ Index name_1 dropped');
        } catch (e) {
            console.log('Index name_1 might not exist or already dropped:', e.message);
        }

    } catch (err) {
        console.error('❌ Failed:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

fixCounters();
