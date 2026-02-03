import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedCategories, getCategories } from '../api/categoryApi';
import { getFeaturedProducts } from '../api/productApi';
import { useCart } from '../context/CartContext';
import { formatCurrency, getImageUrl } from '../utils/formatters';
import HeroSlider from '../components/home/HeroSlider';
import CountdownTimer from '../components/common/CountdownTimer';
import './Home.css';

const Home = () => {
    const [categories, setCategories] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Categories for Top Carousel
                const catRes = await getCategories(); // Get all to be safe or featured
                setCategories(catRes.data.data || []);

                // Fetch Featured Products for "Freshly Picked" or similar section
                const prodRes = await getFeaturedProducts(10);
                setFeaturedProducts(prodRes.data.data || []);

            } catch (error) {
                console.error("Error loading home data:", error);
            }
        };
        fetchData();
    }, []);

    // Product Card Component (Internal for now for specific Home style)
    const HomeProductCard = ({ product }) => (
        <div className="product-card-home">
            <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
                <div className="pc-image-wrapper">
                    <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        onError={(e) => { e.target.src = 'https://placehold.co/150x150?text=No+Img'; }}
                    />
                </div>
                <div className="pc-details">
                    <h4>{product.name}</h4>
                    <div className="pc-weight">500g (Mock)</div> {/* Mock weight for now */}
                </div>
            </Link>
            <div className="pc-footer">
                <div className="pc-prices">
                    <span className="pc-price">{formatCurrency(product.price)}</span>
                    {product.basePrice > product.price && (
                        <span className="pc-price-old">{formatCurrency(product.basePrice)}</span>
                    )}
                </div>
                <button
                    className="pc-add-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        addToCart(product);
                    }}
                >
                    ADD
                </button>
            </div>
        </div>
    );

    return (
        <div className="home-page">
            <div className="container">

                {/* 1. Hero Slider (Main Banner) */}
                <HeroSlider />

                {/* 2. Category Showcase (Horizontal Scroll) */}
                <section className="category-carousel-section">
                    <div className="section-header-home">
                        <h2 className="section-title-home">Shop by Category</h2>
                    </div>
                    <div className="category-scroll-container">
                        {categories.map(cat => (
                            <Link to={`/category/${cat.slug}`} key={cat._id} className="category-carousel-item">
                                <div className="cat-image-wrapper">
                                    <img
                                        src={getImageUrl(cat.image)}
                                        alt={cat.name}
                                        onError={(e) => { e.target.src = `https://placehold.co/100x100?text=${cat.name[0]}`; }}
                                    />
                                </div>
                                <span className="cat-name-home">{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* 3. Flash Sale Section (New) */}
                <section className="product-section" style={{ background: '#fff1f2', margin: '0 -2000px', padding: '2rem 2000px' }}>
                    <div className="section-header-home">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h2 className="section-title-home" style={{ color: '#be123c' }}>⚡ Flash Sale</h2>
                            <CountdownTimer targetDate={new Date(new Date().getTime() + 5 * 60 * 60 * 1000)} /> {/* 5 hours from now */}
                        </div>
                        <Link to="/products?sale=true" className="see-all-link" style={{ color: '#be123c' }}>See All &gt;</Link>
                    </div>
                    <div className="product-horizontal-list">
                        {/* Mock Sales Items (Reusing featured for now) */}
                        {featuredProducts.slice(0, 5).map(product => (
                            <HomeProductCard key={`sale-${product._id}`} product={{ ...product, price: product.price * 0.9 }} />
                        ))}
                    </div>
                </section>

                {/* 2. Promo Banners */}
                <section className="promo-banners-section">
                    <div className="banners-grid">
                        <div className="promo-banner banner-1">
                            <div className="banner-content">
                                <h3 className="banner-title">Bursting with Savings!</h3>
                                <p className="banner-subtitle">Get fresh groceries delivered in <br />10 minutes.</p>
                                <Link to="/products" className="banner-btn">Order Now</Link>
                            </div>
                            <img src="https://placehold.co/300x300/ff9966/ffffff?text=Veggies" alt="Promo" className="banner-image" />
                        </div>
                        <div className="promo-banner banner-2">
                            <div className="banner-content">
                                <div style={{ textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '700', letterSpacing: '1px' }}>All New Experience</div>
                                <h3 className="banner-title" style={{ color: '#621ad4' }}>₹0 Delivery Fee</h3>
                                <p className="banner-subtitle" style={{ color: '#4c1399' }}>On your first order above ₹199</p>
                            </div>
                            <img src="https://placehold.co/300x300/e0c3fc/ffffff?text=Free" alt="Promo" className="banner-image" />
                        </div>
                    </div>
                </section>

                {/* 3. Product Section: Featured */}
                <section className="product-section">
                    <div className="section-header-home">
                        <h2 className="section-title-home">Freshly Picked for You</h2>
                        <Link to="/products" className="see-all-link">See All &gt;</Link>
                    </div>
                    <div className="product-horizontal-list">
                        {featuredProducts.length > 0 ? (
                            featuredProducts.map(product => (
                                <HomeProductCard key={product._id} product={product} />
                            ))
                        ) : (
                            <p>No featured products found.</p>
                        )}
                    </div>
                </section>

                {/* 4. Product Section: Snacks (Mock Logic) */}
                <section className="product-section">
                    <div className="section-header-home">
                        <h2 className="section-title-home">Snacks & Munchies</h2>
                        <Link to="/category/snacks" className="see-all-link">See All &gt;</Link>
                    </div>
                    <div className="product-horizontal-list">
                        {/* Reusing featured products as mock for now, ideally fetch by category */}
                        {featuredProducts.slice().reverse().map(product => (
                            <HomeProductCard key={`snack-${product._id}`} product={product} />
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
};

export default Home;
