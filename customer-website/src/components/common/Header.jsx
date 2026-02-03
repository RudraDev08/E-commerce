import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import './Header.css';

const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const { getCartCount } = useCart();
    const { wishlist } = useWishlist();
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    return (
        <header className="header">
            <div className="container header-container">
                {/* 1. Logo */}
                <div className="header-logo">
                    <Link to="/">zepto</Link>
                </div>

                {/* 2. Delivery Info (Mock) */}
                <div className="delivery-info">
                    <div className="delivery-time">
                        <span role="img" aria-label="lightning">⚡</span> 10 minutes
                    </div>
                    <div className="delivery-location">
                        New York, USA (Mock Location) ▼
                    </div>
                </div>

                {/* 3. Search Bar */}
                <div className="search-container">
                    <form onSubmit={handleSearch} className="search-input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search for 'milk'"
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>

                {/* 4. User Actions */}
                <div className="header-actions">
                    {isAuthenticated ? (
                        <div className="action-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                            <span className="action-icon">👤</span>
                            <span className="action-text">{user?.name?.split(' ')[0] || 'Profile'}</span>
                        </div>
                    ) : (
                        <Link to="/login" className="action-item">
                            <span className="action-icon">👤</span>
                            <span className="action-text">Login</span>
                        </Link>
                    )}

                    <Link to="/wishlist" className="action-item">
                        <div className="cart-icon-wrapper">
                            <span className="action-icon">❤️</span>
                            {wishlist.length > 0 && (
                                <span className="cart-badge">{wishlist.length}</span>
                            )}
                        </div>
                        <span className="action-text">Saved</span>
                    </Link>

                    <Link to="/cart" className="action-item">
                        <div className="cart-icon-wrapper">
                            <span className="action-icon">🛒</span>
                            {getCartCount() > 0 && (
                                <span className="cart-badge">{getCartCount()}</span>
                            )}
                        </div>
                        <span className="action-text">Cart</span>
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Header;
