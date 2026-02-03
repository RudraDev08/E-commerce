import api from './axios.config';

export const getWishlist = async () => {
    return await api.get('/wishlist');
};

export const toggleWishlist = async (productId) => {
    return await api.post('/wishlist/toggle', { productId });
};
