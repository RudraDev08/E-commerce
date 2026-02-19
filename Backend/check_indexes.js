import mongoose from 'mongoose';

async function checkIndexes() {
    const uri = 'mongodb://localhost:27017/AdminPanel';
    try {
        await mongoose.connect(uri);
        const indexes = await mongoose.connection.db.collection('sizes').indexes();
        console.log(JSON.stringify(indexes, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

checkIndexes();
