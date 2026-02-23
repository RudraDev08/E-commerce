/**
 * Attribute System Seed Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates demo data for the GET /api/attributes?categoryId endpoint.
 *
 * Categories seeded:
 *   📱 Phones   → Processor, RAM, Storage, Display Size
 *   💻 Laptops  → CPU, GPU, RAM, Storage, Screen Size
 *   👕 Clothing → Size Type, Material, Fit
 *
 * Run with:
 *   node --experimental-vm-modules Backend/scripts/seedAttributes.js
 *   OR (if using nodemon / npm scripts):
 *   npm run seed:attributes
 *
 * Safe to re-run: uses upsert logic — will not create duplicates.
 *
 * @module seedAttributes
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '../.env') });

// ── Model imports ──────────────────────────────────────────────────────────────
import Category from '../models/Category/CategorySchema.js';
import AttributeType from '../models/AttributeType.model.js';
import AttributeValue from '../models/AttributeValue.model.js';
import CategoryAttribute from '../models/CategoryAttribute.model.js';

// ── Connection ─────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || process.env.DB_URI;

async function connect() {
    if (!MONGO_URI) throw new Error('MONGO_URI is not set in .env');
    await mongoose.connect(MONGO_URI);
    console.log('✅  MongoDB connected');
}

// ── Seed Data Definition ───────────────────────────────────────────────────────

const CATEGORIES = [
    {
        name: 'Phones',
        slug: 'phones',
        description: 'Smartphones and mobile devices',
        status: 'active',
    },
    {
        name: 'Laptops',
        slug: 'laptops',
        description: 'Laptops and notebook computers',
        status: 'active',
    },
    {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Apparel and fashion items',
        status: 'active',
    },
];

/**
 * ATTRIBUTE_BLUEPRINTS:
 * Each entry defines an AttributeType and its AttributeValues.
 * `_categoryLinks` specifies which categories get this attribute, with
 * per-category options (isRequired, displayOrder, groupLabel).
 */
