import React, { createContext, useState, useEffect, useContext } from 'react';
import { getWishlist, toggleWishlist as apiToggleWishlist } from '../api/wishlistApi';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);

    useEffect(() => {
        loadWishlist();
    }, []);

    const loadWishlist = async () => {
        try {
            const response = await getWishlist();
            if (response.data.success) {
                const products = response.data.data.products
                    .filter(p => p.productId) // Filter out null/deleted products
                    .map(p => p.productId._id);
                setWishlist(products);
            }
        } catch (error) {
            console.error("Error loading wishlist:", error);
        }
    };

    const addToWishlist = async (product) => {
        // Optimistic update
        setWishlist(prev => [...prev, product._id]);
        try {
            await apiToggleWishlist(product._id);
        } catch (error) {
            // Revert on failure
            setWishlist(prev => prev.filter(id => id !== product._id));
            console.error("Error adding to wishlist:", error);
        }
    };

    const removeFromWishlist = async (productId) => {
        // Optimistic update
        setWishlist(prev => prev.filter(id => id !== productId));
        try {
            await apiToggleWishlist(productId);
        } catch (error) {
            // Revert (need product ID back? tricky without full object, but Toggle is generic)
            console.error("Error removing from wishlist:", error);
            loadWishlist(); // Reload to be safe
        }
    };

    const isInWishlist = (productId) => {
        return wishlist.includes(productId);
    };

    const toggle = async (product) => {
        if (isInWishlist(product._id)) {
            await removeFromWishlist(product._id);
        } else {
            await addToWishlist(product);
        }
    };

    return (
        <WishlistContext.Provider value={{ wishlist, toggle, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};
