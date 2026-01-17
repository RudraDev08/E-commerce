import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PencilSquareIcon, 
  TrashIcon, 
  ChevronRightIcon,
  CircleStackIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon
} from "@heroicons/react/24/outline";
import { deleteCategory, updateCategory } from "../../Api/Category/CategoryApi";

const CategoryRow = ({ cat, level = 0, refresh }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = cat.children && cat.children.length > 0;

  const handleToggleStatus = async () => {
    const newStatus = cat.status === "active" ? "inactive" : "active";
    try {
      await updateCategory(cat._id, { status: newStatus });
      refresh();
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${cat.name}?`)) {
      await deleteCategory(cat._id);
      refresh();
    }
  };

  return (
    <>
      <tr className="hover:bg-slate-50/80 transition-colors group">
        <td className="px-4 py-4">
          <div className="flex items-center gap-3" style={{ paddingLeft: `${level * 24}px` }}>
            {hasChildren ? (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
              >
                <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                  <ChevronRightIcon className="h-3.5 w-3.5 text-slate-600" />
                </motion.div>
              </button>
            ) : (
              <div className="w-5" /> 
            )}
            
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
              {cat.image ? (
                <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
              ) : (
                <PhotoIcon className="h-5 w-5 text-slate-400" />
              )}
            </div>
            
            <div>
              <div className="font-bold text-slate-900 leading-tight">{cat.name}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-tighter">
                {cat.slug}
              </div>
            </div>
          </div>
        </td>

        <td className="px-4 py-4 text-slate-500 max-w-xs truncate italic text-xs">
          {cat.description || "No description provided"}
        </td>

        <td className="px-4 py-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
            <CircleStackIcon className="h-3 w-3" />
            {cat.productCount || 0}
          </div>
        </td>

        <td className="px-4 py-4 text-center">
          <button 
            onClick={handleToggleStatus}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
              cat.status === 'active' 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                : 'bg-rose-50 text-rose-600 border border-rose-100'
            }`}
          >
            {cat.status === 'active' ? <CheckCircleIcon className="h-3 w-3" /> : <XCircleIcon className="h-3 w-3" />}
            {cat.status}
          </button>
        </td>

        <td className="px-4 py-4 text-right">
          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all shadow-sm">
              <PencilSquareIcon className="h-4 w-4" />
            </button>
            <button 
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shadow-sm"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Recursive Children Rows */}
      {isExpanded && hasChildren && cat.children.map(child => (
        <CategoryRow key={child._id} cat={child} level={level + 1} refresh={refresh} />
      ))}
    </>
  );
};

export default function CategoryTable({ categories, loading, refresh }) {
  if (loading) {
    return (
      <div className="w-full bg-white rounded-xl border border-slate-200 p-20 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold animate-pulse italic">Synchronizing Catalogue...</p>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
        <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <CircleStackIcon className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Catalogue is Empty</h3>
        <p className="text-slate-500 text-sm mt-1">Start by adding your first primary category.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 font-black text-[10px] uppercase tracking-[0.15em] border-b border-slate-100">
              <th className="px-6 py-4 text-left">Hierarchy & Identity</th>
              <th className="px-4 py-4 text-left">Description</th>
              <th className="px-4 py-4 text-center">Volume</th>
              <th className="px-4 py-4 text-center">Visibility</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {categories.map(cat => (
              <CategoryRow key={cat._id} cat={cat} refresh={refresh} />
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Showing Root Categories: {categories.length}</span>
        <span className="text-indigo-600">Secure Enterprise Module</span>
      </div>
    </div>
  );
}