import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AboutPage.css';

const AboutPage = () => {
    return (
        <div className="about-page">

            {/* HERO SECTION */}
            <section className="about-hero">
                <div className="container about-hero-content">
                    <div className="about-hero-text">
                        <h1>Revolutionizing How You Shop</h1>
                        <p className="subtitle">
                            ShopHub isn't just a marketplace. It's a curated experience designed for the modern lifestyle, bringing quality and speed together.
                        </p>
                        <div className="about-hero-actions">
                            <Link to="/products" className="btn btn-primary btn-lg">
                                Start Shopping
                            </Link>
                            <button className="btn btn-outline btn-lg">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                Watch Our Story
                            </button>
                        </div>
                    </div>
                    <div className="about-hero-visual">
                        <img
                            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                            alt="Modern Shopping Experience"
                        />
                    </div>
                </div>
            </section>

            {/* STORY SECTION */}
            <section className="about-story">
                <div className="container story-grid">
                    <div className="story-image">
                        <img
                            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                            alt="Our Team Collaborating"
                        />
                    </div>
                    <div className="story-content">
                        <div className="badge badge-info mb-md">Our Story</div>
                        <h2>From Garage to Global</h2>
                        <p>
                            Founded in 2024, ShopHub started with a simple mission: to make premium products accessible to everyone with lightning-fast delivery. What began as a small operation in a garage has now grown into a global community of diverse customers and passionate team members.
                        </p>
                        <p>
                            We believe that shopping should be seamless, inspiring, and reliable. That's why we've built a platform that puts the user experience first, ensuring every click leads to satisfaction.
                        </p>
                    </div>
                </div>
            </section>

            {/* MISSION & VISION */}
            <section className="about-mission">
                <div className="container">
                    <div className="section-title">
                        <h2>Our Purpose</h2>
                        <p>Driven by a desire to innovate and serve.</p>
                    </div>
                    <div className="mission-grid">
                        <div className="mission-card">
                            <div className="mission-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                            </div>
                            <h3>Our Mission</h3>
                            <p>To provide an unparalleled shopping experience that combines the latest technology with human-centric design, making quality accessible to all.</p>
                        </div>
                        <div className="mission-card">
                            <div className="mission-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            </div>
                            <h3>Our Vision</h3>
                            <p>To be the world's most customer-centric company, where customers can find and discover anything they might want to buy online.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CORE VALUES */}
            <section className="about-values">
                <div className="container">
                    <div className="section-title">
                        <h2>Core Values</h2>
                        <p>The principles that guide every decision we make.</p>
                    </div>
                    <div className="values-grid">
                        <div className="value-item">
                            <div className="value-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                            <h4>Customer First</h4>
                            <p>We start with the customer and work backwards.</p>
                        </div>
                        <div className="value-item">
                            <div className="value-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                            </div>
                            <h4>Innovation</h4>
                            <p>We thrive on creativity and pushing boundaries.</p>
                        </div>
                        <div className="value-item">
                            <div className="value-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                            </div>
                            <h4>Sustainability</h4>
                            <p>Committed to a greener, more sustainable future.</p>
                        </div>
                        <div className="value-item">
                            <div className="value-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            </div>
                            <h4>Integrity</h4>
                            <p>We do the right thing, even when no one is watching.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="about-stats">
                <div className="container stats-grid">
                    <div className="stat-item">
                        <h3>50K+</h3>
                        <p>Products Available</p>
                    </div>
                    <div className="stat-item">
                        <h3>1M+</h3>
                        <p>Happy Customers</p>
                    </div>
                    <div className="stat-item">
                        <h3>100+</h3>
                        <p>Brand Partners</p>
                    </div>
                    <div className="stat-item">
                        <h3>24/7</h3>
                        <p>Customer Support</p>
                    </div>
                </div>
            </section>

            {/* TEAM SECTION */}
            <section className="about-team">
                <div className="container">
                    <div className="section-title">
                        <h2>Meet Our Leaders</h2>
                        <p>The visionaries behind ShopHub.</p>
                    </div>
                    <div className="team-grid">
                        <div className="team-card">
                            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="CEO" className="team-image" />
                            <div className="team-name">Alex Morgan</div>
                            <div className="team-role">CEO & Founder</div>
                        </div>
                        <div className="team-card">
                            <img src="https://images.unsplash.com/photo-1573496359-136d475583dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="CTO" className="team-image" />
                            <div className="team-name">Sarah Chen</div>
                            <div className="team-role">Chief Technology Officer</div>
                        </div>
                        <div className="team-card">
                            <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="COO" className="team-image" />
                            <div className="team-name">Michael Ross</div>
                            <div className="team-role">Head of Operations</div>
                        </div>
                        <div className="team-card">
                            <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="CMO" className="team-image" />
                            <div className="team-name">Emily Watson</div>
                            <div className="team-role">Head of Marketing</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="about-cta">
                <div className="container">
                    <h2>Ready to Experience Premium Shopping?</h2>
                    <p>Join thousands of satisfied customers who have made ShopHub their go-to destination.</p>
                    <Link to="/register" className="btn btn-primary" style={{ backgroundColor: 'white', color: 'var(--primary-600)' }}>
                        Join ShopHub Today
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
