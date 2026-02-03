import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const ProfilePage = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1>My Profile</h1>

            <div className="grid grid-cols-3" style={{ gap: '2rem', marginTop: '2rem' }}>
                <div>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3>Navigation</h3>
                        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <Link to="/profile">Profile</Link>
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <Link to="/orders">Orders</Link>
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <div className="card" style={{ padding: '2rem' }}>
                        <h3>Profile Information</h3>

                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Name:</strong> {user?.name}
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Email:</strong> {user?.email}
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Phone:</strong> {user?.phone}
                            </div>
                        </div>

                        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
