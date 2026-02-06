
async function debugProduct() {
    try {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        const products = data.data;

        const fold6 = products.find(p => p.name.includes("Fold 6"));

        if (fold6) {
            console.log("Product found:", fold6.name);
            console.log("Product ID:", fold6._id);
            console.log("Main Image:", fold6.image);
            console.log("Gallery Length:", fold6.gallery ? fold6.gallery.length : 0);
            if (fold6.gallery) {
                fold6.gallery.forEach((img, i) => console.log(`Gallery[${i}]: ${img.url} (Type: ${typeof img.url})`));
            }

            // Variants
            const varResponse = await fetch(`http://localhost:5000/api/variants/product/${fold6._id}`);
            const varData = await varResponse.json();
            const variants = varData.data;
            console.log("Variants found:", variants.length);
            variants.forEach((v, i) => {
                console.log(`Variant ${i} Images:`, v.images);
            });

        } else {
            console.log("Product 'Fold 6' not found");
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugProduct();
