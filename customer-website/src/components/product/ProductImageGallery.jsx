import React, { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../../utils/formatters';
import '../../styles/ProductDetails.css';

const ProductImageGallery = ({ images, alt, videoUrl }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [fadingIn, setFadingIn] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const [isZooming, setIsZooming] = useState(false);

    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const mainImageRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // Reset to first image + trigger fade when images array changes (variant switch)
    useEffect(() => {
        setFadingIn(true);
        const t = setTimeout(() => setFadingIn(false), 280);
        setActiveIndex(0);
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTo(0, 0);
        return () => clearTimeout(t);
    }, [images]);

    // Fade-in animation when switching thumbnails
    const handleThumbnailClick = (idx) => {
        if (idx === activeIndex) return;
        setFadingIn(true);
        setTimeout(() => setFadingIn(false), 260);
        setActiveIndex(idx);
    };

    const handleMouseMove = (e) => {
        if (!mainImageRef.current) return;
        const { left, top, width, height } = mainImageRef.current.getBoundingClientRect();
        let x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
        let y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
        setZoomPosition({ x, y });
        setIsZooming(true);
    };

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };
    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const dist = touchStart - touchEnd;
        if (dist > minSwipeDistance && activeIndex < images.length - 1) {
            handleThumbnailClick(activeIndex + 1);
        }
        if (dist < -minSwipeDistance && activeIndex > 0) {
            handleThumbnailClick(activeIndex - 1);
        }
    };

    if (!images || images.length === 0) {
        return (
            <div className="gallery-wrapper">
                <div className="main-viewport gallery-placeholder">
                    <span>No image</span>
                </div>
            </div>
        );
    }

    return (
        <div className="gallery-wrapper">
            {/* Main Image Viewport */}
            <div
                className="main-viewport"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setIsZooming(false)}
                onClick={() => window.innerWidth < 768 && setIsLightboxOpen(true)}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                ref={mainImageRef}
            >
                {/* Zoom result (desktop only) */}
                {isZooming && window.innerWidth >= 768 && (
                    <div
                        className="zoom-result"
                        style={{
                            backgroundImage: `url(${getImageUrl(images[activeIndex])})`,
                            backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        }}
                    />
                )}

                {/* Main image with CSS fade transition */}
                <img
                    key={`${images[activeIndex]}-${activeIndex}`}
                    src={getImageUrl(images[activeIndex])}
                    alt={alt}
                    className={`main-display-image ${fadingIn ? 'gallery-fade-in' : ''}`}
                />

                {/* Mobile dots */}
                {images.length > 1 && (
                    <div className="mobile-dots">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                className={`dot ${idx === activeIndex ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); handleThumbnailClick(idx); }}
                                aria-label={`View image ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}

                <div className="zoom-trigger" />
            </div>

            {/* Thumbnails Strip */}
            {images.length > 1 && (
                <div className="thumbnails-strip" ref={scrollContainerRef}>
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            className={`thumbnail-item ${idx === activeIndex ? 'active' : ''}`}
                            onClick={() => handleThumbnailClick(idx)}
                            onMouseEnter={() => handleThumbnailClick(idx)}
                            aria-label={`View image ${idx + 1}`}
                        >
                            <img
                                src={getImageUrl(img)}
                                alt={`${alt} ${idx + 1}`}
                                loading="lazy"
                            />
                        </button>
                    ))}
                    {videoUrl && (
                        <button className="thumbnail-item video-thumb" aria-label="Play video">
                            <span aria-hidden="true">▶</span>
                        </button>
                    )}
                </div>
            )}

            {/* Lightbox (mobile) */}
            {isLightboxOpen && (
                <div
                    className="lightbox-overlay"
                    onClick={() => setIsLightboxOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image lightbox"
                >
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setIsLightboxOpen(false)} aria-label="Close">×</button>
                        <img src={getImageUrl(images[activeIndex])} alt={alt} />
                        <div
                            className="lightbox-nav prev"
                            onClick={() => handleThumbnailClick(activeIndex > 0 ? activeIndex - 1 : images.length - 1)}
                        >‹</div>
                        <div
                            className="lightbox-nav next"
                            onClick={() => handleThumbnailClick(activeIndex < images.length - 1 ? activeIndex + 1 : 0)}
                        >›</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductImageGallery;
