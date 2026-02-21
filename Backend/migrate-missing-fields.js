import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AdminPanel').then(async () => {
    const db = mongoose.connection.db;

    const validFamilies = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'BLACK', 'WHITE', 'GREY', 'BROWN', 'PINK', 'BEIGE'];

    // Find documents with invalid colorFamily
    const colors = await db.collection('colormasters').find({
        colorFamily: { $nin: validFamilies }
    }).toArray();

    console.log(`Found ${colors.length} records with invalid colorFamily in 'colormasters'`);

    for (const color of colors) {
        await db.collection('colormasters').updateOne(
            { _id: color._id },
            { $set: { colorFamily: 'GREY' } }
        );
        console.log(`Migrated colormasters ${color._id}`);
    }

    const colors2 = await db.collection('colors').find({
        colorFamily: { $nin: validFamilies }
    }).toArray();

    console.log(`Found ${colors2.length} records with invalid colorFamily in 'colors'`);

    for (const color of colors2) {
        await db.collection('colors').updateOne(
            { _id: color._id },
            { $set: { colorFamily: 'GREY' } }
        );
        console.log(`Migrated colors ${color._id}`);
    }

    console.log('Migration complete!');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
