import mongoose from 'mongoose';
import Product from '../models/Product/ProductSchema.js';
import ProductVariant from '../models/variant/productVariantSchema.js';
import Category from '../models/Category/CategorySchema.js';
import Brand from '../models/Brands/BrandsSchema.js';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import InventoryService from '../services/inventory.service.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

/**
 * Seed Database with Sample E-commerce Data
 * Creates: Categories, Brands, Products, Variants, and Inventory
 */
async function seedDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Step 0: Clear Database
        console.log('🧹 Clearing existing data...');
        await Promise.all([
            Category.deleteMany({}),
            Brand.deleteMany({}),
            Product.deleteMany({}),
            ProductVariant.deleteMany({}),
            InventoryMaster.deleteMany({})
        ]);
        // Also clear inventory if possible, but we don't have the model import here directly, 
        // relying on InventoryService might be tricky if it doesn't expose delete.
        // But since we are deleting products/variants, inventory links will be broken anyway.
        // Let's rely on the diagnostic script to check for clean state or just let it be.
        // Actually, let's try to clear InventoryMaster using the service if possible or a direct model if imported.
        // We didn't import InventoryMaster model directly. Let's add it or skip for now.
        // Ideally we should import InventoryMaster to clean it too.
        console.log('✅ Database cleared\n');

        // Step 1: Create Categories
        console.log('📁 Creating Categories...');

        const electronicsCategory = await Category.create({
            name: 'Electronics',
            slug: 'electronics',
            description: 'Electronic devices and gadgets',
            status: 'active',
            priority: 1
        });

        const mobilesCategory = await Category.create({
            name: 'Smartphones',
            slug: 'smartphones',
            description: 'Latest smartphones and mobile devices',
            parentId: electronicsCategory._id,
            status: 'active',
            priority: 1
        });

        const accessoriesCategory = await Category.create({
            name: 'Mobile Accessories',
            slug: 'mobile-accessories',
            description: 'Cases, chargers, and more',
            parentId: electronicsCategory._id,
            status: 'active',
            priority: 2
        });

        console.log(`✅ Created ${3} categories\n`);

        // Step 2: Create Brands
        console.log('🏷️  Creating Brands...');

        const samsung = await Brand.create({
            name: 'Samsung',
            slug: 'samsung',
            description: 'Samsung Electronics',
            status: 'active'
        });

        const apple = await Brand.create({
            name: 'Apple',
            slug: 'apple',
            description: 'Apple Inc.',
            status: 'active'
        });

        const oneplus = await Brand.create({
            name: 'OnePlus',
            slug: 'oneplus',
            description: 'OnePlus Technology',
            status: 'active'
        });

        console.log(`✅ Created ${3} brands\n`);

        // Step 3: Create Products
        console.log('📦 Creating Products...');

        const products = [];

        // Product 1: Samsung Galaxy S23
        const galaxyS23 = await Product.create({
            name: 'Samsung Galaxy S23 Ultra 5G',
            slug: 'samsung-galaxy-s23-ultra',
            sku: 'SGS23-ULTRA-5G',  // Added SKU
            description: 'Samsung Galaxy S23 Ultra 5G (Titanium Black, 12GB RAM, 256GB Storage) with Snapdragon 8 Elite, 200MP Camera with ProVisual Engine, 5000mAh Battery',
            category: mobilesCategory._id,
            brand: samsung._id,
            basePrice: 129999,
            price: 129999,
            hasVariants: true,
            tags: ['Best Seller', 'Trending', '5G'],
            status: 'active', // Fixed: isActive -> status
            featured: true,   // Fixed: isFeatured -> featured
            rating: 4.5,
            reviewCount: 1234
        });
        products.push(galaxyS23);

        // Product 2: iPhone 15 Pro
        const iphone15 = await Product.create({
            name: 'Apple iPhone 15 Pro',
            slug: 'apple-iphone-15-pro',
            sku: 'IPHONE-15-PRO', // Added SKU
            description: 'Apple iPhone 15 Pro (Natural Titanium, 128GB) with A17 Pro chip, ProMotion display, and advanced camera system',
            category: mobilesCategory._id,
            brand: apple._id,
            basePrice: 134900,
            price: 134900,
            hasVariants: true,
            tags: ['Premium', 'New Launch'],
            status: 'active',
            featured: true,
            rating: 4.7,
            reviewCount: 892
        });
        products.push(iphone15);

        // Product 3: OnePlus 12
        const oneplus12 = await Product.create({
            name: 'OnePlus 12',
            slug: 'oneplus-12',
            sku: 'ONEPLUS-12', // Added SKU
            description: 'OnePlus 12 (Flowy Emerald, 12GB RAM, 256GB Storage) with Snapdragon 8 Gen 3, 50MP Hasselblad Camera',
            category: mobilesCategory._id,
            brand: oneplus._id,
            basePrice: 64999,
            price: 64999,
            hasVariants: true,
            tags: ['Best Value', 'Fast Charging'],
            status: 'active',
            featured: true,
            rating: 4.4,
            reviewCount: 567
        });
        products.push(oneplus12);

        console.log(`✅ Created ${products.length} products\n`);

        // Step 4: Create Variants
        console.log('🎨 Creating Variants...');

        let totalVariants = 0;

        // Samsung Galaxy S23 Variants
        const s23Variants = [
            { color: 'Phantom Black', storage: '128GB', price: 124999, stock: 50 },
            { color: 'Phantom Black', storage: '256GB', price: 129999, stock: 35 },
            { color: 'Phantom Black', storage: '512GB', price: 139999, stock: 20 },
            { color: 'Green', storage: '128GB', price: 124999, stock: 40 },
            { color: 'Green', storage: '256GB', price: 129999, stock: 30 },
            { color: 'Cream', storage: '256GB', price: 129999, stock: 25 }
        ];

        for (const [index, variantData] of s23Variants.entries()) {
            const variant = await ProductVariant.create({
                productId: galaxyS23._id,
                sku: `SGS23-${variantData.color.substring(0, 3).toUpperCase()}-${variantData.storage}`,
                attributes: {
                    color: variantData.color,
                    storage: variantData.storage
                },
                price: variantData.price,
                stock: variantData.stock,
                status: true // Fixed: isActive -> status
            });

            // Auto-create inventory
            await InventoryService.autoCreateInventoryForVariant(variant, 'SEED_SCRIPT');

            // Update stock
            await InventoryService.updateStock(
                variant._id,
                variantData.stock,
                'INITIAL_STOCK',
                'SEED_SCRIPT',
                'Initial stock from seed script'
            );

            totalVariants++;
        }

        // iPhone 15 Pro Variants
        const iphone15Variants = [
            { color: 'Natural Titanium', storage: '128GB', price: 134900, stock: 30 },
            { color: 'Natural Titanium', storage: '256GB', price: 144900, stock: 25 },
            { color: 'Blue Titanium', storage: '128GB', price: 134900, stock: 28 },
            { color: 'Blue Titanium', storage: '256GB', price: 144900, stock: 22 },
            { color: 'Black Titanium', storage: '256GB', price: 144900, stock: 20 }
        ];

        for (const variantData of iphone15Variants) {
            const variant = await ProductVariant.create({
                productId: iphone15._id,
                sku: `IP15P-${variantData.color.substring(0, 3).toUpperCase()}-${variantData.storage}`,
                attributes: {
                    color: variantData.color,
                    storage: variantData.storage
                },
                price: variantData.price,
                stock: variantData.stock,
                status: true // Fixed
            });

            await InventoryService.autoCreateInventoryForVariant(variant, 'SEED_SCRIPT');
            await InventoryService.updateStock(
                variant._id,
                variantData.stock,
                'INITIAL_STOCK',
                'SEED_SCRIPT',
                'Initial stock from seed script'
            );

            totalVariants++;
        }

        // OnePlus 12 Variants
        const oneplus12Variants = [
            { color: 'Flowy Emerald', storage: '256GB', price: 64999, stock: 45 },
            { color: 'Flowy Emerald', storage: '512GB', price: 69999, stock: 30 },
            { color: 'Silky Black', storage: '256GB', price: 64999, stock: 40 },
            { color: 'Silky Black', storage: '512GB', price: 69999, stock: 25 }
        ];

        for (const variantData of oneplus12Variants) {
            const variant = await ProductVariant.create({
                productId: oneplus12._id,
                sku: `OP12-${variantData.color.substring(0, 3).toUpperCase()}-${variantData.storage}`,
                attributes: {
                    color: variantData.color,
                    storage: variantData.storage
                },
                price: variantData.price,
                stock: variantData.stock,
                status: true // Fixed
            });

            await InventoryService.autoCreateInventoryForVariant(variant, 'SEED_SCRIPT');
            await InventoryService.updateStock(
                variant._id,
                variantData.stock,
                'INITIAL_STOCK',
                'SEED_SCRIPT',
                'Initial stock from seed script'
            );

            totalVariants++;
        }

        console.log(`✅ Created ${totalVariants} variants\n`);
        console.log(`✅ Auto-created ${totalVariants} inventory records\n`);

        // Final Summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 DATABASE SEEDING COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('📊 Summary:');
        console.log(`   Categories: 3`);
        console.log(`   Brands: 3`);
        console.log(`   Products: ${products.length}`);
        console.log(`   Variants: ${totalVariants}`);
        console.log(`   Inventory Records: ${totalVariants}\n`);

        console.log('📦 Products Created:');
        console.log('   1. Samsung Galaxy S23 Ultra (6 variants)');
        console.log('   2. Apple iPhone 15 Pro (5 variants)');
        console.log('   3. OnePlus 12 (4 variants)\n');

        console.log('✅ Your e-commerce database is now ready!');
        console.log('✅ Visit your website to see the products!\n');

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the seed script
seedDatabase();
