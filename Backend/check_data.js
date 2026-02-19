import mongoose from 'mongoose';

async function checkData() {
    const uri = 'mongodb://localhost:27017/AdminPanel';
    try {
        await mongoose.connect(uri);
        const coll = mongoose.connection.db.collection('sizes');
        const count = await coll.countDocuments();
        console.log(`Documents in 'sizes': ${count}`);
        const docs = await coll.find({}).limit(5).toArray();
        console.log('Sample docs:', JSON.stringify(docs, null, 2));

        const indexes = await coll.indexes();
        console.log('Indexes:', JSON.stringify(indexes, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

checkData();
