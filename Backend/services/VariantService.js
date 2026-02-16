// ============================================================================
// VariantService - Production-Hardened (No Cross-Collection Transaction Locks)
// ============================================================================
// CRITICAL FIXES:
// 1. SearchDocument sync REMOVED from transaction (async queue)
// 2. Transaction scope minimized to single collection
// 3. Redis-based retry queue for sync failures
// ============================================================================

import mongoose from 'mongoose';
import crypto from 'crypto';
import Redis from 'ioredis';
import Variant from '../models/variant/variantSchema.js';
import Product from '../models/Product.js';
import SearchDocument from '../models/SearchDocument.model.js';
import AttributeValue from '../models/AttributeValue.model.js';
import logger from '../config/logger.js';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const SEARCH_SYNC_QUEUE = 'search_sync_queue';

class VariantService {

    /**
     * Create or Update Variant (Transaction-Safe, Lock-Minimized)
     * @param {ObjectId} productId - Parent product ID
     * @param {Object} variantData - Variant fields
     * @param {Number} baseProductPrice - Optional base price override
     * @returns {Promise<Variant>}
     */
    static async upsertVariant(productId, variantData, baseProductPrice = null) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Fetch Product for Base Price (within transaction)
            if (!baseProductPrice) {
                const product = await Product.findById(productId)
                    .select('price')
                    .session(session)
                    .lean();

                if (!product) {
                    throw new Error(`PRODUCT_NOT_FOUND: ${productId}`);
                }
                baseProductPrice = product.price || 0;
            }

            // 2. Validate Attribute Values (read-only, can use cache)
            if (variantData.variantAttributes && variantData.variantAttributes.length > 0) {
                const attrValueIds = variantData.variantAttributes.map(a => a.attributeValue);

                // Try cache first
                const cachedValues = await this.getCachedAttributeValues(attrValueIds);
                const missingIds = attrValueIds.filter(id => !cachedValues[id]);

                if (missingIds.length > 0) {
                    const dbValues = await AttributeValue.find({
                        _id: { $in: missingIds },
                        isDeleted: false,
                        status: 'active'
                    }).session(session).lean();

                    if (dbValues.length !== missingIds.length) {
                        throw new Error('INVALID_ATTRIBUTE_VALUES');
                    }

                    // Cache for 1 hour
                    await this.cacheAttributeValues(dbValues);
                    dbValues.forEach(v => cachedValues[v._id.toString()] = v);
                }

                // Attach populated values
                variantData.variantAttributes = variantData.variantAttributes.map(attr => ({
                    attributeType: attr.attributeType,
                    attributeValue: cachedValues[attr.attributeValue.toString()]
                }));
            }

            // 3. Generate Combination Key
            const combinationKey = this.generateCombinationKey(productId, variantData);

            // 4. Find or Create Variant
            let variant = await Variant.findOne({ combinationKey }).session(session);

            if (!variant) {
                variant = new Variant({
                    ...variantData,
                    product: productId,
                    combinationKey
                });
            } else {
                Object.assign(variant, variantData);
            }

            // 5. Calculate Final Price
            const calculatedPrice = this.calculatePrice(variant, baseProductPrice);

            if (calculatedPrice === undefined || isNaN(calculatedPrice) || calculatedPrice < 0) {
                logger.error('Price Calculation Failed', {
                    variantId: variant._id,
                    sku: variant.sku,
                    basePrice: baseProductPrice
                });
                throw new Error('PRICE_CALCULATION_FAILED');
            }

            variant.finalPrice = calculatedPrice;
            variant.indexedPrice = calculatedPrice;

            // 6. Save Variant (ONLY Variant collection in transaction)
            await variant.save({ session });

            // 7. Commit Transaction IMMEDIATELY
            await session.commitTransaction();

            logger.info('Variant Upserted', {
                variantId: variant._id,
                sku: variant.sku,
                finalPrice: variant.finalPrice
            });

            // 8. Queue SearchDocument Sync (ASYNC - Outside Transaction)
            await this.queueSearchDocumentSync(variant._id);

            // 9. Update Product Price Range (Async, Non-Blocking)
            this.updateProductPriceRange(productId).catch(err =>
                logger.error('Product Price Range Update Failed', { productId, error: err.message })
            );

