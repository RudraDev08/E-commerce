/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PHASE 0 + PHASE 1 — ATTRIBUTE ROLE MIGRATION SCRIPT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Safe Execution Rules:
 *   1. Run ONLY during a maintenance window.
 *   2. Backup VariantMaster + InventoryMaster BEFORE running.
 *   3. This script uses document.save() — immutability guard in AttributeType
 *      will BLOCK changes if active variants still depend on the attribute.
 *   4. If blocked: archive dependent variants first, then re-run.
 *
 * Run:  node --experimental-vm-modules Backend/scripts/migrateAttributeRoles.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import AttributeType from '../models/AttributeType.model.js';

// ── GOVERNANCE CONFIG ─────────────────────────────────────────────────────────
// Electronics category: only these slugs may be VARIANT (SKU-driving).
// All others must be SPECIFICATION (display-only, never gate cart decisions).
const ELECTRONICS_VARIANT_ALLOWED_SLUGS = new Set(['color', 'storage', 'connectivity']);

// ── Category slugs to audit ───────────────────────────────────────────────────
const ELECTRONICS_CATEGORY_SLUG = 'electronics';

async function main() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) throw new Error('MONGODB_URI not set in environment');

    await mongoose.connect(uri);
    console.log('[Migration] Connected to MongoDB');

    // 1. Resolve electronics category id
    const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({ slug: String }));
    const electronicsCategory = await Category.findOne({ slug: ELECTRONICS_CATEGORY_SLUG }).lean();

    if (!electronicsCategory) {
        console.warn(`[Migration] WARNING: Category "${ELECTRONICS_CATEGORY_SLUG}" not found. Auditing by slug match only.`);
    }

    // 2. Fetch all AttributeTypes applicable to electronics (by category ref or by slug)
    const query = electronicsCategory
        ? { applicableCategories: electronicsCategory._id }
        : { slug: { $in: ['display_size', 'ram', 'material_configuration', 'phone_ram', 'color', 'storage', 'connectivity'] } };

    const attrs = await AttributeType.find(query);
    console.log(`[Migration] Found ${attrs.length} AttributeTypes to audit`);

    let reclassifiedToVariant = 0;
    let reclassifiedToSpec = 0;
    let skipped = 0;
    let blocked = 0;

    for (const attr of attrs) {
        const isAllowedVariant = ELECTRONICS_VARIANT_ALLOWED_SLUGS.has(attr.slug.toLowerCase());
        const currentRole = attr.attributeRole;

        if (isAllowedVariant && currentRole === 'VARIANT') {
            console.log(`  ✅ CORRECT  [${attr.slug}] is VARIANT — no change needed`);
            skipped++;
            continue;
        }

        if (!isAllowedVariant && currentRole === 'SPECIFICATION') {
            console.log(`  ✅ CORRECT  [${attr.slug}] is SPECIFICATION — no change needed`);
            skipped++;
            continue;
        }

        const targetRole = isAllowedVariant ? 'VARIANT' : 'SPECIFICATION';
        console.log(`  🔄 RECLASSIFY [${attr.slug}] ${currentRole} → ${targetRole}`);

        try {
            // Use document.save() so the pre-save immutability guard fires.
            // If active variants reference this attribute, the guard will THROW.
            attr.attributeRole = targetRole;
            await attr.save();

            if (targetRole === 'VARIANT') reclassifiedToVariant++;
            else reclassifiedToSpec++;
            console.log(`     ✔ Done`);
        } catch (err) {
            if (err.message.includes('GOVERNANCE VIOLATION') || err.message.includes('IMMUTABILITY')) {
                console.error(`     ⛔ BLOCKED: ${err.message}`);
                blocked++;
            } else {
                throw err; // Unexpected error — surface it
            }
        }
    }

    console.log('\n[Migration] ─── SUMMARY ───────────────────────────────────────');
    console.log(`  Skipped (already correct): ${skipped}`);
    console.log(`  Reclassified → VARIANT:    ${reclassifiedToVariant}`);
    console.log(`  Reclassified → SPECIFICATION: ${reclassifiedToSpec}`);
    console.log(`  Blocked (active variants):  ${blocked}`);
    if (blocked > 0) {
        console.warn('\n  [!] BLOCKED attributes still have ACTIVE variants.');
        console.warn('      Archive dependent variants first, then re-run this migration.');
    }
    console.log('[Migration] ────────────────────────────────────────────────────\n');

    await mongoose.disconnect();
    console.log('[Migration] Done. Connection closed.');
}

main().catch(err => {
    console.error('[Migration] FATAL:', err);
    process.exit(1);
});
