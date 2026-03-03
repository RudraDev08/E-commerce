import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency, getImageUrl } from '../utils/formatters';
import { useStockPoller } from '../hooks/useStockPoller';
import './CartPage.css';

// ── Per-item polling wrapper — FIX 8 (60-second cart stock polling) ───────────
const CartItemRow = ({ item, onUpdateQuantity, onRemove }) => {
    const [liveStock, setLiveStock] = useState(item.availableStock ?? null);
    useStockPoller(item.variantId, (fresh) => setLiveStock(fresh), 60_000);

    const isOOS = liveStock !== null && liveStock <= 0;
    const isLowStock = liveStock !== null && liveStock > 0 && liveStock < 5;

    return (
        <div className={`cart-item-card ${isOOS ? 'oos-warning' : ''}`}>
            {/* Real-time OOS/low-stock banners */}
            {isOOS && (
                <div className="oos-banner">
                    ⚠️ This item is now out of stock. Remove it before checking out.
                </div>
            )}
            {isLowStock && (
                <div className="low-stock-banner">
                    Only {liveStock} left in stock!
                </div>
            )}

            <div className="cart-item-content">
                {/* Image */}
                <div className="cart-item-image">
                    <Link to={`/product/${item.slug}`}>
                        <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            onError={(e) => { e.target.src = 'https://placehold.co/120x120?text=No+Image'; }}
                        />
                    </Link>
                </div>

                {/* Details */}
                <div className="cart-item-details">
                    <div className="item-header">
                        <h3 className="item-name">
                            <Link to={`/product/${item.slug}`}>{item.name}</Link>
                        </h3>
                        <button
                            className="remove-btn"
                            onClick={() => onRemove(item.productId, item.variantId)}
                            aria-label="Remove item"
                        >
                            ✕
                        </button>
                    </div>

                    {item.variantInfo && <p className="item-variant">{item.variantInfo}</p>}

                    <div className="item-pricing">
                        <span className="item-price">{formatCurrency(item.price)}</span>
                    </div>

                    {/* Qty controls — increment blocked at liveStock cap */}
                    <div className="item-quantity">
                        <button
                            className="qty-btn"
                            onClick={() => onUpdateQuantity(item.productId, item.variantId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                        >
                            −
                        </button>
                        <span className="qty-display">{item.quantity}</span>
                        <button
                            className="qty-btn"
                            onClick={() => onUpdateQuantity(item.productId, item.variantId, item.quantity + 1)}
                            disabled={liveStock !== null && item.quantity >= liveStock}
                        >
                            +
                        </button>
                    </div>

                    <p className="item-subtotal">Subtotal: {formatCurrency(item.price * item.quantity)}</p>
                </div>
            </div>
        </div>
    );
};

// ── Main CartPage ─────────────────────────────────────────────────────────────
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
                    {/* Cart Items List — each item self-polls every 60s */}
                    <div className="cart-items-list">
                        {cart.items.map(item => (
                            <CartItemRow
                                key={`${item.productId}-${item.variantId}`}
                                item={item}
                                onUpdateQuantity={updateQuantity}
                                onRemove={removeFromCart}
                            />
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
