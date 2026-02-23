import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getImageUrl } from '../utils/formatters';
import { createOrder } from '../api/orderApi';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { cart, clearCart } = useCart();
    const { isAuthenticated, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        paymentMethod: 'cod'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePaymentChange = (method) => {
        setFormData({ ...formData, paymentMethod: method });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Double-submission guard — idempotent handler
        if (loading || cart.items.length === 0) return;

        setLoading(true);
        try {
            // Prepare Order Payload
            // P0: Send only variantId & quantity. Totals are recalculated server-side.
            const orderPayload = {
                items: cart.items.map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity
                })),
                shippingAddress: {
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode
                },
                paymentMethod: formData.paymentMethod
            };

            const response = await createOrder(orderPayload);

            if (response.data.success) {
                clearCart();
                const orderId = response.data.data.orderId;
                navigate(`/order-success/${orderId}`);
            } else {
                alert(response.data.message || 'Failed to place order');
            }
        } catch (error) {
            console.error("Checkout Error:", error);

            // Handle specific 409 conflict code (Insufficient Stock or Price mismatch)
            const errorCode = error.response?.data?.code || error.code;
            if (errorCode === 'INSUFFICIENT_STOCK' || error.response?.status === 409) {
                alert("Stock changed or is insufficient. Please review your cart and try again.");
                navigate('/cart');
            } else {
                alert(error.response?.data?.message || "An error occurred while placing your order.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (cart.items.length === 0) {
        navigate('/cart');
        return null;
    }

    return (
        <div className="checkout-page">
            <div className="container">
                <h1>Checkout</h1>

                <div className="checkout-grid">
                    {/* Checkout Form */}
                    <div className="checkout-form-container">
                        <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit}>
                            {/* Shipping Details */}
                            <div className="form-section">
                                <h3>Shipping Information</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Full Name *</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            className="form-input"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Email Address *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Phone Number *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label className="form-label">Delivery Address *</label>
                                        <textarea
                                            name="address"
                                            className="form-textarea"
                                            rows="3"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">City *</label>
                                        <input
                                            type="text"
                                            name="city"
                                            className="form-input"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">State *</label>
                                        <input
                                            type="text"
                                            name="state"
                                            className="form-input"
                                            value={formData.state}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Pincode *</label>
                                        <input
                                            type="text"
                                            name="pincode"
                                            className="form-input"
                                            value={formData.pincode}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="form-section">
                                <h3>Payment Method</h3>
                                <div className="payment-options">
                                    <div
                                        className={`payment-option ${formData.paymentMethod === 'cod' ? 'selected' : ''}`}
                                        onClick={() => handlePaymentChange('cod')}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={formData.paymentMethod === 'cod'}
                                            onChange={() => { }}
                                        />
                                        <div>
                                            <strong>Cash on Delivery (COD)</strong>
                                            <p className="text-sm text-secondary">Pay when your order is delivered</p>
                                        </div>
                                    </div>

                                    <div
                                        className={`payment-option ${formData.paymentMethod === 'online' ? 'selected' : ''}`}
                                        onClick={() => handlePaymentChange('online')}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="online"
                                            checked={formData.paymentMethod === 'online'}
                                            onChange={() => { }}
                                        />
                                        <div>
                                            <strong>Online Payment</strong>
                                            <p className="text-sm text-secondary">Secure payment via UPI, Cards, or Net Banking</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="checkout-sidebar">
                        <div className="cart-summary-card">
                            <h3>Order Summary</h3>

                            <div className="order-items-preview">
                                {cart.items.map(item => (
                                    <div key={`${item.productId}-${item.variantId}`} className="preview-item">
                                        <img
                                            src={getImageUrl(item.image)}
                                            alt={item.name}
                                            onError={(e) => { e.target.src = 'https://placehold.co/60x60?text=No+Img'; }}
                                        />
                                        <div className="preview-details">
                                            <h4>{item.name}</h4>
                                            <p>Qty: {item.quantity}</p>
                                            <p>{formatCurrency(item.price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>{formatCurrency(cart.subtotal)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span style={{ color: 'var(--success)' }}>Free</span>
                            </div>
                            <div className="summary-row">
                                <span>Tax (18%)</span>
                                <span>{formatCurrency(cart.tax)}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total Amount</span>
                                <span>{formatCurrency(cart.total)}</span>
                            </div>

                            <button
                                type="submit"
                                form="checkout-form"
                                className="btn btn-primary btn-lg place-order-btn"
                                disabled={loading || cart.items.length === 0}
                                aria-busy={loading}
                                aria-label={loading ? 'Placing order...' : 'Place Order'}
                            >
                                {loading ? 'Placing Order...' : 'Place Order'}
                            </button>

                            <Link to="/cart" className="btn btn-outline" style={{ width: '100%', marginTop: '1rem', textAlign: 'center' }}>
                                Back to Cart
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
