import mongoose from 'mongoose';

async function listColls() {
    const uri = 'mongodb://localhost:27017/AdminPanel';
    try {
        await mongoose.connect(uri);
        const colls = await mongoose.connection.db.listCollections().toArray();
        console.log(colls.map(c => c.name));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

listColls();
