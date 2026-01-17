import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { deleteCategory } from "../../Api/Category/CategoryApi";
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  HashtagIcon,
  ArchiveBoxIcon
} from "@heroicons/react/24/outline";

const TreeNode = ({ cat, level = 0, refresh, searchTerm = "" }) => {
  // Logic: Auto-expand if a search is active, otherwise default to closed (except root)
  const [isExpanded, setIsExpanded] = useState(level < 1);
  
  // Sync expansion with search: If searching, expand to show matches
  useEffect(() => {
    if (searchTerm) setIsExpanded(true);
  }, [searchTerm]);

  const isMatch = searchTerm && cat.name.toLowerCase().includes(searchTerm.toLowerCase());
  const hasChildren = cat.children && cat.children.length > 0;

  const highlightMatch = (text, term) => {
    if (!term) return text;
    const parts = text.split(new RegExp(`(${term})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={i} className="bg-indigo-500 text-white rounded-sm px-0.5 no-underline">
          {part}
        </mark>
      ) : part
    );
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${cat.name}"?`)) {
      try {
        await deleteCategory(cat._id);
        refresh();
      } catch (err) {
        console.error("Delete failed");
      }
    }
  };

  return (
    <div className="relative">
      <motion.div
        layout
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        className={`group flex items-center gap-3 py-2 px-3 rounded-xl transition-all cursor-pointer select-none ${
          isMatch 
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
            : "hover:bg-slate-50 text-slate-700"
        }`}
      >
        {/* Indent Guide for deep levels */}
        {level > 0 && (
          <div className="absolute left-[-14px] top-0 bottom-0 w-px bg-slate-200 group-hover:bg-indigo-300" />
        )}

        {/* Chevron/Toggle */}
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {hasChildren && (
            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
              <ChevronRightIcon className={`h-3.5 w-3.5 ${isMatch ? "text-indigo-100" : "text-slate-400"}`} />
            </motion.div>
          )}
        </div>

        {/* Icon */}
        <div className={`p-1.5 rounded-lg shrink-0 ${
          isMatch ? "bg-indigo-500" : "bg-white border border-slate-200 shadow-sm"
        }`}>
          {isExpanded && hasChildren ? (
            <FolderOpenIcon className={`h-4 w-4 ${isMatch ? "text-white" : "text-indigo-600"}`} />
          ) : (
            <FolderIcon className={`h-4 w-4 ${isMatch ? "text-white" : "text-slate-400"}`} />
          )}
        </div>

        {/* Label */}
        <div className="flex-1 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2 truncate">
            <span className={`text-sm font-bold truncate ${isMatch ? "text-white" : "text-slate-700"}`}>
              {highlightMatch(cat.name, searchTerm)}
            </span>
            {hasChildren && !isMatch && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-black uppercase">
                {cat.children.length}
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <button
            onClick={handleDelete}
            className={`p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all ${
              isMatch ? "hover:bg-indigo-700 text-indigo-100" : "hover:bg-red-50 text-slate-400 hover:text-red-600"
            }`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Nested Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-8 mt-1 space-y-1 relative"
          >
            {cat.children.map((child) => (
              <TreeNode key={child._id} cat={child} level={level + 1} refresh={refresh} searchTerm={searchTerm} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function CategoryTree({ categories, refresh }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    if (!searchTerm) return categories;
    const filter = (arr) =>
      arr.reduce((acc, cat) => {
        const isSelfMatch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
        const filteredChildren = cat.children ? filter(cat.children) : [];
        if (isSelfMatch || filteredChildren.length > 0) {
          acc.push({ ...cat, children: filteredChildren });
        }
        return acc;
      }, []);
    return filter(categories);
  }, [categories, searchTerm]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/60 flex flex-col h-full overflow-hidden">
      {/* Header with Search */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
              <ArchiveBoxIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Catalogue Tree</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Enterprise Taxonomy</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Live Nodes</p>
            <p className="text-lg font-black text-indigo-600">{(categories || []).length}</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search categories by name..."
            className="w-full bg-slate-100/50 border-none rounded-2xl py-3 pl-11 pr-10 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tree Body */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[400px]">
        {filteredData.length > 0 ? (
          <div className="space-y-1">
            {filteredData.map((cat) => (
              <TreeNode key={cat._id} cat={cat} refresh={refresh} searchTerm={searchTerm} />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-40 grayscale py-20">
            <ArchiveBoxIcon className="h-16 w-16 mb-4" />
            <p className="text-sm font-bold">No Categories Found</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
          <InformationCircleIcon className="h-4 w-4 text-indigo-400" />
          <span>Hierarchy depth unlimited</span>
        </div>
        {searchTerm && (
          <div className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md font-bold uppercase">
            Results Found: {filteredData.length}
          </div>
        )}
      </div>
    </div>
  );
}