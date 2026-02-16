import crypto from 'crypto';

/**
 * CANONICAL HASH GENERATOR UTILITY
 * Purpose: Generate deterministic, collision-proof configuration hashes
 * Used by: VariantMaster, ConfigurationValidator, DuplicateDetector
 */

class CanonicalHashGenerator {
    /**
     * Generate SHA-256 hash from variant configuration
     * @param {Object} config - Configuration object
     * @param {string|ObjectId} config.productId - Product identifier
     * @param {Array<string|ObjectId>} config.attributeValueIds - Attribute value IDs
     * @param {Object} options - Hash generation options
     * @returns {string} 64-character SHA-256 hash
     */
    static generateConfigHash(config, options = {}) {
        const { productId, attributeValueIds } = config;
        const { algorithm = 'sha256', encoding = 'hex', truncate = null } = options;

        // Validation
        if (!productId) {
            throw new Error('HASH_ERROR: Product ID is required');
        }

        if (!attributeValueIds || !Array.isArray(attributeValueIds) || attributeValueIds.length === 0) {
            throw new Error('HASH_ERROR: At least one attribute value ID is required');
        }

        // 1. Canonicalize product ID
        const canonicalProductId = this._canonicalize(productId);

        // 2. Canonicalize and sort attribute IDs
        const canonicalAttributeIds = attributeValueIds
            .map(id => this._canonicalize(id))
            .sort((a, b) => a.localeCompare(b)); // Deterministic sort

        // 3. Build canonical string
        const canonicalString = `${canonicalProductId}:${canonicalAttributeIds.join('|')}`;

        // 4. Generate hash
        const hash = crypto
            .createHash(algorithm)
            .update(canonicalString, 'utf8')
            .digest(encoding);

        // 5. Truncate if requested
        return truncate ? hash.substring(0, truncate) : hash;
    }

    /**
     * Generate human-readable configuration signature
     * @param {Array<Object>} normalizedAttributes - Normalized attribute objects
     * @returns {string} Human-readable signature (e.g., "COLOR:BLACK|SIZE:XL")
     */
    static generateConfigSignature(normalizedAttributes) {
        if (!normalizedAttributes || normalizedAttributes.length === 0) {
            throw new Error('SIGNATURE_ERROR: Normalized attributes required');
        }

        return normalizedAttributes
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map(attr => {
                const type = (attr.typeSlug || attr.typeName || 'UNKNOWN').toUpperCase();
                const value = (attr.valueSlug || attr.valueName || 'UNKNOWN').toUpperCase();
                return `${type}:${value}`;
            })
            .join('|');
    }

    /**
     * Verify configuration hash matches expected value
     * @param {Object} config - Configuration to verify
     * @param {string} expectedHash - Expected hash value
     * @returns {boolean} True if hash matches
     */
    static verifyConfigHash(config, expectedHash) {
        const computedHash = this.generateConfigHash(config);
        return computedHash === expectedHash;
    }

    /**
     * Generate SKU from configuration
     * @param {Object} config - SKU configuration
     * @returns {string} Generated SKU
     */
    static generateSKU(config) {
        const {
            brand,
            productGroup,
            attributes = [],
            strategy = 'auto',
            customTemplate = null
        } = config;

        if (strategy === 'manual') {
            throw new Error('SKU_ERROR: Manual SKU generation requires explicit SKU value');
        }

        if (strategy === 'template' && customTemplate) {
            return this._applyTemplate(customTemplate, config);
        }

        // Auto strategy
        const brandCode = this._sanitize(brand).substring(0, 3).toUpperCase();
        const groupCode = this._sanitize(productGroup).substring(0, 6).toUpperCase();

        // Extract key attributes
        const sizeAttr = attributes.find(a => a.typeSlug === 'size');
        const colorAttr = attributes.find(a => a.typeSlug === 'color');

        const sizeCode = sizeAttr
            ? this._sanitize(sizeAttr.valueSlug).substring(0, 4).toUpperCase()
            : 'STD';

        const colorCode = colorAttr
            ? this._sanitize(colorAttr.valueSlug).substring(0, 3).toUpperCase()
            : 'DEF';

        // Generate unique suffix
        const timestamp = Date.now().toString(36).substring(-4).toUpperCase();
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();

        return `${brandCode}-${groupCode}-${colorCode}-${sizeCode}-${timestamp}${random}`;
    }

