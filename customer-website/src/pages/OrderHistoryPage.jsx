import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const OrderHistoryPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    // Mock orders
    const orders = [];

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1>Order History</h1>

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <p>No orders yet</p>
                </div>
            ) : (
                <div style={{ marginTop: '2rem' }}>
                    {orders.map(order => (
                        <div key={order.id} className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                            <p>Order #{order.id}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderHistoryPage;
