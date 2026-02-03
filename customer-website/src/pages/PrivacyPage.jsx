import React from 'react';

const PrivacyPage = () => (
    <div className="container" style={{ padding: '4rem 0', maxWidth: '800px' }}>
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h3>Information We Collect</h3>
        <p>We collect information you provide directly to us when you create an account, make a purchase, or contact us.</p>
        <h3>How We Use Your Information</h3>
        <p>We use the information we collect to process your orders, communicate with you, and improve our services.</p>
    </div>
);

export default PrivacyPage;
