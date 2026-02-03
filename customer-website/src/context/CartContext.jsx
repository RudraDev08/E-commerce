import React, { createContext, useState, useEffect, useContext } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState({ items: [], subtotal: 0, tax: 0, total: 0 });
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error loading cart:', error);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    }, [cart]);

    // Calculate totals
    const calculateTotals = (items) => {
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.18; // 18% GST
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };

    // Add item to cart
    const addToCart = (product, variant = null, quantity = 1) => {
        const variantId = variant?._id || null;
        const price = variant?.price || product.price;
        const stock = variant?.stock || product.stock;

        // Check stock
        if (stock < quantity) {
            throw new Error('Insufficient stock');
        }

        setCart(prevCart => {
            const existingItemIndex = prevCart.items.findIndex(
                item => item.productId === product._id && item.variantId === variantId
            );

            let newItems;
            if (existingItemIndex > -1) {
                // Update quantity
                newItems = [...prevCart.items];
                const newQuantity = newItems[existingItemIndex].quantity + quantity;

                if (newQuantity > stock) {
                    throw new Error('Insufficient stock');
                }

                newItems[existingItemIndex].quantity = newQuantity;
            } else {
                // Add new item
                newItems = [
                    ...prevCart.items,
                    {
                        productId: product._id,
                        variantId,
                        name: product.name,
                        slug: product.slug,
                        variant: variant ? {
                            size: variant.attributes?.size || '',
                            color: variant.attributes?.color || ''
                        } : null,
                        price,
                        quantity,
                        image: product.image,
                        sku: variant?.sku || product.sku,
                        stock
                    }
                ];
            }

            const totals = calculateTotals(newItems);
            return { items: newItems, ...totals };
        });
    };

    // Update item quantity
    const updateQuantity = (productId, variantId, quantity) => {
        if (quantity < 1) {
            removeFromCart(productId, variantId);
            return;
        }

        setCart(prevCart => {
            const newItems = prevCart.items.map(item => {
                if (item.productId === productId && item.variantId === variantId) {
                    if (quantity > item.stock) {
                        throw new Error('Insufficient stock');
                    }
                    return { ...item, quantity };
                }
                return item;
            });

            const totals = calculateTotals(newItems);
            return { items: newItems, ...totals };
        });
    };

    // Remove item from cart
    const removeFromCart = (productId, variantId) => {
        setCart(prevCart => {
            const newItems = prevCart.items.filter(
                item => !(item.productId === productId && item.variantId === variantId)
            );

            const totals = calculateTotals(newItems);
            return { items: newItems, ...totals };
        });
    };

    // Clear cart
    const clearCart = () => {
        setCart({ items: [], subtotal: 0, tax: 0, total: 0 });
    };

    // Get cart item count
    const getCartCount = () => {
        return cart.items.reduce((sum, item) => sum + item.quantity, 0);
    };

    // Check if item is in cart
    const isInCart = (productId, variantId = null) => {
        return cart.items.some(
            item => item.productId === productId && item.variantId === variantId
        );
    };

    const value = {
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartCount,
        isInCart,
        isCartOpen,
        setIsCartOpen
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
