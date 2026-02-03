import React from 'react';
import './TagBadge.css';

/**
 * TagBadge Component
 * Displays product tags with color-coded badges
 * Tags: Best Seller, Trending, New Arrival, etc.
 */
const TagBadge = ({ tag, size = 'small' }) => {
    if (!tag) return null;

    const getTagStyle = (tagName) => {
        const normalizedTag = tagName.toLowerCase();

        if (normalizedTag.includes('best') || normalizedTag.includes('seller')) {
            return 'tag-bestseller';
        }
        if (normalizedTag.includes('trend')) {
            return 'tag-trending';
        }
        if (normalizedTag.includes('new')) {
            return 'tag-new';
        }
        if (normalizedTag.includes('sale') || normalizedTag.includes('offer')) {
            return 'tag-sale';
        }
        if (normalizedTag.includes('limited')) {
            return 'tag-limited';
        }
        return 'tag-default';
    };

    const getTagIcon = (tagName) => {
        const normalizedTag = tagName.toLowerCase();

        if (normalizedTag.includes('best') || normalizedTag.includes('seller')) {
            return '⭐';
        }
        if (normalizedTag.includes('trend')) {
            return '🔥';
        }
        if (normalizedTag.includes('new')) {
            return '✨';
        }
        if (normalizedTag.includes('sale') || normalizedTag.includes('offer')) {
            return '🏷️';
        }
        if (normalizedTag.includes('limited')) {
            return '⚡';
        }
        return '🎯';
    };

    return (
        <span className={`tag-badge ${getTagStyle(tag)} tag-${size}`}>
            <span className="tag-icon">{getTagIcon(tag)}</span>
            <span className="tag-text">{tag}</span>
        </span>
    );
};

export default TagBadge;