            return variant;

        } catch (error) {
            await session.abortTransaction();
            logger.error('Variant Upsert Failed', {
                productId,
                sku: variantData.sku,
                error: error.message,
                stack: error.stack
            });
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Queue SearchDocument Sync (Redis-Based)
     */
    static async queueSearchDocumentSync(variantId) {
        try {
            await redis.lpush(SEARCH_SYNC_QUEUE, JSON.stringify({
                variantId: variantId.toString(),
                timestamp: Date.now(),
                retries: 0
            }));

            logger.debug('SearchDocument Sync Queued', { variantId });
        } catch (err) {
            logger.error('Failed to Queue SearchDocument Sync', {
                variantId,
                error: err.message
            });
        }
    }

    /**
     * Process SearchDocument Sync (Called by Background Worker)
     */
    static async processSearchDocumentSync(variantId) {
        try {
            const variant = await Variant.findById(variantId)
                .populate('product')
                .populate('variantAttributes.attributeValue')
                .lean();

            if (!variant) {
                logger.warn('Variant Not Found for Sync', { variantId });
                return;
            }

            const keywords = [];
            if (variant.variantAttributes) {
                for (const attr of variant.variantAttributes) {
                    const val = attr.attributeValue?.value || attr.attributeValue?.name;
                    if (val) keywords.push(val.toString());
                }
            }

            if (variant.size) keywords.push(variant.size.toString());
            if (variant.color) keywords.push(variant.color.toString());

            const searchDoc = {
                variantId: variant._id,
                productId: variant.product._id || variant.product,
                sku: variant.sku,
                name: variant.product.name || '',
                description: variant.product.description || '',
                keywords,
                category: variant.product.category?.toString() || '',
                brand: variant.product.brand?.toString() || '',
                tags: variant.product.tags || [],
                price: variant.indexedPrice,
                rating: variant.product.rating || 0,
                dateAdded: variant.createdAt || new Date(),
                channels: variant.availableChannels || ['B2C'],
                regions: variant.availableRegions || ['GLOBAL'],
                status: variant.status,
                inStock: variant.status === 'active'
            };

            await SearchDocument.findOneAndUpdate(
                { variantId: variant._id },
                searchDoc,
                { upsert: true, new: true }
            );

            logger.debug('SearchDocument Synced', { variantId });

        } catch (err) {
            logger.error('SearchDocument Sync Failed', {
                variantId,
                error: err.message
            });
            throw err;
        }
    }

    /**
     * Cache Attribute Values (Redis)
     */
    static async getCachedAttributeValues(ids) {
        const keys = ids.map(id => `attr:${id}`);
        const values = await redis.mget(keys);

        const result = {};
        values.forEach((val, i) => {
            if (val) {
                result[ids[i].toString()] = JSON.parse(val);
            }
        });

        return result;
    }

    static async cacheAttributeValues(values) {
        const pipeline = redis.pipeline();
        values.forEach(v => {
            pipeline.setex(`attr:${v._id}`, 3600, JSON.stringify(v));
        });
        await pipeline.exec();
    }

    /**
     * Deterministic Price Calculation
     */
    static calculatePrice(variant, basePrice) {
        if (variant.priceOverride !== undefined && variant.priceOverride !== null) {
            return variant.priceOverride;
        }

        const base = basePrice || variant.price || 0;
        let fixedTotal = 0;
        let percentTotal = 0;

        if (variant.variantAttributes && variant.variantAttributes.length > 0) {
            for (const attr of variant.variantAttributes) {
                if (attr.attributeValue && attr.attributeValue.priceModifier) {
                    const { type, value } = attr.attributeValue.priceModifier;
                    if (type === 'fixed') {
                        fixedTotal += (value || 0);
                    } else if (type === 'percentage') {
                        percentTotal += (value || 0);
                    }
                }
            }
        }

        const percentageAmount = base * (percentTotal / 100);
        return base + fixedTotal + percentageAmount;
    }

    /**
     * Generate SHA-1 Combination Key
     */
    static generateCombinationKey(productId, data) {
        const components = [];

        if (data.variantAttributes) {
            data.variantAttributes.forEach(a => {
                const typeId = a.attributeType?.toString() || a.attributeType;
                const valId = a.attributeValue?._id?.toString() || a.attributeValue?.toString() || a.attributeValue;
                if (typeId && valId) {
                    components.push(`${typeId}:${valId}`);
                }
            });
        }

        if (data.size) components.push(`LEGACY_SIZE:${data.size.toString()}`);
        if (data.color) components.push(`LEGACY_COLOR:${data.color.toString()}`);

        components.sort();
        const rawKey = `${productId.toString()}|${components.join('|')}`;
        return crypto.createHash('sha1').update(rawKey).digest('hex');
    }

    /**
     * Update Product Price Range
     */
    static async updateProductPriceRange(productId) {
        const stats = await Variant.aggregate([
            { $match: { product: productId, status: 'active', isDeleted: false } },
            {
                $group: {
                    _id: '$product',
                    minPrice: { $min: '$indexedPrice' },
                    maxPrice: { $max: '$indexedPrice' }
                }
            }
        ]);

        if (stats.length > 0) {
            await Product.findByIdAndUpdate(productId, {
                minPrice: stats[0].minPrice,
                maxPrice: stats[0].maxPrice
            });
        }
    }

    /**
     * Bulk Upsert with Explosion Guard
     */
    static async bulkUpsertVariants(productId, variantsData, baseProductPrice = null) {
        if (variantsData.length > 100) {
            throw new Error(`VARIANT_EXPLOSION: ${variantsData.length} variants. Limit is 100.`);
        }

        const results = [];
        for (const data of variantsData) {
            const variant = await this.upsertVariant(productId, data, baseProductPrice);
            results.push(variant);
        }

        logger.info('Bulk Variant Upsert Complete', {
            productId,
            count: results.length
        });

        return results;
    }
}

export default VariantService;
