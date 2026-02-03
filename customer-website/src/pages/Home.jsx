import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../api/categoryApi';
import { getProducts } from '../api/productApi';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/product/ProductCard';
import HeroSlider from '../components/home/HeroSlider';
import CategorySlider from '../components/home/CategorySlider';
import CountdownTimer from '../components/common/CountdownTimer';
import TagBadge from '../components/common/TagBadge';
import './Home.css';

const Home = () => {
    const [categories, setCategories] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Categories
            const catRes = await getCategories();
            const subCategories = (catRes.data || []).filter(cat => cat.parentId);
            setCategories(subCategories);

            // Fetch All Products
            const prodRes = await getProducts({ limit: 50 });
            const allProducts = prodRes.data || [];

            // Filter products by tags
            const bestSellerProds = allProducts.filter(p =>
                p.tags?.some(tag => tag.toLowerCase().includes('best') || tag.toLowerCase().includes('seller'))
            );
            const newArrivalProds = allProducts.filter(p =>
                p.tags?.some(tag => tag.toLowerCase().includes('new'))
            );
            const trendingProds = allProducts.filter(p =>
                p.tags?.some(tag => tag.toLowerCase().includes('trend'))
            );

            // Set state
            setFeaturedProducts(allProducts.filter(p => p.featured).slice(0, 8));
            setBestSellers(bestSellerProds.slice(0, 8));
            setNewArrivals(newArrivalProds.slice(0, 8));
            setTrendingProducts(trendingProds.slice(0, 8));

        } catch (error) {
            console.error("Error loading home data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="home-loading">
                <div className="spinner-large"></div>
                <p>Loading amazing products...</p>
            </div>
        );
    }

    return (
        <div className="home-page">
            <div className="container">

                {/* Hero Slider */}
                <HeroSlider />

                {/* Category Slider */}
                <section className="category-carousel-section">
                    <div className="section-header-home">
                        <h2 className="section-title-home">Shop by Category</h2>
                        <p className="section-subtitle">Explore our wide range of products</p>
                    </div>
                    <CategorySlider categories={categories} />
                </section>

                {/* Flash Sale Section */}
                {featuredProducts.length > 0 && (
                    <section className="flash-sale-section">
                        <div className="flash-header">
                            <div className="flash-title-group">
                                <span className="flash-title">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
                                    </svg>
                                    Flash Sale
                                </span>
                                <div className="flash-timer-badge">
                                    <span>Ends in:</span>
                                    <CountdownTimer targetDate={new Date(new Date().getTime() + 4 * 60 * 60 * 1000)} />
                                </div>
                            </div>
                            <Link to="/products?sale=true" className="flash-see-all">
                                See All →
                            </Link>
                        </div>
                        <div className="products-grid">
                            {featuredProducts.slice(0, 6).map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Promotional Cards */}
                <section className="promo-section">
                    <div className="promo-grid">
                        <Link to="/products" className="promo-card pc-warm">
                            <div className="pc-blob blob-1"></div>
                            <div className="pc-blob blob-2"></div>
                            <div className="pc-content-left">
                                <h3 className="pc-headline">Bursting with<br />Savings!</h3>
                                <p className="pc-subtext">Get fresh groceries delivered in<br />10 minutes.</p>
                                <span className="pc-btn">Order Now <span style={{ fontSize: '1.2em' }}>→</span></span>
                            </div>
                            <div className="pc-content-right">
                                <span className="pc-big-type" style={{ fontSize: '10rem', transform: 'rotate(-10deg)' }}>🥦</span>
                            </div>
                        </Link>

                        <Link to="/products?free_delivery=true" className="promo-card pc-cool">
                            <div className="pc-blob blob-1" style={{ background: 'rgba(255,255,255,0.2)' }}></div>
                            <div className="pc-blob blob-2" style={{ background: 'rgba(255,255,255,0.15)' }}></div>
                            <div className="pc-content-left">
                                <div className="pc-label">ALL NEW EXPERIENCE</div>
                                <h3 className="pc-headline">₹0 Delivery Fee</h3>
                                <p className="pc-subtext">On your first order above ₹199</p>
                                <span className="pc-btn">Start Shopping <span style={{ fontSize: '1.2em' }}>→</span></span>
                            </div>
                            <div className="pc-content-right">
                                <span className="pc-big-type" style={{ fontSize: '10rem' }}>🛵</span>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* Best Sellers */}
                {bestSellers.length > 0 && (
                    <section className="product-section">
                        <div className="section-header-home">
                            <div className="section-title-with-badge">
                                <h2 className="section-title-home">Best Sellers</h2>
                                <TagBadge tag="Best Seller" size="medium" />
                            </div>
                            <Link to="/products?tag=best-seller" className="see-all-link">
                                See All →
                            </Link>
                        </div>
                        <div className="products-grid">
                            {bestSellers.map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Trending Now */}
                {trendingProducts.length > 0 && (
                    <section className="product-section">
                        <div className="section-header-home">
                            <div className="section-title-with-badge">
                                <h2 className="section-title-home">Trending Now</h2>
                                <TagBadge tag="Trending" size="medium" />
                            </div>
                            <Link to="/products?tag=trending" className="see-all-link">
                                See All →
                            </Link>
                        </div>
                        <div className="products-grid">
                            {trendingProducts.map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    </section>
                )}

                {/* New Arrivals */}
                {newArrivals.length > 0 && (
                    <section className="product-section">
                        <div className="section-header-home">
                            <div className="section-title-with-badge">
                                <h2 className="section-title-home">New Arrivals</h2>
                                <TagBadge tag="New Arrival" size="medium" />
                            </div>
                            <Link to="/products?tag=new" className="see-all-link">
                                See All →
                            </Link>
                        </div>
                        <div className="products-grid">
                            {newArrivals.map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Featured Products */}
                {featuredProducts.length > 0 && (
                    <section className="product-section">
                        <div className="section-header-home">
                            <h2 className="section-title-home">Freshly Picked for You</h2>
                            <Link to="/products" className="see-all-link">
                                See All →
                            </Link>
                        </div>
                        <div className="products-grid">
                            {featuredProducts.map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
};

export default Home;
