import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../api/categoryApi';
import { getFeaturedProducts } from '../api/productApi';
import { useCart } from '../context/CartContext';
import { formatCurrency, getImageUrl } from '../utils/formatters';
import HeroSlider from '../components/home/HeroSlider';
import CategorySlider from '../components/home/CategorySlider';
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
                const catRes = await getCategories();
                // Show ONLY sub-categories (e.g. Women Clothing, Men Clothing) as requested
                const subCategories = (catRes.data || []).filter(cat => cat.parentId);
                setCategories(subCategories);

                // Fetch Featured Products
                const prodRes = await getFeaturedProducts(10);
                setFeaturedProducts(prodRes.data || []);

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

                {/* 2. Category Showcase (Auto Slider) */}
                <section className="category-carousel-section">
                    <div className="section-header-home">
                        <h2 className="section-title-home">Shop by Category</h2>
                    </div>
                    <CategorySlider categories={categories} />
                </section>

                {/* 3. Flash Sale Section (Modern) */}
                <section className="flash-sale-section">
                    <div className="flash-header">
                        <div className="flash-title-group">
                            <span className="flash-title">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" /></svg>
                                Flash Sale
                            </span>
                            <div className="flash-timer-badge">
                                <span>Ends in:</span>
                                <CountdownTimer targetDate={new Date(new Date().getTime() + 4 * 60 * 60 * 1000 + 59 * 60 * 1000 + 43 * 1000)} />
                            </div>
                        </div>
                        <Link to="/products?sale=true" className="flash-see-all">See All &gt;</Link>
                    </div>
                    <div className="product-horizontal-list">
                        {featuredProducts.slice(0, 5).map(product => (
                            <HomeProductCard key={`sale-${product._id}`} product={{ ...product, price: product.price * 0.9 }} />
                        ))}
                    </div>
                </section>

                {/* 4. Promotional Cards (Premium Gradients) */}
                <section className="promo-section">
                    <div className="promo-grid">
                        {/* Card 1: Grocery Delivery */}
                        <Link to="/products" className="promo-card pc-warm">
                            <div className="pc-blob blob-1"></div>
                            <div className="pc-blob blob-2"></div>

                            <div className="pc-content-left">
                                <h3 className="pc-headline">Bursting with <br />Savings!</h3>
                                <p className="pc-subtext">Get fresh groceries delivered in <br />10 minutes.</p>
                                <span className="pc-btn">Order Now <span style={{ fontSize: '1.2em' }}>→</span></span>
                            </div>
                            <div className="pc-content-right">
                                {/* Using Emoji as 3D asset placeholder for beauty/reliability */}
                                <span className="pc-big-type" style={{ fontSize: '10rem', transform: 'rotate(-10deg)', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}>🥦</span>
                            </div>
                        </Link>

                        {/* Card 2: Free Delivery */}
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
                                <span className="pc-big-type" style={{ fontSize: '10rem', transform: 'rotate(0deg)', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}>🛵</span>
                            </div>
                        </Link>
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
