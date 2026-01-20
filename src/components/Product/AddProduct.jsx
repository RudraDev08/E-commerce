import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

const AddProductModal = ({ isOpen, onClose, onProductAdded, initialData }) => {
  const [formData, setFormData] = useState({
    name: "", category: "", brand: "", price: "", stock: "", image: "", status: "active"
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  // ✅ SYNC: Load data when editingProduct changes
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(initialData);
      setImagePreview(initialData.image || "");
    } else {
      setFormData({ name: "", category: "", brand: "", price: "", stock: "", image: "", status: "active" });
      setImagePreview("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isEdit = !!initialData?._id;
    const url = isEdit 
      ? `http://localhost:5000/api/products/${initialData._id}` 
      : "http://localhost:5000/api/products";

    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock)
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(isEdit ? "Identity Updated" : "Asset Registered");
        onProductAdded();
        onClose();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      toast.error("Vault connection lost");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-10 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black uppercase tracking-tighter">{initialData ? 'Edit Asset' : 'Register Asset'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="w-full h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center overflow-hidden mb-6">
             {imagePreview ? <img src={imagePreview} className="h-full object-contain" /> : <span className="text-[10px] font-black uppercase text-slate-300">Null Resource</span>}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Identity Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Price ($)</label>
              <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Stock</label>
              <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Image URL</label>
              <input type="text" value={formData.image} onChange={(e) => { setFormData({...formData, image: e.target.value}); setImagePreview(e.target.value); }} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-medium text-slate-500 italic outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50">
            {loading ? "Processing..." : initialData ? "Authorize Update" : "Authorize Entry"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;