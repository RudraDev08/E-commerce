import mongoose from 'mongoose';

async function verifyDrop() {
    const uri = 'mongodb://localhost:27017/AdminPanel';
    try {
        await mongoose.connect(uri);
        const coll = mongoose.connection.db.collection('sizes');
        console.log('Indexes before drop:', (await coll.indexes()).map(i => i.name));
        await coll.dropIndexes();
        console.log('✅ Dropped.');
        console.log('Indexes after drop:', (await coll.indexes()).map(i => i.name));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

verifyDrop();
