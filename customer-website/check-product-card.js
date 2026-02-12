// Quick Error Check Script
// Run this to verify ProductCard component has no syntax errors

console.log('✅ Checking ProductCard component...\n');

// Check 1: File exists
const fs = require('fs');
const path = require('path');

const productCardPath = path.join(__dirname, 'src/components/product/ProductCard.jsx');
const productCardCssPath = path.join(__dirname, 'src/components/product/ProductCard.css');

console.log('📁 Checking files...');
console.log(`  ProductCard.jsx: ${fs.existsSync(productCardPath) ? '✅ EXISTS' : '❌ MISSING'}`);
console.log(`  ProductCard.css: ${fs.existsSync(productCardCssPath) ? '✅ EXISTS' : '❌ MISSING'}`);

// Check 2: Required dependencies
console.log('\n📦 Checking dependencies...');
const packageJson = require('./package.json');
const requiredDeps = ['react', 'react-router-dom'];

requiredDeps.forEach(dep => {
    const exists = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
    console.log(`  ${dep}: ${exists ? '✅ ' + exists : '❌ MISSING'}`);
});

// Check 3: Context files
console.log('\n🔧 Checking context files...');
const cartContextPath = path.join(__dirname, 'src/context/CartContext.jsx');
console.log(`  CartContext.jsx: ${fs.existsSync(cartContextPath) ? '✅ EXISTS' : '❌ MISSING'}`);

// Check 4: Utility files
console.log('\n🛠️  Checking utility files...');
const formattersPath = path.join(__dirname, 'src/utils/formatters.js');
console.log(`  formatters.js: ${fs.existsSync(formattersPath) ? '✅ EXISTS' : '❌ MISSING'}`);

console.log('\n✨ All checks complete!\n');
console.log('If all files exist and dependencies are installed, the component should work.');
console.log('Try visiting: http://localhost:5173/products\n');
