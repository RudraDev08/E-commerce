import EventEmitter from 'events';

/**
 * ENTERPRISE EVENT EMISSION BACKBONE
 * Purpose: Decouple master data changes from downstream consumers
 * Architecture: Event-driven, at-least-once delivery, idempotent processing
 * Consumers: SearchIndexer, AnalyticsEngine, InventoryReconciler, RecommendationEngine
 */

class MasterDataEventEmitter extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            enablePersistence: options.enablePersistence !== false,
            enableRetry: options.enableRetry !== false,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            deadLetterQueue: options.deadLetterQueue || null,
            ...options
        };

        this.eventLog = [];
        this.failedEvents = [];
    }

    // ==================== EVENT TYPES ====================

    static EVENT_TYPES = {
        // Variant Events
        VARIANT_CREATED: 'variant.created',
        VARIANT_UPDATED: 'variant.updated',
        VARIANT_PRICE_CHANGED: 'variant.price.changed',
        VARIANT_INVENTORY_CHANGED: 'variant.inventory.changed',
        VARIANT_STATUS_CHANGED: 'variant.status.changed',
        VARIANT_DEPRECATED: 'variant.deprecated',
        VARIANT_ARCHIVED: 'variant.archived',

        // Master Data Events
        SIZE_CREATED: 'size.created',
        SIZE_UPDATED: 'size.updated',
        SIZE_DEPRECATED: 'size.deprecated',

        COLOR_CREATED: 'color.created',
        COLOR_UPDATED: 'color.updated',
        COLOR_DEPRECATED: 'color.deprecated',

        BRAND_CREATED: 'brand.created',
        BRAND_UPDATED: 'brand.updated',
        BRAND_DEPRECATED: 'brand.deprecated',

        CATEGORY_CREATED: 'category.created',
        CATEGORY_UPDATED: 'category.updated',
        CATEGORY_DEPRECATED: 'category.deprecated',

        ATTRIBUTE_TYPE_CREATED: 'attributeType.created',
        ATTRIBUTE_TYPE_UPDATED: 'attributeType.updated',
        ATTRIBUTE_TYPE_DEPRECATED: 'attributeType.deprecated',

        ATTRIBUTE_VALUE_CREATED: 'attributeValue.created',
        ATTRIBUTE_VALUE_UPDATED: 'attributeValue.updated',
        ATTRIBUTE_VALUE_DEPRECATED: 'attributeValue.deprecated',

        // Reconciliation Events
        INVENTORY_DRIFT_DETECTED: 'inventory.drift.detected',
        CONFIG_HASH_MISMATCH: 'config.hash.mismatch',
        SEARCH_INDEX_OUT_OF_SYNC: 'search.index.outOfSync',

        // Governance Events
        GOVERNANCE_VIOLATION: 'governance.violation',
        APPROVAL_REQUIRED: 'approval.required',
        LOCK_ENFORCED: 'lock.enforced'
    };

    // ==================== EMIT METHODS ====================

    /**
     * Emit variant created event
     */
    async emitVariantCreated(variant, context = {}) {
        return this._emitEvent({
            type: MasterDataEventEmitter.EVENT_TYPES.VARIANT_CREATED,
            entity: 'VARIANT',
            entityId: variant._id,
            // ✅ entityVersion from governance.version — consumers reject stale events
            entityVersion: variant.governance?.version ?? 1,
            payload: {
                sku: variant.sku,
                productGroupId: variant.productGroupId,
                configHash: variant.configHash,
                attributeValueIds: variant.attributeValueIds,
                price: variant.price?.toString(),
                resolvedPrice: variant.resolvedPrice?.toString(),
                priceVersion: variant.priceVersion,
                status: variant.status,
            },
            metadata: {
                createdBy: variant.governance?.createdBy,
                createdAt: variant.createdAt,
                ...context
            }
        });
    }

    /**
     * Emit variant price changed event
     */
    async emitVariantPriceChanged(variant, oldPrice, newPrice, context = {}) {
        return this._emitEvent({
            type: MasterDataEventEmitter.EVENT_TYPES.VARIANT_PRICE_CHANGED,
            entity: 'VARIANT',
            entityId: variant._id,
            // ✅ entityVersion ensures consumers ignore out-of-order price events
            entityVersion: variant.governance?.version ?? 1,
            payload: {
                sku: variant.sku,
                priceVersion: variant.priceVersion,
                oldPrice,
                newPrice,
                priceChange: {
                    amount: newPrice - oldPrice,
                    percentage: oldPrice > 0
                        ? +((newPrice - oldPrice) / oldPrice * 100).toFixed(2)
                        : null,
                }
            },
            metadata: {
                updatedBy: variant.governance?.updatedBy,
                updatedAt: new Date(),
                ...context
            }
        });
    }

    /**
     * Emit variant inventory changed event
     */
    async emitVariantInventoryChanged(variant, oldInventory, newInventory, context = {}) {
        return this._emitEvent({
            type: MasterDataEventEmitter.EVENT_TYPES.VARIANT_INVENTORY_CHANGED,
            entity: 'VARIANT',
            entityId: variant._id,
            payload: {
                sku: variant.sku,
                oldInventory: {
                    total: oldInventory.totalQuantity,
                    available: oldInventory.availableQuantity
                },
                newInventory: {
                    total: newInventory.totalQuantity,
                    available: newInventory.availableQuantity
                },
                change: {
                    total: newInventory.totalQuantity - oldInventory.totalQuantity,
                    available: newInventory.availableQuantity - oldInventory.availableQuantity
                }
            },
            metadata: {
                syncVersion: newInventory.syncVersion,
                lastSyncedAt: newInventory.lastSyncedAt,
                ...context
            }
        });
    }

    /**
     * Emit master data deprecated event
     */
    async emitMasterDeprecated(entityType, entity, context = {}) {
        const eventType = `${entityType.toLowerCase()}.deprecated`;

        return this._emitEvent({
            type: eventType,
            entity: entityType,
            entityId: entity._id,
            payload: {
                canonicalId: entity.canonicalId,
                name: entity.name || entity.value,
                deprecatedAt: entity.deprecatedAt,
                replacedBy: entity.replacedBy,
                deprecationReason: entity.deprecationReason,
                usageCount: entity.usageCount
            },
            metadata: {
                updatedBy: entity.updatedBy,
                ...context
            }
        });
    }

    /**
     * Emit governance violation event
     */
    async emitGovernanceViolation(violation, context = {}) {
        return this._emitEvent({
            type: MasterDataEventEmitter.EVENT_TYPES.GOVERNANCE_VIOLATION,
            entity: violation.entityType,
            entityId: violation.entityId,
            payload: {
                violationType: violation.type,
                rule: violation.rule,
                message: violation.message,
                severity: violation.severity || 'HIGH'
            },
            metadata: {
                detectedAt: new Date(),
                ...context
            }
        });
    }

    // ==================== CORE EVENT EMISSION ====================

    /**
     * Internal event emission with persistence and retry
     * @private
     */
    async _emitEvent(event) {
        const enrichedEvent = {
            ...event,
            eventId: this._generateEventId(),
            timestamp: new Date(),
            version: '2.0', // Upgraded to support entityVersion
            entityVersion: event.entityVersion || 0
        };

        // 🟢 Phase 1: Transactional Outbox Support
        // If a session is provided in metadata, the event should technically be
        // persisted to an Outbox collection in the same transaction.
        // For now, we ensure it's logged.
        if (this.options.enablePersistence) {
            this.eventLog.push(enrichedEvent);
        }

        // Emit to listeners
        try {
            // Consumers are expected to be idempotent
            this.emit(event.type, enrichedEvent);
            this.emit('*', enrichedEvent); // Wildcard listener

            return {
                success: true,
                eventId: enrichedEvent.eventId,
                entityVersion: enrichedEvent.entityVersion
            };
        } catch (error) {
            console.error(`Event emission failed: ${event.type}`, error);

            if (this.options.enableRetry) {
                return this._retryEvent(enrichedEvent);
            }

            this.failedEvents.push({
                event: enrichedEvent,
                error: error.message,
                failedAt: new Date()
            });

            return {
                success: false,
                eventId: enrichedEvent.eventId,
                error: error.message
            };
        }
    }

    /**
     * Retry failed event emission
     * @private
     */
    async _retryEvent(event, attempt = 1) {
        if (attempt > this.options.maxRetries) {
            // Send to dead letter queue
            if (this.options.deadLetterQueue) {
                await this.options.deadLetterQueue.push(event);
            }

            this.failedEvents.push({
                event,
                error: 'Max retries exceeded',
                failedAt: new Date()
            });

            return {
                success: false,
                eventId: event.eventId,
                error: 'Max retries exceeded'
            };
        }

        // Exponential backoff
        const delay = this.options.retryDelay * Math.pow(2, attempt - 1);
        await this._sleep(delay);

        try {
            this.emit(event.type, event);
            return {
                success: true,
                eventId: event.eventId,
                retriedAt: attempt
            };
        } catch (error) {
            return this._retryEvent(event, attempt + 1);
        }
    }

    /**
     * Generate unique event ID
     * @private
     */
    _generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Sleep utility
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==================== QUERY METHODS ====================

    /**
     * Get event log
     */
    getEventLog(filters = {}) {
        let events = [...this.eventLog];

        if (filters.type) {
            events = events.filter(e => e.type === filters.type);
        }

        if (filters.entity) {
            events = events.filter(e => e.entity === filters.entity);
        }

        if (filters.entityId) {
            events = events.filter(e => e.entityId?.toString() === filters.entityId.toString());
        }

        if (filters.since) {
            events = events.filter(e => e.timestamp >= filters.since);
        }

        return events;
    }

    /**
     * Get failed events
     */
    getFailedEvents() {
        return [...this.failedEvents];
    }

    /**
     * Clear event log
     */
    clearEventLog() {
        this.eventLog = [];
        this.failedEvents = [];
    }
}

