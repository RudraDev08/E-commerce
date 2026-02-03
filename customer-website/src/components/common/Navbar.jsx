import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { getCategories } from '../../api/categoryApi';
import './Navbar.css';

const Navbar = () => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await getCategories();
            // Assuming response.data.data is the array based on previous interactions
            // Or response.data depending on API consistency
            setCategories(response.data.data || []);
        } catch (error) {
            console.error("Error loading categories:", error);
        }
    };

    // Helper to get icon (Mock mapping)
    const getCategoryIcon = (slug) => {
        const icons = {
            'fruits-vegetables': '🍎',
            'dairy-bread': '🥛',
            'snacks-munchies': '🍟',
            'cold-drinks': '🥤',
            'instant-food': '🍜',
            'sweet-cravings': '🍫',
            'vegetables': '🥦',
            'fruits': '🍌',
            'default': '🛍️'
        };
        return icons[slug] || icons['default'];
    };

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

                {categories.map(category => (
                    <NavLink
                        key={category._id}
                        to={`/category/${category.slug}`}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{getCategoryIcon(category.slug)}</span>
                        <span className="nav-text">{category.name}</span>
                    </NavLink>
                ))}

                <NavLink
                    to="/products"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <span className="nav-icon">🔍</span>
                    <span className="nav-text">All Products</span>
                </NavLink>
            </div>
        </nav>
    );
};

export default Navbar;
