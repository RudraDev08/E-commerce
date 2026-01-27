/**
 * Migration Script: Update Product Categories from String to ObjectId
 * 
 * This script helps migrate existing products that have category as a string
 * to use category ObjectId references instead.
 * 
 * Usage:
 * 1. Update the CATEGORY_MAPPING object below with your category names and IDs
 * 2. Run: node Backend/scripts/migrateProductCategories.js
 */

import mongoose from 'mongoose';
import Product from '../models/Product/ProductSchema.js';
import Category from '../models/Category/CategorySchema.js';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeno-panel');
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

// Main Migration Function
const migrateCategories = async () => {
    try {
        console.log('🔄 Starting category migration...\n');

        // Step 1: Get all categories from database
        const categories = await Category.find({ isDeleted: false });
        console.log(`📊 Found ${categories.length} categories in database`);

        // Create a mapping of category names to IDs
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.name.toLowerCase()] = cat._id;
            console.log(`   - ${cat.name}: ${cat._id}`);
        });

        console.log('\n🔍 Checking products...');

        // Step 2: Find all products
        const products = await Product.find({});
        console.log(`📦 Found ${products.length} total products\n`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Step 3: Update each product
        for (const product of products) {
            try {
                // Check if category is already an ObjectId
                if (mongoose.Types.ObjectId.isValid(product.category) &&
                    typeof product.category === 'object') {
                    console.log(`⏭️  Skipped: ${product.name} (already has ObjectId category)`);
                    skippedCount++;
                    continue;
                }

                // If category is a string, try to find matching category
                if (typeof product.category === 'string') {
                    const categoryName = product.category.toLowerCase();
                    const categoryId = categoryMap[categoryName];

                    if (categoryId) {
                        // Update the product
                        await Product.updateOne(
                            { _id: product._id },
                            { $set: { category: categoryId } }
                        );
                        console.log(`✅ Updated: ${product.name} (${product.category} → ${categoryId})`);
                        updatedCount++;
                    } else {
                        console.log(`⚠️  Warning: ${product.name} has unknown category "${product.category}"`);
                        errorCount++;
                    }
                }
            } catch (error) {
                console.error(`❌ Error updating ${product.name}:`, error.message);
                errorCount++;
            }
        }

        // Step 4: Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 Migration Summary:');
        console.log('='.repeat(60));
        console.log(`✅ Updated: ${updatedCount} products`);
        console.log(`⏭️  Skipped: ${skippedCount} products (already migrated)`);
        console.log(`⚠️  Errors: ${errorCount} products`);
        console.log('='.repeat(60));

        // Step 5: Verify
        console.log('\n🔍 Verifying migration...');
        const verifyProducts = await Product.find({}).populate('category', 'name');
        const withCategory = verifyProducts.filter(p => p.category && p.category._id);
        const withoutCategory = verifyProducts.filter(p => !p.category || !p.category._id);

        console.log(`✅ Products with valid category: ${withCategory.length}`);
        console.log(`⚠️  Products without category: ${withoutCategory.length}`);

        if (withoutCategory.length > 0) {
            console.log('\n⚠️  Products without valid category:');
            withoutCategory.forEach(p => {
                console.log(`   - ${p.name} (category: ${p.category})`);
            });
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
};

// Run migration
(async () => {
    await connectDB();
    await migrateCategories();
})();
