import React, { useState } from "react";
import toast from "react-hot-toast";

const AddProductModal = ({ isOpen, onClose, onProductAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    price: "",
    stock: "",
    image: "",
    status: "active",
    // Added these to match your Brand/Category logic if needed
    isFeatured: false,
    showOnHomepage: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "image") setImagePreview(value);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Identity name required";
    if (!formData.category.trim())
      newErrors.category = "Classification required";
    if (!formData.brand.trim()) newErrors.brand = "Source brand required";
    if (!formData.price || parseFloat(formData.price) <= 0)
      newErrors.price = "Invalid valuation";
    if (!formData.stock || parseInt(formData.stock) < 0)
      newErrors.stock = "Invalid inventory count";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          // Ensure these are explicitly numbers
          price: Number(formData.price),
          stock: Number(formData.stock),
          // Ensure brand and category are trimmed
          brand: formData.brand.trim(),
          category: formData.category.trim()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Asset authorized and vaulted");
        // ✅ CALL THIS FIRST
        onProductAdded(); 
        // ✅ THEN CLOSE
        onClose();
        // ✅ RESET FORM
        handleClose(); 
      } else {
        throw new Error(data.message || "Vault rejected the entry");
      }
    } catch (error) {
      toast.error(error.message);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      category: "",
      brand: "",
      price: "",
      stock: "",
      image: "",
      status: "active",
      isFeatured: false,
      showOnHomepage: true,
    });
    setErrors({});
    setImagePreview("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300"
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_30px_100px_rgba(0,0,0,0.2)] border border-slate-100 transform transition-all duration-500 ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
              Register Asset
            </h2>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
              System Inventory v2.0
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {/* Visual Preview */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Asset Visualization
            </label>
            <div className="w-full h-48 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-contain p-6"
                  onError={(e) =>
                    (e.target.src =
                      "https://placehold.co/600x400?text=Invalid+Resource")
                  }
                />
              ) : (
                <div className="text-center opacity-20">
                  <svg
                    className="w-12 h-12 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Null Resource
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Identity Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                placeholder="Enter product name..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Classification
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all appearance-none"
              >
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Home & Kitchen">Home & Kitchen</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Source Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                placeholder="e.g. Samsung"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Unit Valuation ($)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Inventory Count
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                placeholder="0"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Resource URL
              </label>
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-medium text-slate-500 italic outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-200 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Processing..." : "Authorize Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
