import { MongoClient } from 'mongodb';

async function listAllIndexes() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('AdminPanel');
        const collections = await db.listCollections().toArray();
        for (const col of collections) {
            const indexes = await db.collection(col.name).indexes();
            console.log(`Collection: ${col.name}`);
            console.log(JSON.stringify(indexes, null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
        process.exit(0);
    }
}

listAllIndexes();
