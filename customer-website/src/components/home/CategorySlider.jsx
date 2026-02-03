import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/formatters';
import './CategorySlider.css';

const CategoryCard = ({ category }) => {
    const [imageStatus, setImageStatus] = useState('loading'); // 'loading', 'loaded', 'error'

    return (
        <Link
            to={`/category/${category.slug}`}
            className="category-slider-item"
            title={category.name}
            aria-label={`Shop ${category.name}`}
        >
            <div className="cat-slider-img-wrapper">
                {/* Skeleton Loader */}
                {imageStatus === 'loading' && (
                    <div className="skeleton-loader" aria-hidden="true"></div>
                )}

                {/* Fallback Icon */}
                {imageStatus === 'error' && (
                    <div className="fallback-icon" aria-label="Image placeholder">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    </div>
                )}

                {/* Actual Image */}
                <img
                    src={getImageUrl(category.image)}
                    alt={category.name}
                    style={imageStatus === 'loaded' ? {} : { display: 'none' }}
                    onLoad={() => setImageStatus('loaded')}
                    onError={() => setImageStatus('error')}
                />
            </div>
            <span className="cat-slider-name">{category.name}</span>
        </Link>
    );
};

const CategorySlider = ({ categories }) => {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -350 : 350;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!categories || categories.length === 0) return null;

    return (
        <div className="category-slider-wrapper">
            <button
                className="cat-slider-arrow cat-left"
                onClick={() => scroll('left')}
                aria-label="Scroll categories left"
            >
                ‹
            </button>

            <div className="category-slider-container" ref={scrollRef}>
                {categories.map((cat) => (
                    <CategoryCard key={cat._id} category={cat} />
                ))}
            </div>

            <button
                className="cat-slider-arrow cat-right"
                onClick={() => scroll('right')}
                aria-label="Scroll categories right"
            >
                ›
            </button>
        </div>
    );
};

export default CategorySlider;
