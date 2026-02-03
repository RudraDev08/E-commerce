import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBrandBySlug } from '../api/brandApi';
import { getProductsByBrand } from '../api/productApi';
import ProductCard from '../components/product/ProductCard';

const BrandPage = () => {
    const { slug } = useParams();
    const [brand, setBrand] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBrandData();
    }, [slug]);

    const loadBrandData = async () => {
        try {
            const brandData = await getBrandBySlug(slug);
            setBrand(brandData);
            if (brandData) {
                const productsData = await getProductsByBrand(brandData._id);
                setProducts(productsData.data || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '4rem 0' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>;
    if (!brand) return <div className="container" style={{ padding: '4rem 0' }}><h2>Brand not found</h2></div>;

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1>{brand.name}</h1>
            {brand.description && <p>{brand.description}</p>}

            <div className="products-grid" style={{ marginTop: '2rem' }}>
                {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>
        </div>
    );
};

export default BrandPage;
