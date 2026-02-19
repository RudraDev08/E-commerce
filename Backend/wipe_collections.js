import mongoose from 'mongoose';

async function wipeSizes() {
    const uri = 'mongodb://localhost:27017/AdminPanel';
    try {
        await mongoose.connect(uri);
        console.log('Connected to DB');

        console.log('Dropping collection: sizes');
        try {
            await mongoose.connection.db.dropCollection('sizes');
            console.log('✅ Collection sizes dropped');
        } catch (e) {
            console.log('Collection sizes might not exist or already dropped:', e.message);
        }

        console.log('Dropping collection: colormasters');
        try {
            await mongoose.connection.db.dropCollection('colormasters');
            console.log('✅ Collection colormasters dropped');
        } catch (e) {
            console.log('Collection colormasters might not exist or already dropped:', e.message);
        }

    } catch (err) {
        console.error('❌ Failed:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

wipeSizes();