const ATTRIBUTE_BLUEPRINTS = [
    // ─── PHONES ──────────────────────────────────────────────────────────────────
    {
        attribute: {
            name: 'Processor',
            slug: 'processor',
            code: 'PROCESSOR',
            displayName: 'Processor',
            description: 'Mobile SoC / chipset',
            category: 'technical',
            inputType: 'dropdown',
            showInFilters: true,
            showInVariants: false,
            validationRules: { isRequired: true },
            sortingConfig: { displayOrder: 1 },
        },
        values: [
            { name: 'A18 PRO', slug: 'a18-pro', code: 'A18PRO', displayName: 'A18 Pro', displayOrder: 1 },
            { name: 'A17 PRO', slug: 'a17-pro', code: 'A17PRO', displayName: 'A17 Pro', displayOrder: 2 },
            { name: 'A16 BIONIC', slug: 'a16-bionic', code: 'A16BIO', displayName: 'A16 Bionic', displayOrder: 3 },
            { name: 'SNAPDRAGON 8 GEN 3', slug: 'snapdragon-8-gen-3', code: 'SD8G3', displayName: 'Snapdragon 8 Gen 3', displayOrder: 4 },
            { name: 'SNAPDRAGON 8 GEN 2', slug: 'snapdragon-8-gen-2', code: 'SD8G2', displayName: 'Snapdragon 8 Gen 2', displayOrder: 5 },
            { name: 'DIMENSITY 9300', slug: 'dimensity-9300', code: 'DIM9300', displayName: 'Dimensity 9300', displayOrder: 6 },
            { name: 'EXYNOS 2400', slug: 'exynos-2400', code: 'EX2400', displayName: 'Exynos 2400', displayOrder: 7 },
        ],
        _categoryLinks: [
            { categorySlug: 'phones', isRequired: true, displayOrder: 1, groupLabel: 'Performance' },
        ],
    },

    {
        attribute: {
            name: 'Phone RAM',
            slug: 'phone-ram',
            code: 'PHONE_RAM',
            displayName: 'RAM',
            description: 'Mobile device RAM capacity',
            category: 'technical',
            inputType: 'button',
            showInFilters: true,
            showInVariants: true,
            sortingConfig: { displayOrder: 2 },
        },
        values: [
            { name: '4GB', slug: '4gb-ram', code: 'RAM4G', displayName: '4 GB', displayOrder: 1, technicalData: { ram: 4 } },
            { name: '6GB', slug: '6gb-ram', code: 'RAM6G', displayName: '6 GB', displayOrder: 2, technicalData: { ram: 6 } },
            { name: '8GB', slug: '8gb-ram', code: 'RAM8G', displayName: '8 GB', displayOrder: 3, technicalData: { ram: 8 } },
            { name: '12GB', slug: '12gb-ram', code: 'RAM12G', displayName: '12 GB', displayOrder: 4, technicalData: { ram: 12 } },
            { name: '16GB', slug: '16gb-ram', code: 'RAM16G', displayName: '16 GB', displayOrder: 5, technicalData: { ram: 16 } },
        ],
        _categoryLinks: [
            { categorySlug: 'phones', isRequired: true, displayOrder: 2, groupLabel: 'Performance' },
        ],
    },

    {
        attribute: {
            name: 'Phone Storage',
            slug: 'phone-storage',
            code: 'PHONE_STORAGE',
            displayName: 'Storage',
            description: 'Internal storage capacity',
            category: 'technical',
            inputType: 'button',
            showInFilters: true,
            showInVariants: true,
            sortingConfig: { displayOrder: 3 },
        },
        values: [
            { name: '64GB', slug: '64gb', code: 'ST64G', displayName: '64 GB', displayOrder: 1 },
            { name: '128GB', slug: '128gb', code: 'ST128G', displayName: '128 GB', displayOrder: 2 },
            { name: '256GB', slug: '256gb', code: 'ST256G', displayName: '256 GB', displayOrder: 3 },
            { name: '512GB', slug: '512gb', code: 'ST512G', displayName: '512 GB', displayOrder: 4 },
            { name: '1TB', slug: '1tb', code: 'ST1TB', displayName: '1 TB', displayOrder: 5 },
        ],
        _categoryLinks: [
            { categorySlug: 'phones', isRequired: true, displayOrder: 3, groupLabel: 'Storage' },
        ],
    },

    {
        attribute: {
            name: 'Display Size',
            slug: 'display-size',
            code: 'DISP_SIZE',
            displayName: 'Display Size',
            description: 'Screen diagonal in inches',
            category: 'specification',
            inputType: 'dropdown',
            showInFilters: true,
            showInVariants: false,
            sortingConfig: { displayOrder: 4 },
        },
        values: [
            { name: '5.4 INCH', slug: '5-4-inch', code: 'D54', displayName: '5.4"', displayOrder: 1 },
            { name: '6.1 INCH', slug: '6-1-inch', code: 'D61', displayName: '6.1"', displayOrder: 2 },
            { name: '6.7 INCH', slug: '6-7-inch', code: 'D67', displayName: '6.7"', displayOrder: 3 },
            { name: '6.8 INCH', slug: '6-8-inch', code: 'D68', displayName: '6.8"', displayOrder: 4 },
        ],
        _categoryLinks: [
            { categorySlug: 'phones', isRequired: false, displayOrder: 4, groupLabel: 'Display' },
        ],
    },

    // ─── LAPTOPS ─────────────────────────────────────────────────────────────────
    {
        attribute: {
            name: 'CPU',
            slug: 'cpu',
            code: 'CPU',
            displayName: 'Processor (CPU)',
            description: 'Laptop processor model',
            category: 'technical',
            inputType: 'dropdown',
            showInFilters: true,
            showInVariants: false,
            sortingConfig: { displayOrder: 1 },
        },
        values: [
            { name: 'INTEL CORE I5 13TH GEN', slug: 'intel-i5-13', code: 'I513', displayName: 'Intel Core i5 (13th Gen)', displayOrder: 1 },
            { name: 'INTEL CORE I7 13TH GEN', slug: 'intel-i7-13', code: 'I713', displayName: 'Intel Core i7 (13th Gen)', displayOrder: 2 },
            { name: 'INTEL CORE I9 13TH GEN', slug: 'intel-i9-13', code: 'I913', displayName: 'Intel Core i9 (13th Gen)', displayOrder: 3 },
            { name: 'AMD RYZEN 5 7000', slug: 'amd-r5-7000', code: 'R57K', displayName: 'AMD Ryzen 5 7000', displayOrder: 4 },
            { name: 'AMD RYZEN 7 7000', slug: 'amd-r7-7000', code: 'R77K', displayName: 'AMD Ryzen 7 7000', displayOrder: 5 },
            { name: 'APPLE M3', slug: 'apple-m3', code: 'M3', displayName: 'Apple M3', displayOrder: 6 },
            { name: 'APPLE M3 PRO', slug: 'apple-m3-pro', code: 'M3PRO', displayName: 'Apple M3 Pro', displayOrder: 7 },
            { name: 'APPLE M3 MAX', slug: 'apple-m3-max', code: 'M3MAX', displayName: 'Apple M3 Max', displayOrder: 8 },
        ],
        _categoryLinks: [
            { categorySlug: 'laptops', isRequired: true, displayOrder: 1, groupLabel: 'Processing Power' },
        ],
    },

    {
        attribute: {
            name: 'GPU',
            slug: 'gpu',
            code: 'GPU',
            displayName: 'Graphics Card (GPU)',
            description: 'Dedicated or integrated GPU',
            category: 'technical',
            inputType: 'dropdown',
            showInFilters: true,
            showInVariants: false,
            sortingConfig: { displayOrder: 2 },
        },
        values: [
            { name: 'INTEGRATED GRAPHICS', slug: 'integrated', code: 'GPU_INT', displayName: 'Integrated Graphics', displayOrder: 1 },
            { name: 'NVIDIA RTX 3050', slug: 'rtx-3050', code: 'RTX3050', displayName: 'NVIDIA RTX 3050', displayOrder: 2 },
            { name: 'NVIDIA RTX 4060', slug: 'rtx-4060', code: 'RTX4060', displayName: 'NVIDIA RTX 4060', displayOrder: 3 },
            { name: 'NVIDIA RTX 4070', slug: 'rtx-4070', code: 'RTX4070', displayName: 'NVIDIA RTX 4070', displayOrder: 4 },
            { name: 'AMD RADEON RX 6600', slug: 'rx-6600', code: 'RX6600', displayName: 'AMD Radeon RX 6600', displayOrder: 5 },
        ],
        _categoryLinks: [
            { categorySlug: 'laptops', isRequired: false, displayOrder: 2, groupLabel: 'Processing Power' },
        ],
    },

    {
        attribute: {
            name: 'Laptop RAM',
            slug: 'laptop-ram',
            code: 'LAPTOP_RAM',
            displayName: 'RAM',
            description: 'Laptop memory capacity',
            category: 'technical',
            inputType: 'button',
            showInFilters: true,
            showInVariants: true,
            sortingConfig: { displayOrder: 3 },
        },
        values: [
            { name: '8GB DDR5', slug: '8gb-ddr5', code: 'LR8G', displayName: '8 GB', displayOrder: 1 },
            { name: '16GB DDR5', slug: '16gb-ddr5', code: 'LR16G', displayName: '16 GB', displayOrder: 2 },
            { name: '32GB DDR5', slug: '32gb-ddr5', code: 'LR32G', displayName: '32 GB', displayOrder: 3 },
            { name: '64GB DDR5', slug: '64gb-ddr5', code: 'LR64G', displayName: '64 GB', displayOrder: 4 },
        ],
        _categoryLinks: [
            { categorySlug: 'laptops', isRequired: true, displayOrder: 3, groupLabel: 'Memory & Storage' },
        ],
    },

    {
        attribute: {
            name: 'Laptop Storage',
            slug: 'laptop-storage',
            code: 'LAPTOP_STORAGE',
            displayName: 'SSD Storage',
            description: 'SSD storage capacity',
            category: 'technical',
            inputType: 'button',
            showInFilters: true,
            showInVariants: true,
            sortingConfig: { displayOrder: 4 },
        },
        values: [
            { name: '256GB SSD', slug: '256gb-ssd', code: 'LS256', displayName: '256 GB SSD', displayOrder: 1 },
            { name: '512GB SSD', slug: '512gb-ssd', code: 'LS512', displayName: '512 GB SSD', displayOrder: 2 },
            { name: '1TB SSD', slug: '1tb-ssd', code: 'LS1T', displayName: '1 TB SSD', displayOrder: 3 },
            { name: '2TB SSD', slug: '2tb-ssd', code: 'LS2T', displayName: '2 TB SSD', displayOrder: 4 },
        ],
        _categoryLinks: [
            { categorySlug: 'laptops', isRequired: true, displayOrder: 4, groupLabel: 'Memory & Storage' },
        ],
    },

    {
        attribute: {
            name: 'Screen Size',
            slug: 'screen-size',
            code: 'SCREEN_SIZE',
            displayName: 'Screen Size',
            description: 'Display diagonal in inches',
            category: 'specification',
            inputType: 'dropdown',
            showInFilters: true,
            showInVariants: false,
            sortingConfig: { displayOrder: 5 },
        },
        values: [
            { name: '13 INCH', slug: '13-inch', code: 'SS13', displayName: '13"', displayOrder: 1 },
            { name: '14 INCH', slug: '14-inch', code: 'SS14', displayName: '14"', displayOrder: 2 },
            { name: '15.6 INCH', slug: '15-6-inch', code: 'SS156', displayName: '15.6"', displayOrder: 3 },
            { name: '16 INCH', slug: '16-inch', code: 'SS16', displayName: '16"', displayOrder: 4 },
            { name: '17.3 INCH', slug: '17-3-inch', code: 'SS173', displayName: '17.3"', displayOrder: 5 },
        ],
        _categoryLinks: [
            { categorySlug: 'laptops', isRequired: false, displayOrder: 5, groupLabel: 'Display' },
        ],
    },

    // ─── CLOTHING ────────────────────────────────────────────────────────────────
    {
        attribute: {
            name: 'Size Type',
            slug: 'size-type',
            code: 'SIZE_TYPE',
            displayName: 'Size',
            description: 'Clothing size in standard notation',
            category: 'physical',
            inputType: 'button',
            showInFilters: true,
            showInVariants: true,
            sortingConfig: { displayOrder: 1 },
        },
        values: [
            { name: 'XS', slug: 'xs', code: 'SZ_XS', displayName: 'XS', displayOrder: 1 },
            { name: 'S', slug: 's', code: 'SZ_S', displayName: 'S', displayOrder: 2 },
            { name: 'M', slug: 'm', code: 'SZ_M', displayName: 'M', displayOrder: 3 },
            { name: 'L', slug: 'l', code: 'SZ_L', displayName: 'L', displayOrder: 4 },
            { name: 'XL', slug: 'xl', code: 'SZ_XL', displayName: 'XL', displayOrder: 5 },
            { name: 'XXL', slug: 'xxl', code: 'SZ_XXL', displayName: 'XXL', displayOrder: 6 },
            { name: '3XL', slug: '3xl', code: 'SZ_3XL', displayName: '3XL', displayOrder: 7 },
        ],
        _categoryLinks: [
            { categorySlug: 'clothing', isRequired: true, displayOrder: 1, groupLabel: 'Sizing' },
        ],
    },

    {
        attribute: {
            name: 'Material',
            slug: 'material',
            code: 'MATERIAL',
            displayName: 'Material',
            description: 'Fabric / material composition',
            category: 'material',
            inputType: 'dropdown',
            showInFilters: true,
            showInVariants: false,
            sortingConfig: { displayOrder: 2 },
        },
        values: [
            { name: '100% COTTON', slug: '100-cotton', code: 'MAT_COT', displayName: '100% Cotton', displayOrder: 1 },
            { name: 'POLYESTER', slug: 'polyester', code: 'MAT_POL', displayName: 'Polyester', displayOrder: 2 },
            { name: 'COTTON BLEND', slug: 'cotton-blend', code: 'MAT_CB', displayName: 'Cotton Blend', displayOrder: 3 },
            { name: 'WOOL', slug: 'wool', code: 'MAT_WOOL', displayName: 'Wool', displayOrder: 4 },
            { name: 'LINEN', slug: 'linen', code: 'MAT_LIN', displayName: 'Linen', displayOrder: 5 },
            { name: 'DENIM', slug: 'denim', code: 'MAT_DEN', displayName: 'Denim', displayOrder: 6 },
            { name: 'SILK', slug: 'silk', code: 'MAT_SILK', displayName: 'Silk', displayOrder: 7 },
        ],
        _categoryLinks: [
            { categorySlug: 'clothing', isRequired: false, displayOrder: 2, groupLabel: 'Fabric & Material' },
        ],
    },

    {
        attribute: {
            name: 'Fit',
            slug: 'fit',
            code: 'FIT',
            displayName: 'Fit',
            description: 'Garment fit / cut type',
            category: 'style',
            inputType: 'radio',
            showInFilters: true,
            showInVariants: false,
            sortingConfig: { displayOrder: 3 },
        },
        values: [
            { name: 'SLIM FIT', slug: 'slim-fit', code: 'FIT_SLM', displayName: 'Slim Fit', displayOrder: 1 },
            { name: 'REGULAR FIT', slug: 'regular-fit', code: 'FIT_REG', displayName: 'Regular Fit', displayOrder: 2 },
            { name: 'RELAXED FIT', slug: 'relaxed-fit', code: 'FIT_RLX', displayName: 'Relaxed Fit', displayOrder: 3 },
            { name: 'OVERSIZED', slug: 'oversized', code: 'FIT_OVR', displayName: 'Oversized', displayOrder: 4 },
            { name: 'TAILORED', slug: 'tailored', code: 'FIT_TAL', displayName: 'Tailored', displayOrder: 5 },
        ],
        _categoryLinks: [
            { categorySlug: 'clothing', isRequired: false, displayOrder: 3, groupLabel: 'Style' },
        ],
    },
];

