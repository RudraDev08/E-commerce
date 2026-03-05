/**
 * seedAdminUser.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates an initial super_admin user if none exists.
 * Run once after setting up the database:
 *   node Backend/scripts/seedAdminUser.js
 *
 * Credentials created (CHANGE IN PRODUCTION):
 *   Email:    admin@nexus-erp.com
 *   Password: Admin@12345
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import User from '../models/UserSchema.js';

const SEED_USERS = [
    {
        name: 'Super Admin',
        email: 'admin@nexus-erp.com',
        passwordHash: 'Admin@12345',   // Will be bcrypt-hashed by pre-save hook
        role: 'super_admin',
    },
    {
        name: 'Store Manager',
        email: 'manager@nexus-erp.com',
        passwordHash: 'Manager@12345',
        role: 'manager',
    },
    {
        name: 'Staff Member',
        email: 'staff@nexus-erp.com',
        passwordHash: 'Staff@12345',
        role: 'staff',
    },
];

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    for (const u of SEED_USERS) {
        const exists = await User.findOne({ email: u.email });
        if (exists) {
            console.log(`⏭  Skipping ${u.email} — already exists (role: ${exists.role})`);
            continue;
        }
        await User.create(u);
        console.log(`✅ Created ${u.role}: ${u.email}`);
    }

    await mongoose.disconnect();
    console.log('✅ Done.');
}

seed().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
