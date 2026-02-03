import React from 'react';

const Newsletter = () => {
    return (
        <section style={{ background: '#f8f9fa', padding: '4rem 0', borderTop: '1px solid #e5e7eb' }}>
            <div className="container" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📧</span>
                <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', color: '#1e1e1e' }}>
                    Subscribe to Our Newsletter
                </h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                    Get the latest updates on new products and upcoming sales directly in your inbox.
                </p>

                <form style={{ display: 'flex', gap: '0.5rem' }} onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder="Your email address"
                        style={{
                            flex: 1,
                            padding: '1rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.5rem',
                            fontSize: '1rem'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            background: '#621ad4',
                            color: 'white',
                            padding: '0 2rem',
                            borderRadius: '0.5rem',
                            fontWeight: '700',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Subscribe
                    </button>
                </form>

                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '1rem' }}>
                    We respect your privacy. Unsubscribe at any time.
                </p>
            </div>
        </section>
    );
};

export default Newsletter;