// ── Seed Logic ─────────────────────────────────────────────────────────────────

async function upsertCategory(data) {
    return Category.findOneAndUpdate({ slug: data.slug }, data, {
        upsert: true,
        new: true,
        runValidators: true,
    });
}

async function upsertAttributeType(data) {
    return AttributeType.findOneAndUpdate({ code: data.code }, data, {
        upsert: true,
        new: true,
        runValidators: true,
    });
}

async function upsertAttributeValue(attributeTypeId, data) {
    return AttributeValue.findOneAndUpdate(
        { attributeType: attributeTypeId, code: data.code },
        { ...data, attributeType: attributeTypeId },
        { upsert: true, new: true, runValidators: true }
    );
}

async function upsertCategoryAttribute(categoryId, attributeTypeId, opts) {
    return CategoryAttribute.findOneAndUpdate(
        { categoryId, attributeTypeId },
        {
            $set: {
                categoryId,
                attributeTypeId,
                isRequired: opts.isRequired,
                displayOrder: opts.displayOrder,
                groupLabel: opts.groupLabel,
                isDeleted: false,
                deletedAt: null,
            },
        },
        { upsert: true, new: true }
    );
}

async function seed() {
    await connect();

    console.log('\n📦  Seeding Categories...');
    const categoryMap = {};
    for (const catData of CATEGORIES) {
        const cat = await upsertCategory(catData);
        categoryMap[cat.slug] = cat;
        console.log(`  ✅  ${cat.name}  (${cat._id})`);
    }

    console.log('\n🏷   Seeding Attribute Types & Values...');
    for (const blueprint of ATTRIBUTE_BLUEPRINTS) {
        const atType = await upsertAttributeType(blueprint.attribute);
        console.log(`\n  📌  ${atType.displayName}  [${atType.code}]`);

        for (const val of blueprint.values) {
            await upsertAttributeValue(atType._id, val);
            console.log(`       └─  ${val.displayName}`);
        }

        // Link to categories
        for (const link of blueprint._categoryLinks) {
            const cat = categoryMap[link.categorySlug];
            if (!cat) {
                console.warn(`  ⚠️  Category slug "${link.categorySlug}" not found — skipping link`);
                continue;
            }
            await upsertCategoryAttribute(cat._id, atType._id, link);
            console.log(
                `       ↔  Linked to "${cat.name}" | order=${link.displayOrder} | required=${link.isRequired}`
            );
        }
    }

    console.log('\n🎉  Seed complete!\n');
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌  Seed failed:', err);
    mongoose.disconnect().finally(() => process.exit(1));
});
