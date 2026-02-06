import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

import './Header.css';

const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const { getCartCount } = useCart();

    const { isAuthenticated, user } = useAuth();
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
                {/* Left Section: Logo & Location */}
                <div className="header-left">
                    <div className="header-logo">
                        <Link to="/">zepto</Link>
                    </div>
                    <div className="vertical-divider"></div>
                    <div className="u-location-block">
                        <div className="u-delivery-time">
                            10 minutes delivery
                        </div>
                        <div className="u-location-selector">
                            New York, USA <span className="arrow-down">▼</span>
                        </div>
                    </div>
                </div>

                {/* Center Section: Search */}
                <div className="header-center">
                    <form onSubmit={handleSearch} className="search-input-wrapper">
                        <span className="search-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search for 'milk'"
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>

                {/* Right Section: Icons */}
                <div className="header-right">
                    {isAuthenticated ? (
                        <Link to="/profile" className="icon-link" aria-label="Profile">
                            <span className="icon-wrapper">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </span>
                            <span className="icon-label">Profile</span>
                        </Link>
                    ) : (
                        <Link to="/login" className="icon-link" aria-label="Login">
                            <span className="icon-wrapper">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </span>
                            <span className="icon-label">Login</span>
                        </Link>
                    )}



                    <Link to="/cart" className="icon-link" aria-label="Cart">
                        <div className="icon-wrapper">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                            {getCartCount() > 0 && <span className="icon-badge">{getCartCount()}</span>}
                        </div>
                        <span className="icon-label">Cart</span>
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Header;