// ==================== EVENT CONSUMERS ====================

/**
 * IDEMPOTENCY HELPER
 */
async function checkEventValidity(event) {
    const EventStore = (await import('../models/Audit/EventStore.model.js')).default;

    // 1. Check for duplicate eventId
    const duplicate = await EventStore.findOne({ eventId: event.eventId });
    if (duplicate) return { valid: false, reason: 'DUPLICATE_EVENT' };

    // 2. Check for stale entityVersion
    const latest = await EventStore.findOne({
        entityType: event.entity,
        entityId: event.entityId
    }).sort({ entityVersion: -1 });

    if (latest && latest.entityVersion >= event.entityVersion) {
        return { valid: false, reason: 'STALE_VERSION', latestVersion: latest.entityVersion };
    }

    return { valid: true };
}

async function markEventProcessed(event) {
    const EventStore = (await import('../models/Audit/EventStore.model.js')).default;
    await EventStore.create({
        eventId: event.eventId,
        entityType: event.entity,
        entityId: event.entityId,
        type: event.type,
        entityVersion: event.entityVersion,
        payload: event.payload,
        metadata: event.metadata
    });
}

/**
 * Search Index Consumer (Idempotent)
 */
class SearchIndexConsumer {
    constructor(searchIndexer) {
        this.searchIndexer = searchIndexer;
    }

