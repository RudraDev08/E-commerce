import { useEffect, useState } from "react";
import { createCategory, getCategoryTree } from "../../Api/Category/CategoryApi";
import { Plus, Layers, ChevronDown } from "lucide-react";

const CategoryForm = ({ onSuccess }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("MAIN");
  const [parentId, setParentId] = useState("");
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD PARENT CATEGORIES ================= */
  useEffect(() => {
    if (type === "SUB") {
      getCategoryTree()
        .then((res) => {
          setParents(res.data || []); // ✅ FIXED
        })
        .catch((err) => console.error(err));
    }
  }, [type]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === "SUB" && !parentId) {
        alert("Please select a parent category");
        return;
      }

      await createCategory({
        name,
        type,
        parentId: type === "SUB" ? parentId : undefined
      });

      setName("");
      setType("MAIN");
      setParentId("");
      onSuccess();
    } catch (error) {
      console.error(
        "Creation failed",
        error.response?.data || error
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/40 outline-none transition-all placeholder:text-slate-400";

  const labelStyle =
    "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Layers size={16} className="text-indigo-500" />
          Add New Category
        </h4>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* CATEGORY NAME */}
        <div>
          <label className={labelStyle}>Category Name</label>
          <input
            type="text"
            placeholder="e.g. Electronics"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputStyle}
            required
          />
        </div>

        {/* TYPE + PARENT */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>Hierarchy Type</label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`${inputStyle} appearance-none`}
              >
                <option value="MAIN">MAIN</option>
                <option value="SUB">SUB</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {type === "SUB" && (
            <div>
              <label className={labelStyle}>Parent Category</label>
              <div className="relative">
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className={`${inputStyle} appearance-none`}
                  required
                >
                  <option value="">Select Parent</option>
                  {parents.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus size={14} />
                Create Category
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;
