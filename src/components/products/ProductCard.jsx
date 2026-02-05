import { Link } from 'react-router-dom';

/**
 * ProductCard Component
 * 
 * Premium, minimal product listing card for PLP
 * Inspired by Apple Store, Samsung, Amazon luxury listings
 * 
 * Design Principles:
 * - Focus on product image
 * - Highlight brand and price
 * - No stock/inventory indicators
 * - Clean, uncluttered UI
 */

const ProductCard = ({
    product,
    linkTo
}) => {
    // Format price with currency
    const formatPrice = (price) => {
        if (!price && price !== 0) return '—';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    // Get image URL with fallback
    const getImageUrl = () => {
        if (product?.image) {
            if (product.image.startsWith('http')) {
                return product.image;
            }
            return `${import.meta.env.VITE_API_URL || ''}/uploads/${product.image}`;
        }
        return 'https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image';
    };

    // Get category and brand text
    const getCategoryBrand = () => {
        const parts = [];
        if (product?.category?.name) parts.push(product.category.name);
        if (product?.brand?.name) parts.push(product.brand.name);
        return parts.join(' • ') || 'Product';
    };

    const CardContent = (
        <div className="group bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-200">
            {/* Image Container */}
            <div className="relative aspect-square bg-slate-50 overflow-hidden">
                <img
                    src={getImageUrl()}
                    alt={product?.name || 'Product'}
                    className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                />
            </div>

            {/* Content Section */}
            <div className="p-4">
                {/* Category • Brand */}
                <p className="text-xs font-medium text-slate-400 mb-1.5 truncate">
                    {getCategoryBrand()}
                </p>

                {/* Product Title */}
                <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-3 line-clamp-2 min-h-[2.5rem]">
                    {product?.name || 'Product Name'}
                </h3>

                {/* Price */}
                <p className="text-lg font-bold text-slate-900">
                    {formatPrice(product?.price)}
                </p>
            </div>
        </div>
    );

    // Return as link if linkTo provided, otherwise as div
    if (linkTo) {
        return (
            <Link to={linkTo} className="block">
                {CardContent}
            </Link>
        );
    }

    return CardContent;
};

export default ProductCard;
