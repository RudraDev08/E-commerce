import mongoose from 'mongoose';
import './models/masters/SizeMaster.enterprise.js';
// Add other models if needed

async function debugMongoose() {
    console.log('Registered Models:', Object.keys(mongoose.models));
    for (const modelName of Object.keys(mongoose.models)) {
        const model = mongoose.models[modelName];
        console.log(`Model: ${modelName}, Collection: ${model.collection.name}`);
        console.log(`Indexes defined in schema:`, JSON.stringify(model.schema._indexes, null, 2));
        // Check paths for 'name'
        if (model.schema.path('name')) {
            console.log(`  Path 'name' exists in ${modelName}`);
            const pathOptions = model.schema.path('name').options;
            console.log(`  Options:`, JSON.stringify(pathOptions, null, 2));
        }
    }
    process.exit(0);
}

debugMongoose();
