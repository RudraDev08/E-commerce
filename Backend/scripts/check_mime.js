
async function testMimeType() {
    const url = 'http://localhost:5000/uploads/1770282434929.webp';
    try {
        const response = await fetch(url);
        console.log(`URL: ${url}`);
        console.log(`Content-Type: ${response.headers.get('content-type')}`);
        // console.log(`Status: ${response.status}`);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testMimeType();
