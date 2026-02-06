
async function debugProduct() {
    try {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        const products = data.data;

        const fold6 = products.find(p => p.name.includes("Fold 6") || p.slug && p.slug.includes("fold-6"));

        if (fold6) {
            console.log("Product found:", fold6.name);
            console.log("Main Image:", fold6.image);
            console.log("Gallery:", JSON.stringify(fold6.gallery, null, 2));

            // Also fetch variants
            const varResponse = await fetch(`http://localhost:5000/api/variants/product/${fold6._id}`);
            const varData = await varResponse.json();
            console.log("Variants:", JSON.stringify(varData.data, null, 2));
        } else {
            console.log("Product 'Fold 6' not found");
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugProduct();
