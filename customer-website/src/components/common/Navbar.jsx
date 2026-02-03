import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <NavLink
                    to="/"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    end
                >
                    <span className="nav-icon">🏠</span>
                    <span className="nav-text">Home</span>
                </NavLink>

                <NavLink
                    to="/products"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <span className="nav-icon">🛍️</span>
                    <span className="nav-text">All Products</span>
                </NavLink>
            </div>
        </nav>
    );
};

export default Navbar;
