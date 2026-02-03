import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HeroSlider.css';

const slides = [
    {
        id: 1,
        image: 'https://placehold.co/981x342/621ad4/ffffff?text=Groceries+in+10+Minutes',
        mobileImage: 'https://placehold.co/600x400/621ad4/ffffff?text=10+Min+Delivery',
        title: "Groceries in 10 Minutes",
        subtitle: "Fresh vegetables, fruits and more delivered to your doorstep.",
        cta_text: "Shop Now",
        cta_link: "/products",
        bg: "linear-gradient(90deg, #2b0a5a 0%, #621ad4 100%)"
    },
    {
        id: 2,
        image: 'https://placehold.co/981x342/ff3269/ffffff?text=Mega+Savings',
        mobileImage: 'https://placehold.co/600x400/ff3269/ffffff?text=Mega+Sale',
        title: "Mega Savings",
        subtitle: "Up to 50% OFF on household essentials.",
        cta_text: "View Offers",
        cta_link: "/products?sort=discount",
        bg: "linear-gradient(90deg, #ff3269 0%, #ff5e62 100%)"
    },
    {
        id: 3,
        image: 'https://placehold.co/981x342/10b981/ffffff?text=Fresh+from+Farm',
        mobileImage: 'https://placehold.co/600x400/10b981/ffffff?text=Fresh+Fruits',
        title: "Fresh from Farm",
        subtitle: "Premium strawberries and exotic fruits.",
        cta_text: "Buy Now",
        cta_link: "/category/fruits",
        bg: "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
    }
];

const HeroSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000); // 5 Seconds auto-play

        return () => clearInterval(timer);
    }, []);

    const goToSlide = (index) => setCurrentSlide(index);

    return (
        <div className="hero-slider">
            <div className="slider-wrapper" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {slides.map((slide) => (
                    <div key={slide.id} className="slide" style={{ background: slide.bg }}>
                        <div className="container slide-content-wrapper">
                            {/* Text Content */}
                            <div className="slide-text-content">
                                <h2>{slide.title}</h2>
                                <p>{slide.subtitle}</p>
                                <Link to={slide.cta_link} className="slide-cta">{slide.cta_text}</Link>
                            </div>

                            {/* Image Content - Using placeholder/mock if URL invalid */}
                            <div className="slide-image-content">
                                <img src={slide.image} alt={slide.title} onError={(e) => e.target.style.display = 'none'} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Dots */}
            <div className="slider-dots">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                        onClick={() => goToSlide(index)}
                    />
                ))}
            </div>

            {/* Arrows */}
            <button className="slider-arrow left" onClick={() => setCurrentSlide((curr) => (curr - 1 + slides.length) % slides.length)}>‹</button>
            <button className="slider-arrow right" onClick={() => setCurrentSlide((curr) => (curr + 1) % slides.length)}>›</button>
        </div>
    );
};

export default HeroSlider;
