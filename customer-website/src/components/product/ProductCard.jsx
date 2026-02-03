import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatCurrency, getImageUrl, calculateDiscount } from '../../utils/formatters';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const { addToCart, isInCart } = useCart();
    const discount = calculateDiscount(product.basePrice, product.price);

    const handleAddToCart = (e) => {
        e.preventDefault();
        try {
            addToCart(product);
            alert('Product added to cart!');
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="product-card">
            <Link to={`/product/${product.slug}`} className="product-card-link">
                <div className="product-image">
                    <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        onError={(e) => {
                            e.target.src = 'https://placehold.co/300x300?text=No+Image';
                        }}
                    />
                    {discount > 0 && (
                        <span className="product-badge discount-badge">
                            {discount}% OFF
                        </span>
                    )}
                    {product.stock === 0 && (
                        <span className="product-badge out-of-stock-badge">
                            Out of Stock
                        </span>
                    )}
                </div>

                <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>

                    <div className="product-price">
                        <span className="current-price">{formatCurrency(product.price)}</span>
                        {product.basePrice > product.price && (
                            <span className="original-price">{formatCurrency(product.basePrice)}</span>
                        )}
                    </div>

                    {product.stock > 0 && product.stock < 10 && (
                        <p className="stock-warning">Only {product.stock} left!</p>
                    )}
                </div>
            </Link>

            <div className="product-actions">
                <button
                    className="btn btn-primary btn-sm add-to-cart-btn"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                >
                    {product.stock === 0 ? 'Out of Stock' : isInCart(product._id) ? 'In Cart' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