    async handleVariantCreated(event) {
        const { valid, reason } = await checkEventValidity(event);
        if (!valid) return console.warn(`[SEARCH_CONSUMER] Skipping: ${reason}`, event.eventId);

        await this.searchIndexer.indexVariant(event.payload);
        await markEventProcessed(event);
    }

    async handleVariantUpdated(event) {
        const { valid, reason } = await checkEventValidity(event);
        if (!valid) return;

        await this.searchIndexer.updateVariant(event.entityId, event.payload);
        await markEventProcessed(event);
    }

    async handleVariantArchived(event) {
        const { valid, reason } = await checkEventValidity(event);
        if (!valid) return;

        await this.searchIndexer.removeVariant(event.entityId);
        await markEventProcessed(event);
    }

    register(eventEmitter) {
        eventEmitter.on(MasterDataEventEmitter.EVENT_TYPES.VARIANT_CREATED,
            this.handleVariantCreated.bind(this));
        eventEmitter.on(MasterDataEventEmitter.EVENT_TYPES.VARIANT_UPDATED,
            this.handleVariantUpdated.bind(this));
        eventEmitter.on(MasterDataEventEmitter.EVENT_TYPES.VARIANT_ARCHIVED,
            this.handleVariantArchived.bind(this));
    }
}

/**
 * Analytics Consumer
 */
