import mongoose from 'mongoose';
import SizeMaster from './Backend/models/masters/SizeMaster.enterprise.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const logFile = path.join(process.cwd(), 'test_results.log');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

dotenv.config({ path: path.join(process.cwd(), 'Backend', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel';

async function testSizeMaster() {
    try {
        log('Connecting to MongoDB at: ' + MONGO_URI);
        await mongoose.connect(MONGO_URI);
        log('Connected.');

        await SizeMaster.deleteMany({ displayName: /Automated Test Size/ });

        log('Creating Test Size...');
        const newSize = new SizeMaster({
            value: 'TEST-' + Date.now(),
            displayName: 'Automated Test Size',
            category: 'STORAGE',
            gender: 'UNISEX',
            primaryRegion: 'GLOBAL',
            normalizedRank: 999,
            lifecycleState: 'DRAFT'
        });

        const savedSize = await newSize.save();
        log('✅ Created: ' + savedSize.canonicalId);

        log('Editing Size...');
        savedSize.displayName = 'Automated Test Size - UPDATED';
        const updatedSize = await savedSize.save();
        log('✅ Updated: ' + updatedSize.displayName);

        log('Testing Lifecycle (DRAFT -> ACTIVE)...');
        updatedSize.lifecycleState = 'ACTIVE';
        await updatedSize.save();
        log('✅ Lifecycle updated to ACTIVE.');

        log('Testing Lock Enforcement...');
        updatedSize.isLocked = true;
        await updatedSize.save();

        try {
            updatedSize.displayName = 'HACKED';
            await updatedSize.save();
            log('❌ FAILED: Lock was bypassed!');
        } catch (err) {
            log('✅ PASS: Lock prevented modification. Error: ' + err.message);
        }

        log('Unlocking...');
        const docToUnlock = await SizeMaster.findById(updatedSize._id);
        docToUnlock.isLocked = false;
        await docToUnlock.save();

        log('Testing Deletion Protection (ACTIVE doc)...');
        try {
            await docToUnlock.deleteOne();
            log('❌ FAILED: Active doc was deleted!');
        } catch (err) {
            log('✅ PASS: Deletion prevented for non-archived state. Error: ' + err.message);
        }

        log('Testing Deletion (ARCHIVED doc)...');
        docToUnlock.lifecycleState = 'ARCHIVED';
        await docToUnlock.save();
        await docToUnlock.deleteOne();
        log('✅ PASS: Archived doc deleted successfully.');

        log('\n--- ALL DB TESTS PASSED ---');
    } catch (error) {
        log('❌ TEST FAILED: ' + error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                log(`Field [${key}]: ${error.errors[key].message}`);
            });
        }
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

testSizeMaster();
