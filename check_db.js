import mongoose from 'mongoose';

async function checkConn() {
    const uri = 'mongodb://localhost:27017/AdminPanel';
    console.log('Testing connection to:', uri);
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
        console.log('✅ Connection successful');
        const admin = mongoose.connection.db.admin();
        const info = await admin.listDatabases();
        console.log('Databases:', info.databases.map(d => d.name));
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

checkConn();
