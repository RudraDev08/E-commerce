import React from 'react';
import { Link } from 'react-router-dom';
import Newsletter from './Newsletter';
import './Footer.css';

const Footer = () => {
    return (
        <>
            <Newsletter />
            <footer className="footer">
                <div className="container">
                    <div className="footer-top">
                        {/* Column 1: About */}
                        <div className="footer-column">
                            <h3>About Us</h3>
                            <p className="footer-description">
                                We are your one-stop shop for fresh groceries, daily essentials, and more. Delivered to your doorstep in minutes.
                            </p>
                            <div className="social-links">
                                <a href="#" className="social-icon">F</a>
                                <a href="#" className="social-icon">I</a>
                                <a href="#" className="social-icon">T</a>
                                <a href="#" className="social-icon">Y</a>
                            </div>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div className="footer-column">
                            <h3>Quick Links</h3>
                            <ul className="footer-links">
                                <li><Link to="/about">About Us</Link></li>
                                <li><Link to="/contact">Contact Us</Link></li>
                                <li><Link to="/faq">FAQ</Link></li>
                                <li><Link to="/shipping">Shipping & Returns</Link></li>
                                <li><Link to="/privacy">Privacy Policy</Link></li>
                                <li><Link to="/terms">Terms & Conditions</Link></li>
                            </ul>
                        </div>

                        {/* Column 3: Categories */}
                        <div className="footer-column">
                            <h3>Top Categories</h3>
                            <ul className="footer-links">
                                <li><Link to="/category/fruits-vegetables">Fruits & Vegetables</Link></li>
                                <li><Link to="/category/dairy-bread">Dairy & Bread</Link></li>
                                <li><Link to="/category/snacks-munchies">Snacks & Munchies</Link></li>
                                <li><Link to="/category/cold-drinks">Cold Drinks</Link></li>
                                <li><Link to="/category/instant-food">Instant Food</Link></li>
                            </ul>
                        </div>

                        {/* Column 4: Contact Info */}
                        <div className="footer-column">
                            <h3>Contact Info</h3>
                            <ul className="footer-links contact-info">
                                <li>
                                    <span className="contact-icon">📍</span>
                                    <span>123 Market Street, New York, NY 10001</span>
                                </li>
                                <li>
                                    <span className="contact-icon">📞</span>
                                    <span>+1 (555) 123-4567</span>
                                </li>
                                <li>
                                    <span className="contact-icon">✉️</span>
                                    <span>support@store.com</span>
                                </li>
                                <li>
                                    <span className="contact-icon">🕒</span>
                                    <span>Mon - Sun: 8:00 AM - 10:00 PM</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} Zepto Clone. All Rights Reserved.</p>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;
