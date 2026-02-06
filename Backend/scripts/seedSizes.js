import mongoose from 'mongoose';
import Size from '../models/Size.model.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleSizes = [
    // Clothing Alpha - Men's
    {
        name: 'XS',
        code: 'CLOTH-ALPHA-XS-M',
        fullName: 'Extra Small',
        abbreviation: 'XS',
        category: 'clothing_alpha',
        sizeGroup: "Men's Clothing",
        gender: 'men',
        displayOrder: 1,
        measurements: {
            chest: 86,
            waist: 76,
            hip: 91,
            shoulder: 42
        },
        status: 'active'
    },
    {
        name: 'S',
        code: 'CLOTH-ALPHA-S-M',
        fullName: 'Small',
        abbreviation: 'S',
        category: 'clothing_alpha',
        sizeGroup: "Men's Clothing",
        gender: 'men',
        displayOrder: 2,
        measurements: {
            chest: 91,
            waist: 81,
            hip: 96,
            shoulder: 44
        },
        status: 'active'
    },
    {
        name: 'M',
        code: 'CLOTH-ALPHA-M-M',
        fullName: 'Medium',
        abbreviation: 'M',
        category: 'clothing_alpha',
        sizeGroup: "Men's Clothing",
        gender: 'men',
        displayOrder: 3,
        measurements: {
            chest: 96,
            waist: 86,
            hip: 101,
            shoulder: 46
        },
        status: 'active'
    },
    {
        name: 'L',
        code: 'CLOTH-ALPHA-L-M',
        fullName: 'Large',
        abbreviation: 'L',
        category: 'clothing_alpha',
        sizeGroup: "Men's Clothing",
        gender: 'men',
        displayOrder: 4,
        measurements: {
            chest: 101,
            waist: 91,
            hip: 106,
            shoulder: 48
        },
        status: 'active'
    },
    {
        name: 'XL',
        code: 'CLOTH-ALPHA-XL-M',
        fullName: 'Extra Large',
        abbreviation: 'XL',
        category: 'clothing_alpha',
        sizeGroup: "Men's Clothing",
        gender: 'men',
        displayOrder: 5,
        measurements: {
            chest: 106,
            waist: 96,
            hip: 111,
            shoulder: 50
        },
        status: 'active'
    },
    {
        name: 'XXL',
        code: 'CLOTH-ALPHA-XXL-M',
        fullName: 'Double Extra Large',
        abbreviation: 'XXL',
        category: 'clothing_alpha',
        sizeGroup: "Men's Clothing",
        gender: 'men',
        displayOrder: 6,
        measurements: {
            chest: 111,
            waist: 101,
            hip: 116,
            shoulder: 52
        },
        status: 'active'
    },

    // Clothing Numeric - Men's
    {
        name: '28',
        code: 'CLOTH-NUM-28-M',
        fullName: 'Size 28',
        abbreviation: '28',
        category: 'clothing_numeric',
        sizeGroup: "Men's Pants",
        gender: 'men',
        displayOrder: 1,
        measurements: {
            waist: 71,
            hip: 86
        },
        status: 'active'
    },
    {
        name: '30',
        code: 'CLOTH-NUM-30-M',
        fullName: 'Size 30',
        abbreviation: '30',
        category: 'clothing_numeric',
        sizeGroup: "Men's Pants",
        gender: 'men',
        displayOrder: 2,
        measurements: {
            waist: 76,
            hip: 91
        },
        status: 'active'
    },
    {
        name: '32',
        code: 'CLOTH-NUM-32-M',
        fullName: 'Size 32',
        abbreviation: '32',
        category: 'clothing_numeric',
        sizeGroup: "Men's Pants",
        gender: 'men',
        displayOrder: 3,
        measurements: {
            waist: 81,
            hip: 96
        },
        status: 'active'
    },
    {
        name: '34',
        code: 'CLOTH-NUM-34-M',
        fullName: 'Size 34',
        abbreviation: '34',
        category: 'clothing_numeric',
        sizeGroup: "Men's Pants",
        gender: 'men',
        displayOrder: 4,
        measurements: {
            waist: 86,
            hip: 101
        },
        status: 'active'
    },

    // Shoes UK - Men's
    {
        name: '6',
        code: 'SHOE-UK-6-M',
        fullName: 'UK Size 6',
        abbreviation: '6',
        category: 'shoe_uk',
        sizeGroup: "Men's Footwear",
        gender: 'men',
        displayOrder: 1,
        measurements: {
            footLength: 24.5
        },
        internationalConversions: {
            uk: '6',
            us: '7',
            eu: '39',
            cm: 24.5
        },
        status: 'active'
    },
    {
        name: '7',
        code: 'SHOE-UK-7-M',
        fullName: 'UK Size 7',
        abbreviation: '7',
        category: 'shoe_uk',
        sizeGroup: "Men's Footwear",
        gender: 'men',
        displayOrder: 2,
        measurements: {
            footLength: 25.5
        },
        internationalConversions: {
            uk: '7',
            us: '8',
            eu: '40',
            cm: 25.5
        },
        status: 'active'
    },
    {
        name: '8',
        code: 'SHOE-UK-8-M',
        fullName: 'UK Size 8',
        abbreviation: '8',
        category: 'shoe_uk',
        sizeGroup: "Men's Footwear",
        gender: 'men',
        displayOrder: 3,
        measurements: {
            footLength: 26.5
        },
        internationalConversions: {
            uk: '8',
            us: '9',
            eu: '42',
            cm: 26.5
        },
        status: 'active'
    },
    {
        name: '9',
        code: 'SHOE-UK-9-M',
        fullName: 'UK Size 9',
        abbreviation: '9',
        category: 'shoe_uk',
        sizeGroup: "Men's Footwear",
        gender: 'men',
        displayOrder: 4,
        measurements: {
            footLength: 27.5
        },
        internationalConversions: {
            uk: '9',
            us: '10',
            eu: '43',
            cm: 27.5
        },
        status: 'active'
    },
    {
        name: '10',
        code: 'SHOE-UK-10-M',
        fullName: 'UK Size 10',
        abbreviation: '10',
        category: 'shoe_uk',
        sizeGroup: "Men's Footwear",
        gender: 'men',
        displayOrder: 5,
        measurements: {
            footLength: 28.5
        },
        internationalConversions: {
            uk: '10',
            us: '11',
            eu: '44',
            cm: 28.5
        },
        status: 'active'
    },

    // Generic Sizes
    {
        name: 'SMALL',
        code: 'GENERIC-SMALL',
        fullName: 'Small',
        abbreviation: 'S',
        category: 'generic',
        sizeGroup: 'Generic',
        gender: 'unisex',
        displayOrder: 1,
        status: 'active'
    },
    {
        name: 'MEDIUM',
        code: 'GENERIC-MEDIUM',
        fullName: 'Medium',
        abbreviation: 'M',
        category: 'generic',
        sizeGroup: 'Generic',
        gender: 'unisex',
        displayOrder: 2,
        status: 'active'
    },
    {
        name: 'LARGE',
        code: 'GENERIC-LARGE',
        fullName: 'Large',
        abbreviation: 'L',
        category: 'generic',
        sizeGroup: 'Generic',
        gender: 'unisex',
        displayOrder: 3,
        status: 'active'
    },

    // Custom Sizes
    {
        name: 'ONE SIZE',
        code: 'CUSTOM-ONE-SIZE',
        fullName: 'One Size Fits All',
        abbreviation: 'OS',
        category: 'custom',
        sizeGroup: 'Universal',
        gender: 'unisex',
        displayOrder: 1,
        status: 'active'
    },
    {
        name: 'FREE SIZE',
        code: 'CUSTOM-FREE-SIZE',
        fullName: 'Free Size',
        abbreviation: 'FS',
        category: 'custom',
        sizeGroup: 'Universal',
        gender: 'unisex',
        displayOrder: 2,
        status: 'active'
    }
];

const seedSizes = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing sizes
        await Size.deleteMany({});
        console.log('🗑️  Cleared existing sizes');

        // Generate slugs for all sizes
        const sizesWithSlugs = sampleSizes.map(size => ({
            ...size,
            slug: `${size.category}-${size.name.toLowerCase().replace(/\s+/g, '-')}-${size.gender}`
        }));

        // Insert sample sizes
        const insertedSizes = await Size.insertMany(sizesWithSlugs);
        console.log(`✅ Inserted ${insertedSizes.length} sample sizes`);

        // Display summary
        const summary = await Size.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📊 Size Summary by Category:');
        summary.forEach(item => {
            console.log(`   ${item._id}: ${item.count} sizes`);
        });

        console.log('\n✅ Size Master seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding sizes:', error);
        process.exit(1);
    }
};

seedSizes();
