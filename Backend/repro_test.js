import mongoose from 'mongoose';
import SizeMaster from './models/masters/SizeMaster.enterprise.js';
import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'repro_debug.log');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

const MONGO_URI = 'mongodb://localhost:27017/AdminPanel';

async function repro() {
    try {
        log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        log('Connected.');

        const ID_TO_TEST = new mongoose.Types.ObjectId();
        log(`Using test ID: ${ID_TO_TEST}`);

        log('Creating dummy size for testing...');
        const size = new SizeMaster({
            _id: ID_TO_TEST,
            value: 'DB-TEST-' + Date.now(),
            displayName: 'Debug Size',
            category: 'CLOTHING',
            gender: 'MEN',
            primaryRegion: 'US',
            normalizedRank: 10,
            lifecycleState: 'DRAFT'
        });
        await size.save();
        log('✅ Dummy size created. Canonical ID: ' + size.canonicalId);

        log('Final Cleanup...');
        await SizeMaster.findByIdAndDelete(ID_TO_TEST);
        log('✅ Cleanup successful.');

        log('\n--- ALL REPRO TESTS PASSED ---');
    } catch (error) {
        log('❌ REPRO FAILED: ' + error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

repro();
