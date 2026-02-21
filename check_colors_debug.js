import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, 'Backend/.env') });

async function checkColors() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        const colors = await mongoose.connection.collection('colormasters').find({}).toArray();
        console.log('COUNT:', colors.length);
        console.log('COLORS:', JSON.stringify(colors, null, 2));
        process.exit(0);
    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    }
}

checkColors();
