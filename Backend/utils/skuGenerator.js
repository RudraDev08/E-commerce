/**
 * SKU Generator Utility
 * Generates unique SKU codes for product variants
 * Format: PROD-SIZE-COLOR-RANDOM
 * Example: TSHIRT-M-RED-A3B9
 */

import crypto from 'crypto';

class SKUGenerator {
    /**
     * Generate SKU from product, size, and color
     * @param {Object} product - Product object
     * @param {Object} size - Size object
     * @param {Object} color - Color object
     * @returns {String} Generated SKU
     */
    static generate(product, size, color) {
        try {
            // Extract product code (first 6 chars of name, uppercase, no spaces)
            const productCode = this.sanitizeCode(product.name || product.slug, 6);

            // Extract size code (use code field or first 3 chars of name)
            const sizeCode = this.sanitizeCode(size.code || size.name, 3);

            // Extract color code (first 3 chars of name)
            const colorCode = this.sanitizeCode(color.name, 3);

            // Generate random suffix (4 alphanumeric chars)
            const randomSuffix = this.generateRandomSuffix(4);

            // Combine all parts
            const sku = `${productCode}-${sizeCode}-${colorCode}-${randomSuffix}`;

            return sku.toUpperCase();
        } catch (error) {
            throw new Error(`SKU generation failed: ${error.message}`);
        }
    }

    /**
     * Generate SKU with custom format
     * @param {String} prefix - Custom prefix
     * @param {String} suffix - Custom suffix
     * @returns {String} Generated SKU
     */
    static generateCustom(prefix = 'PROD', suffix = null) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = this.generateRandomSuffix(4);
        const customSuffix = suffix || random;

        return `${prefix}-${timestamp}-${customSuffix}`.toUpperCase();
    }

    /**
     * Generate barcode (EAN-13 format)
     * @returns {String} 13-digit barcode
     */
    static generateBarcode() {
        // Generate 12 random digits
        let barcode = '';
        for (let i = 0; i < 12; i++) {
            barcode += Math.floor(Math.random() * 10);
        }

        // Calculate check digit (EAN-13 algorithm)
        const checkDigit = this.calculateEAN13CheckDigit(barcode);

        return barcode + checkDigit;
    }

    /**
     * Calculate EAN-13 check digit
     * @param {String} barcode - 12-digit barcode
     * @returns {Number} Check digit
     */
    static calculateEAN13CheckDigit(barcode) {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(barcode[i]);
            sum += (i % 2 === 0) ? digit : digit * 3;
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit;
    }

    /**
     * Sanitize string to create code
     * @param {String} str - Input string
     * @param {Number} maxLength - Maximum length
     * @returns {String} Sanitized code
     */
    static sanitizeCode(str, maxLength = 10) {
        if (!str) return 'XXX';

        return str
            .toString()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '') // Remove non-alphanumeric
            .substring(0, maxLength) // Limit length
            .padEnd(Math.min(maxLength, 3), 'X'); // Pad if too short
    }

    /**
     * Generate random alphanumeric suffix
     * @param {Number} length - Length of suffix
     * @returns {String} Random suffix
     */
    static generateRandomSuffix(length = 4) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            result += chars[randomIndex];
        }

        return result;
    }

    /**
     * Generate unique hash-based SKU
     * @param {String} productId - Product ID
     * @param {String} sizeId - Size ID
     * @param {String} colorId - Color ID
     * @returns {String} Hash-based SKU
     */
    static generateHashSKU(productId, sizeId, colorId) {
        const combined = `${productId}-${sizeId}-${colorId}`;
        const hash = crypto.createHash('md5').update(combined).digest('hex');
        const shortHash = hash.substring(0, 8).toUpperCase();

        return `VAR-${shortHash}`;
    }

    /**
     * Validate SKU format
     * @param {String} sku - SKU to validate
     * @returns {Boolean} Is valid
     */
    static isValidSKU(sku) {
        if (!sku || typeof sku !== 'string') return false;

        // Check if SKU matches expected format (alphanumeric with hyphens)
        const skuRegex = /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/;
        return skuRegex.test(sku);
    }

    /**
     * Generate batch SKUs for multiple variants
     * @param {Array} variants - Array of variant objects
     * @returns {Array} Array of SKUs
     */
    static generateBatch(variants) {
        return variants.map(variant => {
            return this.generate(variant.product, variant.size, variant.color);
        });
    }
}

export default SKUGenerator;
