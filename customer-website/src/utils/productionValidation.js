/**
 * Production Validation Script
 * Run this to verify PDP and Cart integration is correct
 */

// ========================================================================
// VALIDATION 1: Cart Payload Structure
// ========================================================================
export const validateCartPayload = (payload) => {
    const requiredFields = [
        'variantId',
        'productId',
        'name',
        'price',
        'currency',
        'quantity',
        'attributes',
        'sku',
        'image'
    ];

    const errors = [];

    // Check all required fields exist
    requiredFields.forEach(field => {
        if (!(field in payload)) {
            errors.push(`Missing required field: ${field}`);
        }
    });

    // Validate field types
    if (typeof payload.price !== 'number') {
        errors.push('price must be a number');
    }

    if (typeof payload.quantity !== 'number') {
        errors.push('quantity must be a number');
    }

    if (typeof payload.attributes !== 'object') {
        errors.push('attributes must be an object');
    }

    // Validate price is positive
    if (payload.price <= 0) {
        errors.push('price must be greater than 0');
    }

    // Validate quantity is positive
    if (payload.quantity <= 0) {
        errors.push('quantity must be greater than 0');
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

// ========================================================================
// VALIDATION 2: Attribute Key Consistency
// ========================================================================
export const validateVariantAttributes = (attributes) => {
    const allowedKeys = ['colorId', 'storage', 'ram', 'size'];
    const errors = [];

    // Check for forbidden keys
    if ('color' in attributes) {
        errors.push('CRITICAL: Found "color" key - must use "colorId" instead');
    }

    // Check all keys are allowed
    Object.keys(attributes).forEach(key => {
        if (!allowedKeys.includes(key)) {
            errors.push(`Invalid attribute key: ${key}`);
        }
    });

    // Validate colorId if present
    if (attributes.colorId && typeof attributes.colorId !== 'string') {
        errors.push('colorId must be a string (Color Master _id)');
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

// ========================================================================
// VALIDATION 3: Price Snapshot Integrity
// ========================================================================
export const validatePriceSnapshot = (cartItem, variant) => {
    const errors = [];

    // Cart price should match variant price at time of add
    // (This test assumes variant price hasn't changed since add)
    const variantPrice = variant.sellingPrice || variant.price;

    if (cartItem.price !== variantPrice) {
        errors.push(`Price mismatch: cart=${cartItem.price}, variant=${variantPrice}`);
    }

    if (cartItem.currency !== variant.currency) {
        errors.push(`Currency mismatch: cart=${cartItem.currency}, variant=${variant.currency}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warning: errors.length > 0 ? 'Price may have changed since add-to-cart (expected behavior)' : null
    };
};

// ========================================================================
// VALIDATION 4: Color Resolution
// ========================================================================
export const validateColorResolution = (variant, colorMaster) => {
    const errors = [];

    if (!variant.attributes?.colorId) {
        errors.push('Variant missing colorId attribute');
        return { valid: false, errors };
    }

    const colorId = variant.attributes.colorId;
    const colorObj = colorMaster.find(c => c._id === colorId);

    if (!colorObj) {
        errors.push(`Color not found in Color Master: ${colorId}`);
    }

    if (colorObj && !colorObj.hexCode && !colorObj.colorCode) {
        errors.push(`Color missing hex code: ${colorId}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        resolved: colorObj
    };
};

// ========================================================================
// COMPREHENSIVE VALIDATION
// ========================================================================
export const runFullValidation = (cartPayload, variant, colorMaster) => {
    console.log('🔍 Running Production Validation...\n');

    // Test 1: Cart Payload
    console.log('Test 1: Cart Payload Structure');
    const payloadResult = validateCartPayload(cartPayload);
    if (payloadResult.valid) {
        console.log('✅ PASS: Cart payload is valid');
    } else {
        console.error('❌ FAIL: Cart payload errors:');
        payloadResult.errors.forEach(err => console.error(`  - ${err}`));
    }
    console.log('');

    // Test 2: Attribute Keys
    console.log('Test 2: Attribute Key Consistency');
    const attrResult = validateVariantAttributes(variant.attributes);
    if (attrResult.valid) {
        console.log('✅ PASS: Attribute keys are valid');
    } else {
        console.error('❌ FAIL: Attribute errors:');
        attrResult.errors.forEach(err => console.error(`  - ${err}`));
    }
    console.log('');

    // Test 3: Price Snapshot
    console.log('Test 3: Price Snapshot Integrity');
    const priceResult = validatePriceSnapshot(cartPayload, variant);
    if (priceResult.valid) {
        console.log('✅ PASS: Price snapshot is correct');
    } else {
        console.warn('⚠️  WARNING: Price snapshot issues:');
        priceResult.errors.forEach(err => console.warn(`  - ${err}`));
        if (priceResult.warning) {
            console.warn(`  Note: ${priceResult.warning}`);
        }
    }
    console.log('');

    // Test 4: Color Resolution
    console.log('Test 4: Color Resolution');
    const colorResult = validateColorResolution(variant, colorMaster);
    if (colorResult.valid) {
        console.log('✅ PASS: Color resolves correctly');
        console.log(`  Color: ${colorResult.resolved.name} (${colorResult.resolved.hexCode})`);
    } else {
        console.error('❌ FAIL: Color resolution errors:');
        colorResult.errors.forEach(err => console.error(`  - ${err}`));
    }
    console.log('');

    // Summary
    const allValid = payloadResult.valid && attrResult.valid && colorResult.valid;
    console.log('========================================');
    if (allValid) {
        console.log('✅ ALL TESTS PASSED - Production Ready!');
    } else {
        console.error('❌ SOME TESTS FAILED - Fix errors above');
    }
    console.log('========================================');

    return allValid;
};

// ========================================================================
// EXAMPLE USAGE
// ========================================================================
/*
import { runFullValidation } from './productionValidation';

// After user adds to cart
const cartPayload = {
  variantId: selectedVariant._id,
  productId: product._id,
  name: product.name,
  price: selectedVariant.sellingPrice,
  currency: selectedVariant.currency,
  quantity: 1,
  attributes: selectedVariant.attributes,
  sku: selectedVariant.sku,
  image: selectedVariant.image,
  stock: selectedVariant.stock
};

// Run validation
runFullValidation(cartPayload, selectedVariant, colorMaster);
*/

export default {
    validateCartPayload,
    validateVariantAttributes,
    validatePriceSnapshot,
    validateColorResolution,
    runFullValidation
};