class AnalyticsConsumer {
    constructor(analyticsEngine) {
        this.analyticsEngine = analyticsEngine;
    }

    async handlePriceChanged(event) {
        const { valid } = await checkEventValidity(event);
        if (!valid) return;

        await this.analyticsEngine.trackPriceChange(event.payload, event.metadata);
        await markEventProcessed(event);
    }

    async handleInventoryChanged(event) {
        const { valid } = await checkEventValidity(event);
        if (!valid) return;

        await this.analyticsEngine.trackInventoryChange(event.payload, event.metadata);
        await markEventProcessed(event);
    }

    register(eventEmitter) {
        eventEmitter.on(MasterDataEventEmitter.EVENT_TYPES.VARIANT_PRICE_CHANGED,
            this.handlePriceChanged.bind(this));
        eventEmitter.on(MasterDataEventEmitter.EVENT_TYPES.VARIANT_INVENTORY_CHANGED,
            this.handleInventoryChanged.bind(this));
    }
}

/**
 * Inventory Reconciliation Consumer
 */
class InventoryReconciliationConsumer {
    constructor(reconciler) {
        this.reconciler = reconciler;
    }

    async handleInventoryDrift(event) {
        const { valid } = await checkEventValidity(event);
        if (!valid) return;

        await this.reconciler.scheduleReconciliation(event.payload.sku);
        await markEventProcessed(event);
    }

    register(eventEmitter) {
        eventEmitter.on(MasterDataEventEmitter.EVENT_TYPES.INVENTORY_DRIFT_DETECTED,
            this.handleInventoryDrift.bind(this));
    }
}

/**
 * Cache Invalidator Consumer
 * Phase 6: Cache Invalidation & Search Safety
 */
class CacheInvalidatorConsumer {
    constructor(redisClient) {
        this.redis = redisClient;
    }

    async handleInvalidation(event) {
        if (!this.redis) return;

        // Cache Invalidation is usually idempotent by nature (DEL is idempotent)
        // But we still track processed version to avoid out-of-order stale data
        const { valid } = await checkEventValidity(event);
        if (!valid) return;

        const { type, entityId } = event;

        try {
            if (type.startsWith('variant.')) {
                await this.redis.del(`v:${entityId}`);
                // Invalidate catalog pages that might contain this variant
                // (Using a simple flush for now is safer but aggressive; 
                // in production we'd use more targeted keys)
            }

            if (type.startsWith('category.') || type.startsWith('brand.')) {
                // Any category/brand change nukes the nav/menu cache
                await this.redis.del('menu:main');
                await this.redis.del('nav:categories');
            }

            if (type.startsWith('attribute')) {
                // Invalidate search filters
                const keys = await this.redis.keys('filters:*');
                if (keys.length > 0) await this.redis.del(...keys);
            }

            await markEventProcessed(event);
        } catch (err) {
            console.error(`[CACHE_INVALIDATOR] Error invalidating ${type}:`, err.message);
        }
    }

    register(eventEmitter) {
        // Listen to all events for potential invalidation
        const allEvents = Object.values(MasterDataEventEmitter.EVENT_TYPES);
        allEvents.forEach(evt => {
            eventEmitter.on(evt, this.handleInvalidation.bind(this));
        });
    }
}

// ==================== EXPORTS ====================

export {
    MasterDataEventEmitter,
    SearchIndexConsumer,
    AnalyticsConsumer,
    InventoryReconciliationConsumer,
    CacheInvalidatorConsumer
};

export default MasterDataEventEmitter;
