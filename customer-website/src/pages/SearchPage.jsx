import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchProducts } from '../api/productApi';
import ProductCard from '../components/product/ProductCard';

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (query) {
            performSearch();
        }
    }, [query]);

    const performSearch = async () => {
        try {
            setLoading(true);
            const response = await searchProducts(query);
            setProducts(response.data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1>Search Results for "{query}"</h1>
            <p>{products.length} products found</p>

            {loading ? (
                <div className="spinner" style={{ margin: '2rem auto' }}></div>
            ) : (
                <div className="products-grid" style={{ marginTop: '2rem' }}>
                    {products.map(product => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchPage;
