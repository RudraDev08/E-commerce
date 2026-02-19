import mongoose from 'mongoose';
import SizeMaster from '../models/masters/SizeMaster.enterprise.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleSizes = [
    // Clothing Alpha - Men's
    {
        value: 'XS',
        displayName: 'Extra Small',
        category: 'CLOTHING',
        gender: 'MEN',
        primaryRegion: 'US',
        normalizedRank: 10,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'CM',
            min: 86,
            max: 91,
            typical: 88,
            equivalentCm: 88,
            equivalentInch: 34
        }
    },
    {
        value: 'S',
        displayName: 'Small',
        category: 'CLOTHING',
        gender: 'MEN',
        primaryRegion: 'US',
        normalizedRank: 20,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'CM',
            min: 91,
            max: 96,
            typical: 93,
            equivalentCm: 93,
            equivalentInch: 36
        }
    },
    {
        value: 'M',
        displayName: 'Medium',
        category: 'CLOTHING',
        gender: 'MEN',
        primaryRegion: 'US',
        normalizedRank: 30,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'CM',
            min: 96,
            max: 101,
            typical: 98,
            equivalentCm: 98,
            equivalentInch: 38
        }
    },
    {
        value: 'L',
        displayName: 'Large',
        category: 'CLOTHING',
        gender: 'MEN',
        primaryRegion: 'US',
        normalizedRank: 40,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'CM',
            min: 101,
            max: 106,
            typical: 103,
            equivalentCm: 103,
            equivalentInch: 40
        }
    },
    {
        value: 'XL',
        displayName: 'Extra Large',
        category: 'CLOTHING',
        gender: 'MEN',
        primaryRegion: 'US',
        normalizedRank: 50,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'CM',
            min: 106,
            max: 111,
            typical: 108,
            equivalentCm: 108,
            equivalentInch: 42
        }
    },
    {
        value: 'XXL',
        displayName: 'Double Extra Large',
        category: 'CLOTHING',
        gender: 'MEN',
        primaryRegion: 'US',
        normalizedRank: 60,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'CM',
            min: 111,
            max: 116,
            typical: 113,
            equivalentCm: 113,
            equivalentInch: 44
        }
    },

    // Clothing Numeric - Men's (Pants)
    {
        value: '28',
        displayName: 'Size 28',
        category: 'CLOTHING',
        gender: 'MEN',
        primaryRegion: 'US',
        normalizedRank: 28,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'IN',
            equivalentInch: 28,
            equivalentCm: 71
        }
    },
    {
        value: '30',
        displayName: 'Size 30',
        category: 'CLOTHING',
        gender: 'MEN',
        primaryRegion: 'US',
        normalizedRank: 30,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'IN',
            equivalentInch: 30,
            equivalentCm: 76
        }
    },
    {
        value: '32',
        displayName: 'Size 32',
        category: 'CLOTHING',
        gender: 'MEN',
        primaryRegion: 'US',
        normalizedRank: 32,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'IN',
            equivalentInch: 32,
            equivalentCm: 81
        }
    },
    {
        value: '34',
        displayName: 'Size 34',
        category: 'CLOTHING',
        gender: 'MEN',
        primaryRegion: 'US',
        normalizedRank: 34,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'IN',
            equivalentInch: 34,
            equivalentCm: 86
        }
    },

    // Footwear UK - Men's
    {
        value: '6',
        displayName: 'UK Size 6',
        category: 'FOOTWEAR',
        gender: 'MEN',
        primaryRegion: 'UK',
        normalizedRank: 60,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'CM',
            equivalentCm: 24.5
        },
        conversions: [
            { region: 'US', value: '7' },
            { region: 'EU', value: '39' }
        ]
    },
    {
        value: '7',
        displayName: 'UK Size 7',
        category: 'FOOTWEAR',
        gender: 'MEN',
        primaryRegion: 'UK',
        normalizedRank: 70,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'CM',
            equivalentCm: 25.5
        },
        conversions: [
            { region: 'US', value: '8' },
            { region: 'EU', value: '40' }
        ]
    },
    {
        value: '8',
        displayName: 'UK Size 8',
        category: 'FOOTWEAR',
        gender: 'MEN',
        primaryRegion: 'UK',
        normalizedRank: 80,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'CM',
            equivalentCm: 26.5
        },
        conversions: [
            { region: 'US', value: '9' },
            { region: 'EU', value: '42' }
        ]
    },
    {
        value: '9',
        displayName: 'UK Size 9',
        category: 'FOOTWEAR',
        gender: 'MEN',
        primaryRegion: 'UK',
        normalizedRank: 90,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'CM',
            equivalentCm: 27.5
        },
        conversions: [
            { region: 'US', value: '10' },
            { region: 'EU', value: '43' }
        ]
    },
    {
        value: '10',
        displayName: 'UK Size 10',
        category: 'FOOTWEAR',
        gender: 'MEN',
        primaryRegion: 'UK',
        normalizedRank: 100,
        lifecycleState: 'ACTIVE',
        measurements: {
            unit: 'CM',
            equivalentCm: 28.5
        },
        conversions: [
            { region: 'US', value: '11' },
            { region: 'EU', value: '44' }
        ]
    },

    // Generic
    {
        value: 'ONE SIZE',
        displayName: 'One Size Fits All',
        category: 'ACCESSORIES',
        gender: 'UNISEX',
        primaryRegion: 'GLOBAL',
        normalizedRank: 1,
        lifecycleState: 'ACTIVE'
    },
    {
        value: 'FREE SIZE',
        displayName: 'Free Size',
        category: 'CLOTHING',
        gender: 'UNISEX',
        primaryRegion: 'GLOBAL',
        normalizedRank: 1,
        lifecycleState: 'ACTIVE'
    }
];

const seedSizes = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing sizes (optional, or use update)
        // await SizeMaster.deleteMany({});
        // console.log('🗑️  Cleared existing sizes');

        // Upsert sizes
        let count = 0;


        for (const sizeData of sampleSizes) {
            let size = await SizeMaster.findOne({
                value: sizeData.value,
                category: sizeData.category,
                gender: sizeData.gender,
                primaryRegion: sizeData.primaryRegion
            });

            if (!size) {
                // Determine if we need to set canonical ID manually if middleware fails or just rely on it
                // Using new SizeMaster() should trigger pre('validate') on save()
                size = new SizeMaster(sizeData);
            } else {
                Object.assign(size, sizeData);
            }

            await size.save();
            count++;
        }

        console.log(`✅ Upserted ${count} sample sizes`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding sizes:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Field '${key}': ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
};

seedSizes();
