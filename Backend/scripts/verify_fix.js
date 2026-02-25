import axios from 'axios';

async function test() {
    const variantId = '699ebfc5f261904041b4d5b9';
    try {
        const response = await axios.get(`http://localhost:5000/api/variants/${variantId}`);
        console.log('SUCCESS!');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('FAILED!');
        console.log('Status:', error.response?.status);
        console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

test();
