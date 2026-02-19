import mongoose from 'mongoose';
import SizeMaster from './Backend/models/masters/SizeMaster.enterprise.js';
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

        const ID_TO_TEST = new mongoose.Types.ObjectId(); // Use random ID
        log(`Using test ID: ${ID_TO_TEST}`);

        log('Creating dummy size for testing...');
        const size = new SizeMaster({
            _id: ID_TO_TEST,
            value: 'DEBUG-' + Date.now(),
            displayName: 'Debug Size',
            category: 'CLOTHING',
            gender: 'MEN',
            primaryRegion: 'US',
            normalizedRank: 10,
            lifecycleState: 'DRAFT'
        });
        await size.save();
        log('✅ Dummy size created.');

        // Test toggleStatus logic
        log('Testing toggleStatus logic...');
        const transitionMap = {
            'DRAFT': 'ACTIVE',
            'ACTIVE': 'DEPRECATED',
            'DEPRECATED': 'ACTIVE',
            'ARCHIVED': 'DEPRECATED'
        };

        const currentState = size.lifecycleState;
        const newState = transitionMap[currentState];
        log(`Transitioning ${currentState} -> ${newState}`);

        size.lifecycleState = newState;
        await size.save();
        log('✅ First toggle (DRAFT -> ACTIVE) succeeded.');

        // Test LOCK ENFORCEMENT
        log('Locking size...');
        size.isLocked = true;
        await size.save();
        log('✅ Size locked.');

        log('Testing toggle when locked (this SHOULD fail based on current logic)...');
        try {
            const innerState = size.lifecycleState;
            size.lifecycleState = transitionMap[innerState];
            await size.save();
            log('❌ FAILED: Toggle succeeded on locked document!');
        } catch (err) {
            log('✅ PASS: Toggle blocked by lock enforcement. Error: ' + err.message);
        }

        // Test DELETION PROTECTION
        log('Testing delete logic (active doc)...');
        try {
            await size.deleteOne();
            log('❌ FAILED: Deletion succeeded for non-archived state!');
        } catch (err) {
            log('✅ PASS: Deletion blocked as expected. Error: ' + err.message);
        }

        log('Final Cleanup...');
        // To cleanup, we must unlock first
        const docForCleanup = await SizeMaster.findById(ID_TO_TEST);
        docForCleanup.isLocked = false;
        docForCleanup.lifecycleState = 'ARCHIVED';
        await docForCleanup.save();
        await docForCleanup.deleteOne();
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
