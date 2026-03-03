import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getImageUrl } from '../utils/formatters';
import { createOrder } from '../api/orderApi';
import toast from 'react-hot-toast';
import './CheckoutPage.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── FIX 2: idempotencyKey helpers ─────────────────────────────────────────────
const KEY_NAME = 'checkout_idempotency_key';

const getOrCreateKey = () => {
    let k = localStorage.getItem(KEY_NAME);
    if (!k) {
        k = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(KEY_NAME, k);
    }
    return k;
};

const clearKey = () => localStorage.removeItem(KEY_NAME);

// ── Component ──────────────────────────────────────────────────────────────────
const CheckoutPage = () => {
    const navigate = useNavigate();
    const { cart, clearCart, removeFromCart, updateCartItem } = useCart();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true); // FIX 3 — true while cart is being server-validated
    const [idempotencyKey] = useState(getOrCreateKey); // FIX 2 — stable UUID for this checkout tab
    const submittingRef = useRef(false);  // Prevents concurrent submissions

    const [formData, setFormData] = useState({
        fullName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        paymentMethod: 'cod',
    });

    // ── FIX 3: Server-side cart validation on mount ───────────────────────────
    useEffect(() => {
        if (!cart.items.length) { setValidating(false); return; }

        const validate = async () => {
            try {
                const payload = cart.items.map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                    clientPrice: parseFloat(item.price),
                }));

                const res = await fetch(`${API_BASE}/cart/validate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: payload }),
                });

                // Fail-open: if endpoint missing or errors — just proceed
                if (!res.ok) return;

                const { data } = await res.json();

                // Remove OOS / delisted items + notify user
                (data.removedItems || []).forEach(item => {
                    removeFromCart?.(item.productId, item.variantId);
                    toast.error(
                        `One item was removed — ${item.reason === 'OUT_OF_STOCK' ? 'out of stock' : 'no longer available'}.`,
                        { duration: 5000 }
                    );
                });

                // Update stale prices + notify user
                (data.priceChanges || []).forEach(item => {
                    updateCartItem?.(item.variantId, { price: item.newPrice });
                    toast(`Price updated: ₹${item.oldPrice.toFixed(2)} → ₹${item.newPrice.toFixed(2)}`, {
                        icon: '💰',
                        duration: 6000,
                    });
                });

            } catch (_) {
                // Best-effort — never block checkout
            } finally {
                setValidating(false);
            }
        };

        validate();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps


    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handlePaymentChange = (method) => setFormData(prev => ({ ...prev, paymentMethod: method }));

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        // FIX 2: double-submit guard — both state flag + ref cover rapid clicks AND concurrent React renders
        if (loading || submittingRef.current || cart.items.length === 0 || validating) return;
        submittingRef.current = true;
        setLoading(true);

        try {
            const orderPayload = {
                items: cart.items.map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                    // ⚠️  Never send price — backend must re-resolve from VariantMaster
                })),
                shippingAddress: {
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                },
                paymentMethod: formData.paymentMethod,
            };

            // FIX 2: pass idempotencyKey so backend deduplicates network retries
            const response = await createOrder(orderPayload, idempotencyKey);

            if (response.data.success) {
                clearCart();
                clearKey(); // FIX 2: reset key after success so next cart gets a fresh UUID
                navigate(`/order-success/${response.data.data.orderId}`);
            } else {
                alert(response.data.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            const code = error.response?.data?.code;
            const status = error.response?.status;

            if (code === 'INSUFFICIENT_STOCK' || status === 409) {
                alert('Stock changed or is insufficient. Reviewing your cart…');
                navigate('/cart');
            } else if (status === 422) {
                alert(error.response?.data?.message || 'Validation failed. Please check your details.');
            } else {
                alert(error.response?.data?.message || 'An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
            submittingRef.current = false;
        }
    };

    // ── Empty cart guard ───────────────────────────────────────────────────────
    if (!validating && cart.items.length === 0) {
        navigate('/cart');
        return null;
    }

    return (
        <div className="checkout-page">
            <div className="container">
                <h1>Checkout</h1>

                {/* FIX 3 — Validation banner */}
                {validating && (
                    <div className="validate-banner">
                        <span className="validate-spinner" />
                        Verifying stock &amp; prices…
                    </div>
                )}

                <div className="checkout-grid">

                    {/* ── Shipping Form ────────────────────────────────────── */}
                    <div className="checkout-form-container">
                        <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit}>
                            <div className="form-section">
                                <h3>Shipping Information</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Full Name *</label>
                                        <input type="text" name="fullName" className="form-input" value={formData.fullName} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email Address *</label>
                                        <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone Number *</label>
                                        <input type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group full-width">
                                        <label className="form-label">Delivery Address *</label>
                                        <textarea name="address" className="form-textarea" rows="3" value={formData.address} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">City *</label>
                                        <input type="text" name="city" className="form-input" value={formData.city} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">State *</label>
                                        <input type="text" name="state" className="form-input" value={formData.state} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Pincode *</label>
                                        <input type="text" name="pincode" className="form-input" value={formData.pincode} onChange={handleChange} required />
                                    </div>
                                </div>
                            </div>

                            {/* Payment */}
                            <div className="form-section">
                                <h3>Payment Method</h3>
                                <div className="payment-options">
                                    {[
                                        { id: 'cod', label: 'Cash on Delivery (COD)', sub: 'Pay when your order arrives' },
                                        { id: 'online', label: 'Online Payment', sub: 'Secure: UPI, Cards, Net Banking' },
                                    ].map(({ id, label, sub }) => (
                                        <div key={id} className={`payment-option ${formData.paymentMethod === id ? 'selected' : ''}`} onClick={() => handlePaymentChange(id)}>
                                            <input type="radio" name="paymentMethod" value={id} checked={formData.paymentMethod === id} onChange={() => { }} />
                                            <div><strong>{label}</strong><p className="text-sm text-secondary">{sub}</p></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* ── Order Summary ─────────────────────────────────────── */}
                    <div className="checkout-sidebar">
                        <div className="cart-summary-card">
                            <h3>Order Summary</h3>
                            <div className="order-items-preview">
                                {cart.items.map(item => (
                                    <div key={`${item.productId}-${item.variantId}`} className="preview-item">
                                        <img src={getImageUrl(item.image)} alt={item.name} onError={e => { e.target.src = 'https://placehold.co/60x60?text=Img'; }} />
                                        <div className="preview-details">
                                            <h4>{item.name}</h4>
                                            <p>Qty: {item.quantity}</p>
                                            <p>{formatCurrency(item.price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(cart.subtotal)}</span></div>
                            <div className="summary-row"><span>Shipping</span><span style={{ color: 'var(--success)' }}>Free</span></div>
                            <div className="summary-row"><span>Tax (18%)</span><span>{formatCurrency(cart.tax)}</span></div>
                            <div className="summary-row total"><span>Total Amount</span><span>{formatCurrency(cart.total)}</span></div>

                            <button
                                type="submit"
                                form="checkout-form"
                                className="btn btn-primary btn-lg place-order-btn"
                                disabled={loading || validating || cart.items.length === 0}
                                aria-busy={loading}
                            >
                                {validating ? 'Verifying cart…' : loading ? 'Placing Order…' : 'Place Order'}
                            </button>

                            <Link to="/cart" className="btn btn-outline" style={{ width: '100%', marginTop: '1rem', textAlign: 'center' }}>
                                ← Back to Cart
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
