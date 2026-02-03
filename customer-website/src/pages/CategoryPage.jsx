import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCategoryBySlug } from '../api/categoryApi';
import { getProductsByCategory } from '../api/productApi';
import ProductCard from '../components/product/ProductCard';

const CategoryPage = () => {
    const { slug } = useParams();
    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategoryData();
    }, [slug]);

    const loadCategoryData = async () => {
        try {
            const categoryData = await getCategoryBySlug(slug);
            setCategory(categoryData);
            if (categoryData) {
                const productsData = await getProductsByCategory(categoryData._id);
                setProducts(productsData.data || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '4rem 0' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>;
    if (!category) return <div className="container" style={{ padding: '4rem 0' }}><h2>Category not found</h2></div>;

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1>{category.name}</h1>
            {category.description && <p>{category.description}</p>}

            <div className="products-grid" style={{ marginTop: '2rem' }}>
                {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>
        </div>
    );
};

export default CategoryPage;
