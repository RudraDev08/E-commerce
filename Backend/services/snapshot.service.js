import mongoose from 'mongoose';
import ProductGroupSnapshot from '../models/Product/ProductGroupSnapshot.js';
import VariantMaster from '../models/masters/VariantMaster.enterprise.js';
import { createRedisConnection } from '../config/redis.js';

const redis = createRedisConnection();
const SNAPSHOT_CACHE_TTL = 3600; // 1 hour
const RECOMPUTE_DEBOUNCE_MS = 2000; // 2 seconds

// Map to track pending recompute timeouts per productGroupId
const pendingRecomputes = new Map();

export class SnapshotService {
    /**
     * ✅ 3.1 Snapshot Debounce
     * Trigger snapshot rebuild with a delay to bundle multiple writes (e.g. bulk create)
     */
    static triggerRecompute(productGroupId) {
        if (!productGroupId) return;
        const id = productGroupId.toString();

        if (pendingRecomputes.has(id)) {
            clearTimeout(pendingRecomputes.get(id));
        }

        const timer = setTimeout(() => {
            pendingRecomputes.delete(id);
            this.recompute(id);
        }, RECOMPUTE_DEBOUNCE_MS);

        pendingRecomputes.set(id, timer);
    }

    /**
     * ✅ 3.2 Snapshot Cache Layer — GET with TTL
     */
    static async getSnapshot(productGroupId) {
        const cacheKey = `snapshot:${productGroupId}`;

        try {
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (err) {
            console.warn('[Snapshot Cache] Redis error:', err.message);
        }

        let snapshot = await ProductGroupSnapshot.findOne({ productGroupId }).lean();
        if (!snapshot) {
            await this.recompute(productGroupId);
            snapshot = await ProductGroupSnapshot.findOne({ productGroupId }).lean();
        }

        if (snapshot) {
            await this.cacheSnapshot(productGroupId, snapshot);
        }

        return snapshot;
    }

    static async cacheSnapshot(productGroupId, data) {
        try {
            await redis.setex(`snapshot:${productGroupId}`, SNAPSHOT_CACHE_TTL, JSON.stringify(data));
        } catch (err) {
            console.error('[Snapshot Cache] Failed to set:', err.message);
        }
    }

    /**
     * ✅ Step 2 — Recompute Snapshot for a Product Group
     */
    static async recompute(productGroupId) {
        console.log(`[Snapshot] Recomputing for group: ${productGroupId}`);
        const startTime = Date.now();

        try {
            // Fetch all ACTIVE variants for this product group
            const variants = await VariantMaster.find({ productGroupId, status: 'ACTIVE' })
                .populate('sizes.sizeId')
                .populate('colorId')
                .populate({
                    path: 'attributeValueIds',
                    populate: { path: 'attributeType' }
                })
                .lean();

            if (!variants.length) {
                const emptyData = {
                    availabilityMatrix: {},
                    variantMap: {},
                    dimensions: { sizes: [], colors: [], attributes: [] },
                    selectors: { sizes: [], colors: [], attributes: [] },
                    priceRange: { min: 0, max: 0 },
                    totalActiveVariants: 0,
                    availability: { lastStockSyncAt: new Date(), isAnyInStock: false },
                    lastComputedAt: new Date()
                };
                await ProductGroupSnapshot.findOneAndUpdate(
                    { productGroupId },
                    emptyData,
                    { upsert: true }
                );
                await this.cacheSnapshot(productGroupId, emptyData);
                return;
            }

            const availabilityMatrix = {};
            let minPrice = Infinity;
            let maxPrice = -Infinity;
            let totalStock = 0;

            const sizesSet = new Map();
            const colorsSet = new Map();
            const attrMap = {};

            variants.forEach(v => {
                const price = parseFloat(v.resolvedPrice?.toString() || v.price?.toString() || 0);
                if (price < minPrice) minPrice = price;
                if (price > maxPrice) maxPrice = price;

                const stock = v.inventory?.quantityOnHand || 0;
                totalStock += stock;

                // Build Matrix key using configHash or a stable composite key
                const entry = {
                    variantId: v._id,
                    sku: v.sku,
                    stock: stock,
                    price: price,
                    compareAtPrice: parseFloat(v.compareAtPrice?.toString() || 0),
                    images: v.imageGallery?.filter(img => img.isPrimary).map(img => img.url) || []
                };

                availabilityMatrix[v.configHash] = entry;

                // Populate Selectors
                if (v.sizes) v.sizes.forEach(s => {
                    const sid = s.sizeId?._id?.toString();
                    if (sid) sizesSet.set(sid, s.sizeId);
                });

                if (v.colorId) {
                    colorsSet.set(v.colorId._id.toString(), v.colorId);
                }

                if (v.attributeValueIds) {
                    v.attributeValueIds.forEach(av => {
                        const typeId = av.attributeType?._id?.toString();
                        if (!typeId) return;
                        if (!attrMap[typeId]) {
                            attrMap[typeId] = {
                                typeId,
                                type: av.attributeType.name,
                                values: new Map()
                            };
                        }
                        attrMap[typeId].values.set(av._id.toString(), {
                            _id: av._id,
                            value: av.name || av.displayName,
                            code: av.code
                        });
                    });
                }
            });

            // Format Selectors for Frontend
            const dimensions = {
                sizes: Array.from(sizesSet.values()),
                colors: Array.from(colorsSet.values()),
                attributes: Object.values(attrMap).map(a => ({
                    ...a,
                    values: Array.from(a.values.values())
                }))
            };

            const updateData = {
                productGroupId,
                dimensions,
                variantMap: availabilityMatrix, // 3.3 Requirement
                availabilityMatrix, // Legacy
                availability: {
                    lastStockSyncAt: new Date(),
                    isAnyInStock: totalStock > 0
                },
                priceRange: {
                    min: minPrice === Infinity ? 0 : minPrice,
                    max: maxPrice === -Infinity ? 0 : maxPrice
                },
                totalActiveVariants: variants.length,
                selectors: dimensions, // Legacy
                lastComputedAt: new Date()
            };

            await ProductGroupSnapshot.findOneAndUpdate(
                { productGroupId },
                updateData,
                { upsert: true }
            );

            // Invalidate/Update Cache
            await this.cacheSnapshot(productGroupId, updateData);

            console.log(`[Snapshot] Complete for ${productGroupId} in ${Date.now() - startTime}ms`);
        } catch (error) {
            console.error(`[Snapshot Error] ${productGroupId}:`, error);
        }
    }
}

