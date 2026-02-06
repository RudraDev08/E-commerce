
async function fetchStock() {
    try {
        const response = await fetch('http://localhost:5000/api/inventory');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error fetching stock:', error.message);
    }
}

fetchStock();
