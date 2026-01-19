import { useNavigate } from "react-router-dom";
import { createBrand } from "../../Api/Brands/brandApi";
import BrandForm from "../../components/Brands/BrandForm";
import { useState } from "react";
import toast from "react-hot-toast";

const AddBrand = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (data) => {
    setIsSubmitting(true);
    try {
      // 1. Create FormData to handle the image file upload
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("status", data.status);
      formData.append("isFeatured", data.isFeatured);
      
      if (data.image) {
        formData.append("image", data.image);
      }

      // 2. API Call
      await createBrand(formData);
      toast.success("Brand created successfully!");
      navigate("/brands");
    } catch (error) {
      toast.error(error.message || "Failed to create brand");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans antialiased">
      <nav className="max-w-4xl mx-auto mb-6">
        <ol className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <li className="hover:text-emerald-600 cursor-pointer" onClick={() => navigate("/dashboard")}>Dashboard</li>
          <li>/</li>
          <li className="hover:text-emerald-600 cursor-pointer" onClick={() => navigate("/brands")}>Brands</li>
          <li>/</li>
          <li className="text-slate-900">Add Brand</li>
        </ol>
      </nav>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/brands")}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-100 shadow-sm transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Brand</h1>
            <p className="text-sm text-slate-500">Define brand identity and global visibility settings.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8">
            <BrandForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
          </div>

          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/brands")}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              form="brand-form"
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-200 disabled:opacity-70 flex items-center gap-2 transition-all active:scale-95"
            >
              {isSubmitting ? "Processing..." : "Save Brand Identity"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBrand;