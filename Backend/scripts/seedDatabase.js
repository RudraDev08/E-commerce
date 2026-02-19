const mongoose = require('mongoose');
const SizeMaster = require('../models/masters/SizeMaster.enterprise.js').default;
const ColorMaster = require('../models/masters/ColorMaster.enterprise.js').default || require('../models/masters/ColorMaster.enterprise.js');
const WarehouseMaster = require('../models/WarehouseMaster');
const VariantMaster = require('../models/masters/VariantMaster.enterprise.js').default || require('../models/masters/VariantMaster.enterprise.js');
const VariantInventory = require('../models/VariantInventory');

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await Promise.all([
            SizeMaster.deleteMany({}),
            ColorMaster.deleteMany({}),
            WarehouseMaster.deleteMany({}),
            VariantMaster.deleteMany({}),
            VariantInventory.deleteMany({})
        ]);

        // ========================================
        // 1. CREATE SIZE MASTERS
        // ========================================
        console.log('📏 Creating size masters...');
        const sizes = await SizeMaster.create([
            // Storage sizes
            { category: 'storage', value: '128GB', displayName: '128 GB', sortOrder: 1 },
            { category: 'storage', value: '256GB', displayName: '256 GB', sortOrder: 2 },
            { category: 'storage', value: '512GB', displayName: '512 GB', sortOrder: 3 },
            { category: 'storage', value: '1TB', displayName: '1 TB', sortOrder: 4 },

            // RAM sizes
            { category: 'ram', value: '6GB', displayName: '6 GB RAM', sortOrder: 1 },
            { category: 'ram', value: '8GB', displayName: '8 GB RAM', sortOrder: 2 },
            { category: 'ram', value: '12GB', displayName: '12 GB RAM', sortOrder: 3 },
            { category: 'ram', value: '16GB', displayName: '16 GB RAM', sortOrder: 4 },

            // Clothing sizes
            { category: 'clothing', value: 'XS', displayName: 'Extra Small', sortOrder: 1 },
            { category: 'clothing', value: 'S', displayName: 'Small', sortOrder: 2 },
            { category: 'clothing', value: 'M', displayName: 'Medium', sortOrder: 3 },
            { category: 'clothing', value: 'L', displayName: 'Large', sortOrder: 4 },
            { category: 'clothing', value: 'XL', displayName: 'Extra Large', sortOrder: 5 },

            // Shoe sizes
            { category: 'shoe', value: '7', displayName: 'UK 7', sortOrder: 1 },
            { category: 'shoe', value: '8', displayName: 'UK 8', sortOrder: 2 },
            { category: 'shoe', value: '9', displayName: 'UK 9', sortOrder: 3 },
            { category: 'shoe', value: '10', displayName: 'UK 10', sortOrder: 4 }
        ]);

        console.log(`   ✓ Created ${sizes.length} sizes`);

        // ========================================
        // 2. CREATE COLOR MASTERS
        // ========================================
        console.log('🎨 Creating color masters...');
        const colors = await ColorMaster.create([
            { name: 'Phantom Black', hexCode: '#1a1a1a', category: 'solid' },
            { name: 'Phantom Silver', hexCode: '#c0c0c0', category: 'metallic' },
            { name: 'Phantom Green', hexCode: '#2d5016', category: 'solid' },
            { name: 'Phantom Blue', hexCode: '#1e3a8a', category: 'solid' },
            { name: 'Rose Gold', hexCode: '#b76e79', category: 'metallic' },
            { name: 'Midnight Purple', hexCode: '#4c1d95', category: 'solid' },
            { name: 'Arctic White', hexCode: '#f8fafc', category: 'solid' },
            { name: 'Crimson Red', hexCode: '#dc2626', category: 'solid' }
        ]);

        console.log(`   ✓ Created ${colors.length} colors`);

        // ========================================
        // 3. CREATE WAREHOUSES
        // ========================================
        console.log('🏭 Creating warehouses...');
        const warehouses = await WarehouseMaster.create([
            {
                name: 'Main Warehouse - Delhi',
                code: 'WH-DEL',
                address: {
                    street: 'Sector 18',
                    city: 'New Delhi',
                    state: 'Delhi',
                    country: 'India',
                    zipCode: '110001'
                },
                isDefault: true,
                isActive: true
            },
            {
                name: 'Mumbai Distribution Center',
                code: 'WH-MUM',
                address: {
                    street: 'Andheri East',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    country: 'India',
                    zipCode: '400069'
                },
                isDefault: false,
                isActive: true
            },
            {
                name: 'Bangalore Tech Hub',
                code: 'WH-BLR',
                address: {
                    street: 'Whitefield',
                    city: 'Bangalore',
                    state: 'Karnataka',
                    country: 'India',
                    zipCode: '560066'
                },
                isDefault: false,
                isActive: true
            }
        ]);

        console.log(`   ✓ Created ${warehouses.length} warehouses`);

        // ========================================
        // 4. CREATE VARIANTS (Samsung Fold 6)
        // ========================================
        console.log('📱 Creating Samsung Fold 6 variants...');

        const storage512 = sizes.find(s => s.category === 'storage' && s.value === '512GB');
        const storage256 = sizes.find(s => s.category === 'storage' && s.value === '256GB');
        const ram12 = sizes.find(s => s.category === 'ram' && s.value === '12GB');
        const ram8 = sizes.find(s => s.category === 'ram' && s.value === '8GB');

        const blackColor = colors.find(c => c.name === 'Phantom Black');
        const silverColor = colors.find(c => c.name === 'Phantom Silver');
        const greenColor = colors.find(c => c.name === 'Phantom Green');

        const fold6Variants = [];

        // Variant 1: 512GB + 12GB RAM + Black
        fold6Variants.push(await VariantMaster.create({
            productGroup: 'FOLD6_2024',
            productName: 'Samsung Galaxy Z Fold 6',
            brand: 'Samsung',
            category: 'Smartphones',
            subcategory: 'Foldable',
            sku: 'SAM-FOLD6-512GB-12GB-BLK',
            color: blackColor._id,
            sizes: [
                { sizeId: storage512._id, category: 'storage', value: '512GB' },
                { sizeId: ram12._id, category: 'ram', value: '12GB' }
            ],
            price: 164999,
            compareAtPrice: 174999,
            costPrice: 140000,
            weight: 239,
            dimensions: { length: 15.5, width: 6.7, height: 0.6, unit: 'cm' },
            description: 'Experience the future of mobile technology with the Samsung Galaxy Z Fold 6. Featuring a stunning foldable display, powerful performance, and cutting-edge camera system.',
            specifications: {
                display: '7.6" Dynamic AMOLED 2X',
                processor: 'Snapdragon 8 Gen 3',
                battery: '4400mAh',
                camera: '50MP + 12MP + 10MP',
                frontCamera: '10MP + 4MP Under Display',
                os: 'Android 14 with One UI 6.1'
            },
            images: [
                {
                    url: 'https://images.samsung.com/is/image/samsung/p6pim/in/2407/gallery/in-galaxy-z-fold6-f956-sm-f956bzkainu-542628046',
                    thumbnailUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/2407/gallery/in-galaxy-z-fold6-f956-sm-f956bzkainu-542628046?$320_320_PNG$',
                    isPrimary: true,
                    sortOrder: 0,
                    altText: 'Samsung Galaxy Z Fold 6 Phantom Black Front View'
                },
                {
                    url: 'https://images.samsung.com/is/image/samsung/p6pim/in/2407/gallery/in-galaxy-z-fold6-f956-sm-f956bzkainu-542628047',
                    thumbnailUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/2407/gallery/in-galaxy-z-fold6-f956-sm-f956bzkainu-542628047?$320_320_PNG$',
                    isPrimary: false,
                    sortOrder: 1,
                    altText: 'Samsung Galaxy Z Fold 6 Unfolded View'
                }
            ],
            status: 'active'
        }));

        // Variant 2: 512GB + 12GB RAM + Silver
        fold6Variants.push(await VariantMaster.create({
            productGroup: 'FOLD6_2024',
            productName: 'Samsung Galaxy Z Fold 6',
            brand: 'Samsung',
            category: 'Smartphones',
            subcategory: 'Foldable',
            sku: 'SAM-FOLD6-512GB-12GB-SLV',
            color: silverColor._id,
            sizes: [
                { sizeId: storage512._id, category: 'storage', value: '512GB' },
                { sizeId: ram12._id, category: 'ram', value: '12GB' }
            ],
            price: 164999,
            compareAtPrice: 174999,
            costPrice: 140000,
            weight: 239,
            dimensions: { length: 15.5, width: 6.7, height: 0.6, unit: 'cm' },
            description: 'Experience the future of mobile technology with the Samsung Galaxy Z Fold 6. Featuring a stunning foldable display, powerful performance, and cutting-edge camera system.',
            specifications: {
                display: '7.6" Dynamic AMOLED 2X',
                processor: 'Snapdragon 8 Gen 3',
                battery: '4400mAh',
                camera: '50MP + 12MP + 10MP',
                frontCamera: '10MP + 4MP Under Display',
                os: 'Android 14 with One UI 6.1'
            },
            images: [
                {
                    url: 'https://images.samsung.com/is/image/samsung/p6pim/in/2407/gallery/in-galaxy-z-fold6-f956-sm-f956bzsainu-542628066',
                    isPrimary: true,
                    sortOrder: 0,
                    altText: 'Samsung Galaxy Z Fold 6 Phantom Silver'
                }
            ],
            status: 'active'
        }));

        // Variant 3: 256GB + 8GB RAM + Black
        fold6Variants.push(await VariantMaster.create({
            productGroup: 'FOLD6_2024',
            productName: 'Samsung Galaxy Z Fold 6',
            brand: 'Samsung',
            category: 'Smartphones',
            subcategory: 'Foldable',
            sku: 'SAM-FOLD6-256GB-8GB-BLK',
            color: blackColor._id,
            sizes: [
                { sizeId: storage256._id, category: 'storage', value: '256GB' },
                { sizeId: ram8._id, category: 'ram', value: '8GB' }
            ],
            price: 154999,
            compareAtPrice: 164999,
            costPrice: 130000,
            weight: 239,
            dimensions: { length: 15.5, width: 6.7, height: 0.6, unit: 'cm' },
            description: 'Experience the future of mobile technology with the Samsung Galaxy Z Fold 6. Featuring a stunning foldable display, powerful performance, and cutting-edge camera system.',
            specifications: {
                display: '7.6" Dynamic AMOLED 2X',
                processor: 'Snapdragon 8 Gen 3',
                battery: '4400mAh',
                camera: '50MP + 12MP + 10MP',
                frontCamera: '10MP + 4MP Under Display',
                os: 'Android 14 with One UI 6.1'
            },
            images: [
                {
                    url: 'https://images.samsung.com/is/image/samsung/p6pim/in/2407/gallery/in-galaxy-z-fold6-f956-sm-f956bzkainu-542628046',
                    isPrimary: true,
                    sortOrder: 0,
                    altText: 'Samsung Galaxy Z Fold 6 Phantom Black'
                }
            ],
            status: 'active'
        }));

        // Variant 4: 256GB + 8GB RAM + Green
        fold6Variants.push(await VariantMaster.create({
            productGroup: 'FOLD6_2024',
            productName: 'Samsung Galaxy Z Fold 6',
            brand: 'Samsung',
            category: 'Smartphones',
            subcategory: 'Foldable',
            sku: 'SAM-FOLD6-256GB-8GB-GRN',
            color: greenColor._id,
            sizes: [
                { sizeId: storage256._id, category: 'storage', value: '256GB' },
                { sizeId: ram8._id, category: 'ram', value: '8GB' }
            ],
            price: 154999,
            compareAtPrice: null,
            costPrice: 130000,
            weight: 239,
            dimensions: { length: 15.5, width: 6.7, height: 0.6, unit: 'cm' },
            description: 'Experience the future of mobile technology with the Samsung Galaxy Z Fold 6. Featuring a stunning foldable display, powerful performance, and cutting-edge camera system.',
            specifications: {
                display: '7.6" Dynamic AMOLED 2X',
                processor: 'Snapdragon 8 Gen 3',
                battery: '4400mAh',
                camera: '50MP + 12MP + 10MP',
                frontCamera: '10MP + 4MP Under Display',
                os: 'Android 14 with One UI 6.1'
            },
            images: [
                {
                    url: 'https://images.samsung.com/is/image/samsung/p6pim/in/2407/gallery/in-galaxy-z-fold6-f956-sm-f956blgainu-542628086',
                    isPrimary: true,
                    sortOrder: 0,
                    altText: 'Samsung Galaxy Z Fold 6 Phantom Green'
                }
            ],
            status: 'active'
        }));

        console.log(`   ✓ Created ${fold6Variants.length} variants`);

        // ========================================
        // 5. CREATE INVENTORY RECORDS
        // ========================================
        console.log('📦 Creating inventory records...');

        const defaultWarehouse = warehouses.find(w => w.isDefault);
        const inventoryRecords = [];

        for (const variant of fold6Variants) {
            // Create inventory for each warehouse
            for (const warehouse of warehouses) {
                const quantity = warehouse.isDefault ? 50 : Math.floor(Math.random() * 30) + 10;

                inventoryRecords.push(await VariantInventory.create({
                    variant: variant._id,
                    warehouse: warehouse._id,
                    quantity: quantity,
                    reservedQuantity: 0,
                    reorderLevel: 10,
                    reorderQuantity: 20
                }));
            }
        }

        console.log(`   ✓ Created ${inventoryRecords.length} inventory records`);

        // ========================================
        // SUMMARY
        // ========================================
        console.log('\n✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!\n');
        console.log('📊 Summary:');
        console.log(`   • Sizes: ${sizes.length}`);
        console.log(`   • Colors: ${colors.length}`);
        console.log(`   • Warehouses: ${warehouses.length}`);
        console.log(`   • Variants: ${fold6Variants.length}`);
        console.log(`   • Inventory Records: ${inventoryRecords.length}`);
        console.log('\n🚀 You can now test the system with:');
        console.log(`   • Product Group: FOLD6_2024`);
        console.log(`   • API: GET /api/variants/group/FOLD6_2024`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seeding
seedDatabase();
