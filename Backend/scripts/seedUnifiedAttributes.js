import mongoose from 'mongoose';
import AttributeType from '../models/AttributeType.model.js';
import AttributeValue from '../models/AttributeValue.model.js';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedUnifiedAttributes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await AttributeType.deleteMany({});
        await AttributeValue.deleteMany({});
        console.log('🗑️  Cleared existing attributes');

        // ==================== CREATE ATTRIBUTE TYPES ====================

        // 1. Size Attribute Type
        const sizeType = await AttributeType.create({
            name: 'Size',
            slug: 'size',
            code: 'SIZE',
            displayName: 'Select Size',
            displayType: 'button',
            valueType: 'composite',
            category: 'physical',
            isRequired: true,
            allowMultiple: false,
            affectsPrice: false,
            affectsStock: true,
            showInFilters: true,
            showInVariants: true,
            displayOrder: 1
        });

        // 2. Color Attribute Type
        const colorType = await AttributeType.create({
            name: 'Color',
            slug: 'color',
            code: 'COLOR',
            displayName: 'Choose Color',
            displayType: 'swatch',
            valueType: 'color',
            category: 'visual',
            isRequired: true,
            allowMultiple: false,
            affectsPrice: false,
            affectsStock: true,
            showInFilters: true,
            showInVariants: true,
            displayOrder: 2
        });

        // 3. RAM Attribute Type
        const ramType = await AttributeType.create({
            name: 'RAM',
            slug: 'ram',
            code: 'RAM',
            displayName: 'Select RAM',
            displayType: 'dropdown',
            valueType: 'number',
            category: 'technical',
            isRequired: false,
            allowMultiple: false,
            affectsPrice: true,
            affectsStock: true,
            showInFilters: true,
            showInVariants: true,
            displayOrder: 3
        });

        // 4. Storage Attribute Type
        const storageType = await AttributeType.create({
            name: 'Storage',
            slug: 'storage',
            code: 'STORAGE',
            displayName: 'Select Storage',
            displayType: 'dropdown',
            valueType: 'number',
            category: 'technical',
            isRequired: false,
            allowMultiple: false,
            affectsPrice: true,
            affectsStock: true,
            showInFilters: true,
            showInVariants: true,
            displayOrder: 4
        });

        // 5. Material Attribute Type
        const materialType = await AttributeType.create({
            name: 'Material',
            slug: 'material',
            code: 'MATERIAL',
            displayName: 'Material',
            displayType: 'dropdown',
            valueType: 'text',
            category: 'material',
            isRequired: false,
            allowMultiple: false,
            affectsPrice: false,
            affectsStock: false,
            showInFilters: true,
            showInVariants: false,
            displayOrder: 5
        });

        console.log('✅ Created 5 attribute types');

        // ==================== CREATE ATTRIBUTE VALUES ====================

        // SIZE VALUES
        const sizeValues = [
            {
                name: 'XS',
                displayName: 'Extra Small',
                metadata: {
                    sizeGroup: "Men's Clothing",
                    gender: 'men',
                    measurements: { chest: 86, waist: 76, hip: 91, shoulder: 42 }
                },
                displayOrder: 1
            },
            {
                name: 'S',
                displayName: 'Small',
                metadata: {
                    sizeGroup: "Men's Clothing",
                    gender: 'men',
                    measurements: { chest: 91, waist: 81, hip: 96, shoulder: 44 }
                },
                displayOrder: 2
            },
            {
                name: 'M',
                displayName: 'Medium',
                metadata: {
                    sizeGroup: "Men's Clothing",
                    gender: 'men',
                    measurements: { chest: 96, waist: 86, hip: 101, shoulder: 46 }
                },
                displayOrder: 3
            },
            {
                name: 'L',
                displayName: 'Large',
                metadata: {
                    sizeGroup: "Men's Clothing",
                    gender: 'men',
                    measurements: { chest: 101, waist: 91, hip: 106, shoulder: 48 }
                },
                displayOrder: 4
            },
            {
                name: 'XL',
                displayName: 'Extra Large',
                metadata: {
                    sizeGroup: "Men's Clothing",
                    gender: 'men',
                    measurements: { chest: 106, waist: 96, hip: 111, shoulder: 50 }
                },
                displayOrder: 5
            }
        ];

        for (const size of sizeValues) {
            await AttributeValue.create({
                attributeType: sizeType._id,
                ...size,
                slug: size.name.toLowerCase(),
                code: `SIZE-${size.name}`,
                visualData: { swatchType: 'text' }
            });
        }

        // COLOR VALUES
        const colorValues = [
            { name: 'BLACK', displayName: 'Black', hexCode: '#000000', colorFamily: 'neutral' },
            { name: 'WHITE', displayName: 'White', hexCode: '#FFFFFF', colorFamily: 'neutral' },
            { name: 'RED', displayName: 'Red', hexCode: '#FF0000', colorFamily: 'warm' },
            { name: 'BLUE', displayName: 'Blue', hexCode: '#0000FF', colorFamily: 'cool' },
            { name: 'GREEN', displayName: 'Green', hexCode: '#00FF00', colorFamily: 'cool' },
            { name: 'NAVY', displayName: 'Navy Blue', hexCode: '#000080', colorFamily: 'cool' }
        ];

        for (const [index, color] of colorValues.entries()) {
            await AttributeValue.create({
                attributeType: colorType._id,
                name: color.name,
                displayName: color.displayName,
                slug: color.name.toLowerCase(),
                code: `COLOR-${color.name}`,
                visualData: {
                    hexCode: color.hexCode,
                    colorFamily: color.colorFamily,
                    swatchType: 'color',
                    swatchValue: color.hexCode
                },
                displayOrder: index + 1
            });
        }

        // RAM VALUES
        const ramValues = [
            { name: '4GB', value: 4, pricingModifiers: { modifierType: 'none', value: 0 } },
            { name: '8GB', value: 8, pricingModifiers: { modifierType: 'fixed', value: 50 } },
            { name: '16GB', value: 16, pricingModifiers: { modifierType: 'fixed', value: 100 } },
            { name: '32GB', value: 32, pricingModifiers: { modifierType: 'fixed', value: 200 } }
        ];

        for (const [index, ram] of ramValues.entries()) {
            await AttributeValue.create({
                attributeType: ramType._id,
                name: ram.name,
                displayName: ram.name,
                slug: ram.name.toLowerCase(),
                code: `RAM-${ram.name}`,
                value: ram.value,
                pricingModifiers: ram.pricingModifiers,
                visualData: { swatchType: 'text' },
                displayOrder: index + 1
            });
        }

        // STORAGE VALUES
        const storageValues = [
            { name: '128GB', value: 128, pricingModifiers: { modifierType: 'none', value: 0 } },
            { name: '256GB', value: 256, pricingModifiers: { modifierType: 'fixed', value: 100 } },
            { name: '512GB', value: 512, pricingModifiers: { modifierType: 'fixed', value: 200 } },
            { name: '1TB', value: 1024, pricingModifiers: { modifierType: 'fixed', value: 400 } }
        ];

        for (const [index, storage] of storageValues.entries()) {
            await AttributeValue.create({
                attributeType: storageType._id,
                name: storage.name,
                displayName: storage.name,
                slug: storage.name.toLowerCase(),
                code: `STORAGE-${storage.name}`,
                value: storage.value,
                pricingModifiers: storage.pricingModifiers,
                visualData: { swatchType: 'text' },
                displayOrder: index + 1
            });
        }

        // MATERIAL VALUES
        const materialValues = ['Cotton', 'Polyester', 'Silk', 'Wool', 'Leather'];

        for (const [index, material] of materialValues.entries()) {
            await AttributeValue.create({
                attributeType: materialType._id,
                name: material.toUpperCase(),
                displayName: material,
                slug: material.toLowerCase(),
                code: `MATERIAL-${material.toUpperCase()}`,
                visualData: { swatchType: 'text' },
                displayOrder: index + 1
            });
        }

        console.log('✅ Created attribute values:');
        console.log(`   - Sizes: ${sizeValues.length}`);
        console.log(`   - Colors: ${colorValues.length}`);
        console.log(`   - RAM: ${ramValues.length}`);
        console.log(`   - Storage: ${storageValues.length}`);
        console.log(`   - Materials: ${materialValues.length}`);

        console.log('\n✅ Unified Attribute System seeded successfully!');
        console.log('\n📊 Summary:');
        console.log('   - 5 Attribute Types created');
        console.log('   - 24 Attribute Values created');
        console.log('\n🎯 You can now add ANY new attribute without code changes!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding unified attributes:', error);
        process.exit(1);
    }
};

seedUnifiedAttributes();
