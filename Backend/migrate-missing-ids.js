import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AdminPanel').then(async () => {
    const db = mongoose.connection.db;

    // Check 'colors' collection
    const colors = await db.collection('colors').find({ canonicalId: { $exists: false } }).toArray();
    console.log(`Found ${colors.length} records missing canonicalId in 'colors' collection`);

    for (const color of colors) {
        const familyCode = (color.colorFamily || 'GEN').substring(0, 3).toUpperCase();
        const hexSuffix = (color.hexCode || '#000000').replace('#', '').substring(0, 6);
        const newId = `COLOR-${familyCode}-${hexSuffix}-${Date.now().toString().slice(-4)}`;

        await db.collection('colors').updateOne(
            { _id: color._id },
            { $set: { canonicalId: newId, code: newId } }
        );
        console.log(`Migrated ${color._id} with canonicalId: ${newId}`);
    }

    console.log('Migration complete!');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
