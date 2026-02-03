import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency, getImageUrl } from '../utils/formatters';
import './CartPage.css';

const CartPage = () => {
    const { cart, updateQuantity, removeFromCart, clearCart } = useCart();

    if (cart.items.length === 0) {
        return (
            <div className="cart-page">
                <div className="container">
                    <div className="empty-cart">
                        <div className="empty-cart-icon">🛒</div>
                        <h1>Your Cart is Empty</h1>
                        <p>Looks like you haven't added anything to your cart yet.</p>
                        <Link to="/products" className="btn btn-primary btn-lg">
                            Start Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="container">
                <h1>Shopping Cart ({cart.items.reduce((acc, item) => acc + item.quantity, 0)} Items)</h1>

                <div className="cart-grid">
                    {/* Cart Items List */}
                    <div className="cart-items-list">
                        {cart.items.map(item => (
                            <div key={`${item.productId}-${item.variantId}`} className="cart-item-card">
                                <div className="cart-item-content">
                                    <div className="cart-item-image">
                                        <Link to={`/product/${item.slug}`}>
                                            <img
                                                src={getImageUrl(item.image)}
                                                alt={item.name}
                                                onError={(e) => {
                                                    e.target.src = 'https://placehold.co/120x120?text=No+Image';
                                                }}
                                            />
                                        </Link>
                                    </div>
                                    <div className="cart-item-details">
                                        <div className="item-header">
                                            <h3>
                                                <Link to={`/product/${item.slug}`}>{item.name}</Link>
                                            </h3>
                                            {item.variant && (
                                                <div className="item-variant">
                                                    {item.variant.size && <span>Size: {item.variant.size}</span>}
                                                    {item.variant.color && <span>Color: {item.variant.color}</span>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="item-price">
                                            {formatCurrency(item.price)}
                                        </div>

                                        <div className="item-controls">
                                            <div className="quantity-control">
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    −
                                                </button>
                                                <span className="qty-display">{item.quantity}</span>
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                                                    disabled={item.quantity >= item.stock}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                className="remove-btn"
                                                onClick={() => removeFromCart(item.productId, item.variantId)}
                                            >
                                                🗑️ Remove
                                            </button>
                                        </div>

                                        {item.quantity >= item.stock && (
                                            <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                                Max stock reached
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div>
                        <div className="cart-summary-card">
                            <h3>Order Summary</h3>
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>{formatCurrency(cart.subtotal)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping estimate</span>
                                <span style={{ color: 'var(--success)' }}>Free</span>
                            </div>
                            <div className="summary-row">
                                <span>Tax (18% GST)</span>
                                <span>{formatCurrency(cart.tax)}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Order Total</span>
                                <span>{formatCurrency(cart.total)}</span>
                            </div>

                            <Link to="/checkout" className="btn btn-primary checkout-btn">
                                🔒 Proceed to Checkout
                            </Link>

                            <button className="clear-cart-btn" onClick={clearCart}>
                                Clear Shopping Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
