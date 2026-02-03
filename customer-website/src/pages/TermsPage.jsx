import React from 'react';

const TermsPage = () => (
    <div className="container" style={{ padding: '4rem 0', maxWidth: '800px' }}>
        <h1>Terms & Conditions</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h3>Acceptance of Terms</h3>
        <p>By accessing and using ShopHub, you accept and agree to be bound by the terms and conditions of this agreement.</p>
        <h3>Use of Service</h3>
        <p>You agree to use our service only for lawful purposes and in accordance with these Terms.</p>
    </div>
);

export default TermsPage;
