
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function runCheck() {
    console.log('Starting Variant System Verification...');

    let productId, sizeId, colorId;

    try {
        // 1. Get Prerequisites (Product, Size, Color)
        // We assume some exist, or we pick first available.
        console.log('\nPrerequisites...');

        const prodRes = await axios.get(`${API_BASE}/products`);
        if (prodRes.data.data.length === 0) throw new Error("No products found. Seed db first.");
        productId = prodRes.data.data[0]._id;
        console.log('Product ID:', productId);

        const sizeRes = await axios.get(`${API_BASE}/sizes`);
        if (sizeRes.data.data.length === 0) throw new Error("No sizes found.");
        sizeId = sizeRes.data.data[0]._id;
        console.log('Size ID:', sizeId);

        const colorRes = await axios.get(`${API_BASE}/colors`);
        if (colorRes.data.data.length === 0) console.warn("No colors found, creating mock if needed but reusing existing logic.");
        colorId = colorRes.data.data.length > 0 ? colorRes.data.data[0]._id : null;
        console.log('Color ID:', colorId);

        // 2. Test Bulk Create (mimics VariantBuilder.jsx)
        console.log('\n2. Testing Bulk Create...');
        const uniqueSku = 'TEST-VAR-BULK-' + Date.now();
        const bulkPayload = {
            productId: productId,
            variants: [
                {
                    sku: uniqueSku,
                    sizeId: sizeId,
                    colorId: colorId,
                    price: 999,
                    status: 'active'
                },
                {
                    sku: uniqueSku + '-2',
                    sizeId: sizeId,
                    colorId: colorId, // Intentionally same color/size but different SKU (Controller doesn't block duplicate combo? Schema might.)
                    // Actually schema has index({ product: 1, size: 1, color: 1 }, { unique: true });
                    // So this *should* fail if size/color same.
                    // Let's use same size, different SKU. Wait, combination must be unique.
                    // I'll skip second one being identical.
                    price: 1200,
                    status: 'active'
                }
            ]
        };

        // Note: Duplicate combination might fail if unique index is active.
        // Let's try 1 items first for safety, or expect failure on duplicate combo.
        // Actually, if I use same size/color, it will fail schema validation.
        // Let's just create ONE valid one.
        bulkPayload.variants = [bulkPayload.variants[0]];

        const createRes = await axios.post(`${API_BASE}/variants`, bulkPayload);
        const createdVariant = createRes.data.data[0];
        console.log('✅ Created Variant:', createdVariant._id, createdVariant.sku);

        // 3. Verify Inventory Auto-Creation
        console.log('\n3. Verifying Inventory...');
        // inventoryAPI.getById(variantId) -> GET /inventory/:variantId
        const invRes = await axios.get(`${API_BASE}/inventory/${createdVariant._id}`);
        if (invRes.data && invRes.data.variantId === createdVariant._id) {
            console.log('✅ Inventory Record Found:', invRes.data._id);
            console.log('   Stock:', invRes.data.totalStock);
        } else {
            console.error('❌ Inventory NOT Found');
        }

        // 4. Test Single Create (Legacy)
        console.log('\n4. Testing Single Create...');
        const singleSku = 'TEST-VAR-SINGLE-' + Date.now();
        // Schema requires different size/color combo.
        // Let's pick another size if possible, or just expect failure if only 1 size exists.
        if (sizeRes.data.data.length > 1) {
            const sizeId2 = sizeRes.data.data[1]._id;
            const singlePayload = {
                productId,
                size: sizeId2,
                color: colorId,
                sku: singleSku,
                price: 500
            };
            const singleRes = await axios.post(`${API_BASE}/variants`, singlePayload);
            console.log('✅ Single Variant Created:', singleRes.data.data._id);

            // Check Inventory
            const singleInv = await axios.get(`${API_BASE}/inventory/${singleRes.data.data._id}`);
            if (singleInv.data) console.log('✅ Single Inventory Found');

            // Cleanup Single
            await axios.delete(`${API_BASE}/variants/${singleRes.data.data._id}`);
        } else {
            console.log('Skipping single create test (not enough sizes/colors to avoid index collision)');
        }

        // 5. Cleanup Bulk
        console.log('\n5. Cleaning up...');
        await axios.delete(`${API_BASE}/variants/${createdVariant._id}`);
        console.log('✅ Cleanup complete');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) console.error(error.response.data);
    }
}

runCheck();
