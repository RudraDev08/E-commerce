import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URL);

    const categoryId = new mongoose.Types.ObjectId('6978589989f9728a1ee3b8ec'); // Mobiles & Tablets
    const attributeTypeIds = [
        '6984d6b237975efce7ce9324', // Color
        '6984d6b237975efce7ce9326', // RAM
        '6984d6b237975efce7ce9329'  // Storage
    ].map(id => new mongoose.Types.ObjectId(id));

    const mappings = attributeTypeIds.map((atId, index) => ({
        categoryId,
        attributeTypeId: atId,
        isRequired: true,
        displayOrder: index,
        groupLabel: 'Technical Specifications',
        createdBy: 'admin',
        isDeleted: false
    }));

    // Use insertMany or bulkWrite
    const res = await mongoose.connection.db.collection('category_attributes').insertMany(mappings);
    console.log('Inserted Mappings:', res);

    await mongoose.disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
