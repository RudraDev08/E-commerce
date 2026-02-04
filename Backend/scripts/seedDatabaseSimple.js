import mongoose from 'mongoose';
import Product from '../models/Product/ProductSchema.js';
import ProductVariant from '../models/variant/productVariantSchema.js';
import Category from '../models/Category/CategorySchema.js';
import Brand from '../models/Brands/BrandsSchema.js';
import InventoryMaster from '../models/inventory/InventoryMaster.model.js';
import dotenv from 'dotenv';
import slugify from 'slugify';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

async function seedDatabaseSimple() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        // 1. Cleanup
        console.log('🧹 Clearing existing data...');
        await Category.deleteMany({});
        await Brand.deleteMany({});
        await Product.deleteMany({});
        await ProductVariant.deleteMany({});
        await InventoryMaster.deleteMany({});
        console.log('✅ Data cleared\n');

        // 2. Categories
        console.log('📁 Creating Categories...');
        const electronics = await Category.create({
            name: 'Electronics',
            slug: 'electronics',
            description: 'Electronic devices',
            status: 'active',
            priority: 1
        });

        const smartphones = await Category.create({
            name: 'Smartphones',
            slug: 'smartphones',
            parentId: electronics._id,
            status: 'active',
            priority: 1
        });

        const accessories = await Category.create({
            name: 'Mobile Accessories',
            slug: 'mobile-accessories',
            parentId: electronics._id,
            status: 'active',
            priority: 2
        });
        console.log('✅ Categories created');

        // 3. Brands
        console.log('🏷️  Creating Brands...');
        const samsung = await Brand.create({ name: 'Samsung', slug: 'samsung', status: 'active' });
        const apple = await Brand.create({ name: 'Apple', slug: 'apple', status: 'active' });
        const oneplus = await Brand.create({ name: 'OnePlus', slug: 'oneplus', status: 'active' });
        console.log('✅ Brands created');

        // 4. Products & Variants & Inventory
        console.log('📦 Creating Products & Inventory...');

        const productsData = [
            {
                name: 'Samsung Galaxy S23 Ultra 5G',
                sku: 'SGS23-ULTRA',
                brand: samsung,
                price: 124999,
                variants: [
                    { color: 'Phantom Black', storage: '256GB', price: 124999, stock: 50 },
                    { color: 'Green', storage: '256GB', price: 124999, stock: 30 },
                    { color: 'Cream', storage: '512GB', price: 134999, stock: 20 }
                ]
            },
            {
                name: 'Apple iPhone 15 Pro',
                sku: 'IP15-PRO',
                brand: apple,
                price: 134900,
                variants: [
                    { color: 'Natural Titanium', storage: '128GB', price: 134900, stock: 40 },
                    { color: 'Blue Titanium', storage: '256GB', price: 144900, stock: 25 },
                    { color: 'Black Titanium', storage: '512GB', price: 164900, stock: 10 }
                ]
            },
            {
                name: 'OnePlus 12',
                sku: 'OP12',
                brand: oneplus,
                price: 64999,
                variants: [
                    { color: 'Flowy Emerald', storage: '16GB+512GB', price: 69999, stock: 60 },
                    { color: 'Silky Black', storage: '12GB+256GB', price: 64999, stock: 45 }
                ]
            }
        ];

        for (const pData of productsData) {
            // Create Product
            const product = await Product.create({
                name: pData.name,
                slug: slugify(pData.name, { lower: true }),
                sku: pData.sku,
                category: smartphones._id,
                brand: pData.brand._id,
                basePrice: pData.price,
                price: pData.price,
                hasVariants: true,
                status: 'active',
                featured: true,
                description: `Experience the new ${pData.name}. Features advanced technology and premium design.`,
                tags: ['Smartphone', 'Best Seller', '5G']
            });

            // Create Variants & Inventory
            for (const vData of pData.variants) {
                const sku = `${pData.sku}-${vData.color.substring(0, 3).toUpperCase()}-${vData.storage.replace(/\+/g, '')}`;

                const variant = await ProductVariant.create({
                    productId: product._id,
                    sku: sku,
                    attributes: {
                        color: vData.color,
                        storage: vData.storage
                    },
                    price: vData.price,
                    stock: vData.stock, // Physical stock
                    status: true,
                    minStock: 5
                });

                // Manually create Inventory (No Transaction)
                await InventoryMaster.create({
                    variantId: variant._id,
                    productId: product._id,
                    sku: sku,
                    productName: product.name,
                    variantAttributes: {
                        color: vData.color,
                        storage: vData.storage
                    },
                    totalStock: vData.stock,
                    reservedStock: 0,
                    stockStatus: vData.stock > 0 ? 'in_stock' : 'out_of_stock',
                    lowStockThreshold: 10,
                    isActive: true,
                    lastStockUpdate: new Date(),
                    createdBy: 'SEED_SCRIPT'
                });
            }
            console.log(`   + Created ${pData.name} with ${pData.variants.length} variants`);
        }

        console.log('\n✅ SEEDING COMPLETE! Database populated.');

        await mongoose.disconnect();
        console.log('👋 Disconnected');

    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

seedDatabaseSimple();
