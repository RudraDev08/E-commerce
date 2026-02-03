import Wishlist from '../../models/Wishlist/WishlistSchema.js';

// Get user's wishlist
export const getWishlist = async (req, res) => {
    try {
        const userId = req.user?._id || "65c3f9b0e4b0a1b2c3d4e5f6"; // Mock ID until auth middleware is global
        let wishlist = await Wishlist.findOne({ user: userId }).populate('products.productId');

        if (!wishlist) {
            wishlist = await Wishlist.create({ user: userId, products: [] });
        }

        res.status(200).json({ success: true, data: wishlist });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle wishlist item (Add/Remove)
export const toggleWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user?._id || "65c3f9b0e4b0a1b2c3d4e5f6";

        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            wishlist = await Wishlist.create({ user: userId, products: [] });
        }

        const index = wishlist.products.findIndex(p => p.productId.toString() === productId);

        if (index > -1) {
            // Remove
            wishlist.products.splice(index, 1);
        } else {
            // Add
            wishlist.products.push({ productId });
        }

        await wishlist.save();
        // Return populated for frontend update
        const updatedWishlist = await Wishlist.findById(wishlist._id).populate('products.productId');

        res.status(200).json({ success: true, data: updatedWishlist, message: index > -1 ? "Removed from wishlist" : "Added to wishlist" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
