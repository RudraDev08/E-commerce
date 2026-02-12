import React from 'react';
import ProductCard from '../components/product/ProductCard';
import { CartProvider } from '../context/CartContext';
import '../components/product/ProductCard.css';

/**
 * Product Card Demo Page
 * Showcases all features of the enhanced product card
 */
const ProductCardDemo = () => {
    // Mock product data with all features
    const mockProducts = [
        {
            _id: '1',
            name: 'Samsung Galaxy Fold 6',
            slug: 'samsung-galaxy-fold-6',
            brand: { name: 'SAMSUNG' },
            price: 180000,
            compareAtPrice: 200000,
            currency: 'INR',
            image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
            rating: 4.8,
            reviewCount: 120,
            inStock: true,
            stock: 25,
            freeDelivery: true,
            hasVariants: false,
            isNew: true,
            isFeatured: true,
            colorVariants: [
                { name: 'Phantom Black', hex: '#1a1a1a' },
                { name: 'Phantom Silver', hex: '#c0c0c0' },
                { name: 'Phantom Green', hex: '#4ade80' },
                { name: 'Phantom Pink', hex: '#f472b6' },
                { name: 'Phantom Blue', hex: '#60a5fa' },
            ]
        },
        {
            _id: '2',
            name: 'Apple iPhone 15 Pro Max',
            slug: 'iphone-15-pro-max',
            brand: { name: 'APPLE' },
            price: 159900,
            compareAtPrice: 179900,
            currency: 'INR',
            image: 'https://images.unsplash.com/photo-1592286927505-c0d0eb5e8a99?w=400',
            rating: 4.9,
            reviewCount: 450,
            inStock: true,
            stock: 8,
            freeDelivery: true,
            hasVariants: true,
            isBestseller: true,
            colorVariants: [
                { name: 'Natural Titanium', hex: '#8b7355' },
                { name: 'Blue Titanium', hex: '#4a5568' },
                { name: 'White Titanium', hex: '#e5e7eb' },
                { name: 'Black Titanium', hex: '#1f2937' },
            ]
        },
        {
            _id: '3',
            name: 'Sony WH-1000XM5 Wireless Headphones',
            slug: 'sony-wh-1000xm5',
            brand: { name: 'SONY' },
            price: 29990,
            compareAtPrice: 34990,
            currency: 'INR',
            image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400',
            rating: 4.7,
            reviewCount: 890,
            inStock: true,
            stock: 45,
            freeDelivery: true,
            hasVariants: false,
            isNew: false,
            colorVariants: [
                { name: 'Black', hex: '#000000' },
                { name: 'Silver', hex: '#c0c0c0' },
            ]
        },
        {
            _id: '4',
            name: 'Dell XPS 15 Laptop',
            slug: 'dell-xps-15',
            brand: { name: 'DELL' },
            price: 145000,
            currency: 'INR',
            image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400',
            rating: 4.6,
            reviewCount: 234,
            inStock: true,
            stock: 12,
            freeDelivery: true,
            hasVariants: true,
            isFeatured: true,
            colorVariants: [
                { name: 'Platinum Silver', hex: '#e5e7eb' },
                { name: 'Frost White', hex: '#f9fafb' },
            ]
        },
        {
            _id: '5',
            name: 'Canon EOS R6 Mark II',
            slug: 'canon-eos-r6-mark-ii',
            brand: { name: 'CANON' },
            price: 249990,
            compareAtPrice: 279990,
            currency: 'INR',
            image: 'https://images.unsplash.com/photo-1606980707146-b88b8c4f7e4b?w=400',
            rating: 4.9,
            reviewCount: 156,
            inStock: true,
            stock: 5,
            freeDelivery: true,
            hasVariants: false,
            isNew: true,
            isBestseller: true,
        },
        {
            _id: '6',
            name: 'Nike Air Max 270',
            slug: 'nike-air-max-270',
            brand: { name: 'NIKE' },
            price: 12995,
            compareAtPrice: 14995,
            currency: 'INR',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
            rating: 4.5,
            reviewCount: 678,
            inStock: false,
            stock: 0,
            freeDelivery: false,
            hasVariants: true,
            colorVariants: [
                { name: 'Black/White', hex: '#000000' },
                { name: 'Red/White', hex: '#ef4444' },
                { name: 'Blue/White', hex: '#3b82f6' },
                { name: 'Green/White', hex: '#10b981' },
            ]
        },
        {
            _id: '7',
            name: 'Samsung 55" QLED 4K Smart TV',
            slug: 'samsung-55-qled-tv',
            brand: { name: 'SAMSUNG' },
            price: 89990,
            compareAtPrice: 109990,
            currency: 'INR',
            image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
            rating: 4.7,
            reviewCount: 345,
            inStock: true,
            stock: 18,
            freeDelivery: true,
            hasVariants: false,
            isFeatured: true,
        },
        {
            _id: '8',
            name: 'Bose QuietComfort Earbuds II',
            slug: 'bose-qc-earbuds-ii',
            brand: { name: 'BOSE' },
            price: 24990,
            currency: 'INR',
            image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
            rating: 4.8,
            reviewCount: 512,
            inStock: true,
            stock: 32,
            freeDelivery: true,
            hasVariants: false,
            isNew: true,
            colorVariants: [
                { name: 'Triple Black', hex: '#000000' },
                { name: 'Soapstone', hex: '#9ca3af' },
                { name: 'Eclipse Grey', hex: '#4b5563' },
            ]
        },
    ];

    return (
        <CartProvider>
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%)',
                padding: '3rem 1.5rem'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: '800',
                            color: '#1f2937',
                            marginBottom: '0.5rem'
                        }}>
                            Enhanced Product Card Demo
                        </h1>
                        <p style={{
                            fontSize: '1.125rem',
                            color: '#6b7280',
                            marginBottom: '1rem'
                        }}>
                            Showcasing all features: badges, wishlist, quick view, colors, ratings & more
                        </p>
                        <div style={{
                            display: 'inline-flex',
                            gap: '1rem',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            padding: '1rem',
                            background: 'rgba(255, 255, 255, 0.6)',
                            borderRadius: '1rem',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                ✨ Hover for effects
                            </span>
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                ❤️ Click wishlist
                            </span>
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                🎨 Select colors
                            </span>
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                🛒 Add to cart
                            </span>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="products-grid">
                        {mockProducts.map(product => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>

                    {/* Feature Highlights */}
                    <div style={{
                        marginTop: '4rem',
                        padding: '2rem',
                        background: 'white',
                        borderRadius: '1.5rem',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                    }}>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            marginBottom: '1.5rem'
                        }}>
                            🎯 Features Demonstrated
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1rem'
                        }}>
                            {[
                                { icon: '🏷️', title: 'Dynamic Badges', desc: 'NEW, SALE, FEATURED, BESTSELLER' },
                                { icon: '❤️', title: 'Wishlist Toggle', desc: 'Click heart icon to save favorites' },
                                { icon: '👁️', title: 'Quick View', desc: 'Preview product without navigation' },
                                { icon: '⭐', title: 'Star Ratings', desc: 'Visual ratings with review count' },
                                { icon: '🎨', title: 'Color Variants', desc: 'Interactive color swatches' },
                                { icon: '✅', title: 'Stock Status', desc: 'In Stock, Low Stock, Out of Stock' },
                                { icon: '📦', title: 'Delivery Info', desc: 'Free delivery indicators' },
                                { icon: '🛒', title: 'Smart CTA', desc: 'Add to Cart or Select Options' },
                            ].map((feature, idx) => (
                                <div key={idx} style={{
                                    padding: '1rem',
                                    background: '#f9fafb',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                        {feature.icon}
                                    </div>
                                    <div style={{
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        color: '#1f2937',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {feature.title}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        {feature.desc}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </CartProvider>
    );
};

export default ProductCardDemo;
