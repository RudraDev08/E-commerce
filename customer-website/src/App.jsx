import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';

// Layout Components
import Header from './components/common/Header';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Pages
import Home from './pages/Home';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryPage from './pages/CategoryPage';
import BrandPage from './pages/BrandPage';
import SearchPage from './pages/SearchPage';
import CartPage from './pages/CartPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';

import './styles/index.css';

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <WishlistProvider>
                    <CartProvider>
                        <div className="app">
                            <Header />
                            <Navbar />
                            <main className="main-content">
                                <Routes>
                                    {/* Public Pages */}
                                    <Route path="/" element={<Home />} />
                                    <Route path="/products" element={<ProductListingPage />} />
                                    <Route path="/product/:slug" element={<ProductDetailPage />} />
                                    <Route path="/category/:slug" element={<CategoryPage />} />
                                    <Route path="/brand/:slug" element={<BrandPage />} />
                                    <Route path="/search" element={<SearchPage />} />

                                    {/* Commerce Pages */}
                                    <Route path="/cart" element={<CartPage />} />
                                    <Route path="/checkout" element={<CheckoutPage />} />
                                    <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />

                                    {/* User Pages */}
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/register" element={<RegisterPage />} />
                                    <Route path="/profile" element={<ProfilePage />} />
                                    <Route path="/orders" element={<OrderHistoryPage />} />

                                    {/* Utility Pages */}
                                    <Route path="/about" element={<AboutPage />} />
                                    <Route path="/contact" element={<ContactPage />} />
                                    <Route path="/privacy" element={<PrivacyPage />} />
                                    <Route path="/terms" element={<TermsPage />} />

                                    {/* 404 */}
                                    <Route path="*" element={<NotFoundPage />} />
                                </Routes>
                            </main>
                            <Footer />
                        </div>
                    </CartProvider>
                </WishlistProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
