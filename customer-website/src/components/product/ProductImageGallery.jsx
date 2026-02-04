import React, { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../../utils/formatters';
import '../../styles/ProductDetails.css';

const ProductImageGallery = ({ images, alt, videoUrl }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const [isZooming, setIsZooming] = useState(false);

    // Swipe State
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const mainImageRef = useRef(null);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        setActiveIndex(0);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo(0, 0);
        }
    }, [images]);

    // Handle Desktop Zoom
    const handleMouseMove = (e) => {
        if (!mainImageRef.current) return;
        const { left, top, width, height } = mainImageRef.current.getBoundingClientRect();

        let x = ((e.clientX - left) / width) * 100;
        let y = ((e.clientY - top) / height) * 100;

        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        setZoomPosition({ x, y });
        setIsZooming(true);
    };

    const handleMouseLeave = () => {
        setIsZooming(false);
    };

    // Mobile Swipe Handlers
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            if (activeIndex < images.length - 1) setActiveIndex(prev => prev + 1);
        }
        if (isRightSwipe) {
            if (activeIndex > 0) setActiveIndex(prev => prev - 1);
        }
    };

    return (
        <div className="gallery-wrapper">
            {/* Main Image Viewport */}
            <div
                className="main-viewport"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={() => window.innerWidth < 768 && setIsLightboxOpen(true)}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                ref={mainImageRef}
            >
                {/* Desktop Zoom Result */}
                {isZooming && window.innerWidth >= 768 && (
                    <div
                        className="zoom-result"
                        style={{
                            backgroundImage: `url(${getImageUrl(images[activeIndex])})`,
                            backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`
                        }}
                    />
                )}

                {/* Main Image */}
                <img
                    src={getImageUrl(images[activeIndex])}
                    alt={alt}
                    className="main-display-image"
                />

                {/* Mobile: Dots */}
                <div className="mobile-dots">
                    {images.map((_, idx) => (
                        <div key={idx} className={`dot ${idx === activeIndex ? 'active' : ''}`} />
                    ))}
                </div>

                {/* Desktop: Zoom indication overlay */}
                <div className="zoom-trigger" />
            </div>

            {/* Thumbnails */}
            <div className="thumbnails-strip" ref={scrollContainerRef}>
                {images.map((img, idx) => (
                    <div
                        key={idx}
                        className={`thumbnail-item ${idx === activeIndex ? 'active' : ''}`}
                        onClick={() => setActiveIndex(idx)}
                        onMouseEnter={() => setActiveIndex(idx)}
                    >
                        <img src={getImageUrl(img)} alt={`Thumbnail ${idx}`} />
                    </div>
                ))}
                {videoUrl && (
                    <div className="thumbnail-item video-thumb">
                        <span>▶</span>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {isLightboxOpen && (
                <div className="lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setIsLightboxOpen(false)}>×</button>
                        <img src={getImageUrl(images[activeIndex])} alt={alt} />

                        <div className="lightbox-nav prev" onClick={() => setActiveIndex(prev => prev > 0 ? prev - 1 : images.length - 1)}>‹</div>
                        <div className="lightbox-nav next" onClick={() => setActiveIndex(prev => prev < images.length - 1 ? prev + 1 : 0)}>›</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductImageGallery;