    /**
     * Detect configuration collision
     * @param {string} hash1 - First configuration hash
     * @param {string} hash2 - Second configuration hash
     * @returns {boolean} True if collision detected
     */
    static detectCollision(hash1, hash2) {
        return hash1 === hash2;
    }

    /**
     * Generate batch hashes for multiple configurations
     * @param {Array<Object>} configs - Array of configurations
     * @returns {Array<Object>} Array of {config, hash, signature}
     */
    static generateBatch(configs) {
        return configs.map(config => ({
            config,
            hash: this.generateConfigHash(config),
            signature: config.normalizedAttributes
                ? this.generateConfigSignature(config.normalizedAttributes)
                : null
        }));
    }

    /**
     * Find duplicate configurations in batch
     * @param {Array<Object>} configs - Array of configurations
     * @returns {Array<Object>} Array of duplicate groups
     */
    static findDuplicates(configs) {
        const hashMap = new Map();
        const duplicates = [];

        configs.forEach((config, index) => {
            const hash = this.generateConfigHash(config);

            if (hashMap.has(hash)) {
                const existing = hashMap.get(hash);
                if (existing.length === 1) {
                    duplicates.push({ hash, configs: existing });
                }
                existing.push({ index, config });
            } else {
                hashMap.set(hash, [{ index, config }]);
            }
        });

        return duplicates;
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Canonicalize ID to string format
     * @private
     */
    static _canonicalize(id) {
        if (!id) throw new Error('CANONICALIZE_ERROR: ID cannot be null or undefined');

        // Handle ObjectId
        if (id.toString) return id.toString();

        // Handle string
        if (typeof id === 'string') return id.trim();

        throw new Error('CANONICALIZE_ERROR: Invalid ID type');
    }

    /**
     * Sanitize string for SKU generation
     * @private
     */
    static _sanitize(str) {
        if (!str) return '';
        return str
            .toString()
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase();
    }

    /**
     * Apply custom SKU template
     * @private
     */
    static _applyTemplate(template, config) {
        let sku = template;

        // Replace placeholders
        sku = sku.replace('{BRAND}', this._sanitize(config.brand).substring(0, 3));
        sku = sku.replace('{GROUP}', this._sanitize(config.productGroup).substring(0, 6));

        // Replace attribute placeholders
        config.attributes?.forEach(attr => {
            const placeholder = `{${attr.typeSlug.toUpperCase()}}`;
            sku = sku.replace(placeholder, this._sanitize(attr.valueSlug).substring(0, 4));
        });

        // Replace timestamp
        sku = sku.replace('{TIMESTAMP}', Date.now().toString(36).substring(-4));

        // Replace random
        sku = sku.replace('{RANDOM}', Math.random().toString(36).substring(2, 5));

        return sku.toUpperCase();
    }
}

// ==================== VALIDATION UTILITIES ====================

class ConfigurationValidator {
    /**
     * Validate configuration before hash generation
     */
    static validate(config) {
        const errors = [];

        if (!config.productId) {
            errors.push('Product ID is required');
        }

        if (!config.attributeValueIds || config.attributeValueIds.length === 0) {
            errors.push('At least one attribute value is required');
        }

        // Check for duplicate attribute types
        if (config.normalizedAttributes) {
            const typeIds = config.normalizedAttributes.map(a => a.typeId.toString());
            const uniqueTypeIds = new Set(typeIds);
            if (typeIds.length !== uniqueTypeIds.size) {
                errors.push('Duplicate attribute types detected');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate attribute combination rules
     */
    static validateCombination(attributes, rules = []) {
        const errors = [];

        // Check incompatibility rules
        rules.forEach(rule => {
            if (rule.type === 'INCOMPATIBLE') {
                const hasFirst = attributes.some(a => a.valueId.toString() === rule.value1.toString());
                const hasSecond = attributes.some(a => a.valueId.toString() === rule.value2.toString());

                if (hasFirst && hasSecond) {
                    errors.push(`Incompatible combination: ${rule.message}`);
                }
            }
        });

        // Check required dependencies
        rules.forEach(rule => {
            if (rule.type === 'REQUIRES') {
                const hasValue = attributes.some(a => a.valueId.toString() === rule.value.toString());
                const hasRequired = attributes.some(a => a.valueId.toString() === rule.requiredValue.toString());

                if (hasValue && !hasRequired) {
                    errors.push(`Missing required attribute: ${rule.message}`);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// ==================== EXPORTS ====================

export {
    CanonicalHashGenerator,
    ConfigurationValidator
};

export default CanonicalHashGenerator;
