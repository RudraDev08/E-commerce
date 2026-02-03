import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
    <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '6rem', margin: 0 }}>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '2rem' }}>
            Go Home
        </Link>
    </div>
);

export default NotFoundPage;
