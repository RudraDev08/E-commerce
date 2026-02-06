
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runCheck() {
    console.log('Starting Variant System Verification...');

    let productId, sizeId, colorId;

    try {
        console.log('\n1. Checking Prerequisites...');

        // Product
        const prodRes = await axios.get(`${API_BASE}/products?limit=1`);
        if (!prodRes.data.data || prodRes.data.data.length === 0) throw new Error("No products found.");
        productId = prodRes.data.data[0]._id;
        console.log('   Product ID:', productId);

        // Size
        const sizeRes = await axios.get(`${API_BASE}/sizes?limit=1`);
        if (!sizeRes.data.data || sizeRes.data.data.length === 0) throw new Error("No sizes found.");
        sizeId = sizeRes.data.data[0]._id;
        console.log('   Size ID:', sizeId);

        // Color
        const colorRes = await axios.get(`${API_BASE}/colors?limit=1`);
        if (colorRes.data.data && colorRes.data.data.length > 0) {
            colorId = colorRes.data.data[0]._id;
            console.log('   Color ID:', colorId);
        } else {
            console.log('   No colors found, creating mock...');
            const newColor = await axios.post(`${API_BASE}/colors`, { name: 'TestColor', hexCode: '#000000', code: 'TEST' });
            colorId = newColor.data.data._id;
        }

        // 2. Test Bulk Create
        console.log('\n2. Testing Bulk Create...');
        const uniqueSku = 'CHK-VAR-BULK-' + Date.now();
        const bulkPayload = {
            productId: productId,
            variants: [
                {
                    sku: uniqueSku,
                    sizeId: sizeId,
                    colorId: colorId,
                    price: 999,
                    status: 'active'
                }
            ]
        };

        const createRes = await axios.post(`${API_BASE}/variants`, bulkPayload);
        if (!createRes.data.success) throw new Error("Bulk create failed");

        const createdVariant = createRes.data.data[0];
        console.log('✅ Created Variant:', createdVariant._id, createdVariant.sku);

        // 3. Verify Inventory Auto-Creation
        console.log('\n3. Verifying Inventory...');
        try {
            const invRes = await axios.get(`${API_BASE}/inventory/${createdVariant._id}`);
            if (invRes.data.success && invRes.data.data && invRes.data.data.variantId === createdVariant._id) {
                console.log('✅ Inventory Record Found:', invRes.data.data._id);
                console.log('   Stock:', invRes.data.data.totalStock);
            } else {
                console.error('❌ Inventory NOT Returned correctly');
                console.log('   Received:', JSON.stringify(invRes.data, null, 2));
            }
        } catch (e) {
            console.error('❌ Inventory Fetch Failed:', e.message);
        }

        // 4. Cleanup
        console.log('\n4. Cleaning up...');
        await axios.delete(`${API_BASE}/variants/${createdVariant._id}`);
        console.log('✅ Cleanup complete');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('   Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

runCheck();
