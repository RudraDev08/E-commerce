
async function testImageFetch() {
    const url = 'http://localhost:5000/uploads/1770272188211.png';
    try {
        const response = await fetch(url);
        console.log(`Fetching ${url}`);
        console.log(`Status: ${response.status}`);
        if (response.ok) {
            console.log("Image found, access successful.");
        } else {
            console.log("Image fetch failed.");
        }
    } catch (error) {
        console.error('Network Error:', error.message);
    }
}

testImageFetch();
