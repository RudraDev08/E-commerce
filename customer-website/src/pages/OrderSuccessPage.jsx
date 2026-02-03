import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../api/orderApi';
import { formatCurrency } from '../utils/formatters';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // In real app, fetch actual order. 
                // For now, if we just landed here, we might pass state or fetch by ID
                // But since we are mocking the ID in the redirect usually, let's try to fetch
                if (orderId) {
                    const response = await getOrderById(orderId);
                    setOrder(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching order", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    if (loading) {
        return (
            <div className="order-success-page loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="order-success-page">
            <div className="container">
                <div className="success-card">
                    <div className="success-icon">🎉</div>
                    <h1>Order Placed Successfully!</h1>
                    <p className="order-subtitle">Thank you for your purchase. Your order has been received.</p>

                    {order && (
                        <div className="order-details-box">
                            <div className="order-id">Order ID: <strong>{order.orderId}</strong></div>
                            <div className="order-amount">Total Amount: <strong>{formatCurrency(order.financials?.grandTotal || 0)}</strong></div>
                            <div className="order-status">
                                Status: <span className={`status-badge ${order.status}`}>{order.status}</span>
                            </div>
                        </div>
                    )}

                    <div className="action-buttons">
                        <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
                        {/* <Link to="/orders" className="btn btn-secondary">View My Orders</Link> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessPage;
