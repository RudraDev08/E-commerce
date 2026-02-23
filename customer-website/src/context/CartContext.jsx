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

    // Load cart from localStorage on mount with strict schema validation
    useEffect(() => {
        const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);

                // Strict schema validation — never trust raw localStorage shape
                const isValid =
                    parsed !== null &&
                    typeof parsed === 'object' &&
                    Array.isArray(parsed.items);

                if (isValid) {
                    setCart(parsed);
                } else {
                    // Malformed schema detected — silently reset to prevent crashes
                    console.warn('[Cart] LocalStorage schema invalid. Resetting cart.');
                    localStorage.removeItem(STORAGE_KEYS.CART);
                }
            } catch (error) {
                // JSON.parse failure — corrupted data, clear it
                console.error('[Cart] LocalStorage parse failed. Clearing.', error);
                localStorage.removeItem(STORAGE_KEYS.CART);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    }, [cart]);

    // Calculate totals
    const calculateTotals = (items) => {
        const subtotal = items.reduce((sum, item) => {
            const price = parseFloat(item.price);
            if (isNaN(price)) {
                throw new Error(`Invalid price detected for item: ${item.name}`);
            }
            return sum + (price * item.quantity);
        }, 0);
        const tax = subtotal * 0.18; // 18% GST/Tax
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };

    // ========================================================================
    // 🔧 FIX: CART PAYLOAD CONSISTENCY (CRITICAL)
    // Cart accepts ONE single payload object
    // Cart NEVER recomputes price or currency
    // ========================================================================
    const addToCart = (cartPayload) => {
        // Validate required fields
        if (!cartPayload || typeof cartPayload !== 'object') {
            throw new Error('Invalid cart payload');
        }

        const {
            variantId,
            productId,
            name,
            price,
            currency,
            quantity,
            attributes,
            sku,
            image,
            stock
        } = cartPayload;

        // Validate required fields
        if (!variantId || !productId || !price || !currency || !quantity) {
            throw new Error('Missing required cart fields');
        }

        // Check stock
        if (stock && stock < quantity) {
            throw new Error('Insufficient stock');
        }

        setCart(prevCart => {
            const existingItemIndex = prevCart.items.findIndex(
                item => item.productId === productId && item.variantId === variantId
            );

            let newItems;
            if (existingItemIndex > -1) {
                // Update quantity for existing item
                newItems = [...prevCart.items];
                const newQuantity = newItems[existingItemIndex].quantity + quantity;

                if (stock && newQuantity > stock) {
                    throw new Error('Insufficient stock');
                }

                // ✅ Update quantity only, keep original price snapshot
                newItems[existingItemIndex].quantity = newQuantity;
            } else {
                // Add new item - store EXACT payload as snapshot
                newItems = [
                    ...prevCart.items,
                    {
                        variantId,
                        productId,
                        name,
                        price,        // ✅ Price snapshot - NEVER recomputed
                        currency,     // ✅ Currency snapshot - NEVER recomputed
                        quantity,
                        attributes,   // ✅ Exact attributes from variant
                        sku,
                        image,
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
                    if (item.stock && quantity > item.stock) {
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
