import EventEmitter from 'events';
import logger from '../config/logger.js';

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.on('error', (err) => {
            logger.error('[EventBus] Unhandled error:', err);
        });
    }

    emitEvent(eventName, payload) {
        logger.debug(`[EventBus] Emitting event: ${eventName}`, payload);
        this.emit(eventName, payload);
    }
}

const eventBus = new EventBus();

// Core system events
export const Events = {
    OrderPlaced: 'OrderPlaced',
    InventoryAdjusted: 'InventoryAdjusted',
    RefundIssued: 'RefundIssued',
    ProductUpdated: 'ProductUpdated'
};

export default eventBus;
