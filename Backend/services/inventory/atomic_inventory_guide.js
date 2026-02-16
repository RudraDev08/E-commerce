
/**
 * Inventory Management Implementation Guide
 * 
 * ATOMIC OPERATIONS ARE CRITICAL FOR INVENTORY INTEGRITY.
 * DO NOT USE findById THEN save() FOR STOCK DECREMENT.
 * 
 * CORRECT PATTERN:
 */

// 1. Atomic Decrement (Use this for checkout)
const decrementStock = async (inventoryId, qty) => {
    const result = await InventoryMaster.findOneAndUpdate(
        {
            _id: inventoryId,
            quantity: { $gte: qty } // ATOMIC CHECK: only matches if we have enough stock
        },
        {
            $inc: { quantity: -qty }, // ATOMIC DECREMENT
            $push: {
                auditLog: {
                    action: 'SALE',
                    qty: -qty,
                    date: new Date()
                }
            }
        },
        { new: true } // Return updated doc
    );

    if (!result) {
        throw new Error('INSUFFICIENT_STOCK'); // Transaction validation failure
    }

    return result;
};

// 2. Atomic Increment (Returns/Restock)
const incrementStock = async (inventoryId, qty) => {
    return await InventoryMaster.findByIdAndUpdate(
        inventoryId,
        {
            $inc: { quantity: qty }
        },
        { new: true }
    );
}
