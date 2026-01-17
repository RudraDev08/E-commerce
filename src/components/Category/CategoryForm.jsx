import { useState, useEffect, useMemo } from "react";
import { createCategory, updateCategory } from "../../Api/Category/CategoryApi";
import { TagIcon, LinkIcon, Bars3BottomLeftIcon } from "@heroicons/react/24/outline";

export default function CategoryForm({ initialData, categories, onClose, refresh }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
    status: "active",
    displayOrder: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        parentId: initialData.parentId || "",
        status: initialData.status || "active",
        displayOrder: initialData.displayOrder || 0,
      });
    }
  }, [initialData]);

  // Helper to flatten tree for the dropdown with indentation
  const flattenedOptions = useMemo(() => {
    const options = [];
    const recurse = (list, depth = 0) => {
      list.forEach((cat) => {
        // Prevent setting itself as its own parent during edit
        if (initialData && cat._id === initialData._id) return;
        
        options.push({
          id: cat._id,
          name: `${"  ".repeat(depth)}${depth > 0 ? "↳ " : ""}${cat.name}`,
        });
        if (cat.children) recurse(cat.children, depth + 1);
      });
    };
    recurse(categories);
    return options;
  }, [categories, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { 
        ...formData, 
        parentId: formData.parentId === "" ? null : formData.parentId 
      };

      if (initialData) {
        await updateCategory(initialData._id, payload);
      } else {
        await createCategory(payload);
      }
      refresh();
      onClose();
    } catch (err) {
      alert("Error saving category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category Name</label>
          <div className="relative mt-1">
            <TagIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
            <input
              required
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
              placeholder="e.g. Smartwatches"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        <div className="col-span-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Parent Category</label>
          <div className="relative mt-1">
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer font-medium"
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            >
              <option value="">Root / No Parent</option>
              {flattenedOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-span-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Internal Description</label>
          <div className="relative mt-1">
            <Bars3BottomLeftIcon className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
            <textarea
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none h-24 resize-none font-medium"
              placeholder="Describe the purpose of this node..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
          <select
            className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-indigo-600"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="inactive">Disabled</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Display Priority</label>
          <input
            type="number"
            className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-[2] py-4 rounded-2xl font-bold text-white bg-slate-900 hover:bg-indigo-600 shadow-xl shadow-slate-200 disabled:opacity-50 transition-all"
        >
          {loading ? "Processing..." : initialData ? "Update Category" : "Build Category"}
        </button>
      </div>
    </form>
  );
}