import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PlusIcon, 
  XMarkIcon, 
  ArrowPathIcon, 
  TagIcon, 
  ChartPieIcon, 
  Squares2X2Icon 
} from "@heroicons/react/24/outline";

// ✅ CORRECTED IMPORTS: Only one import per component
import CategoryForm from "../../components/Category/CategoryForm";
import CategoryTable from "../../components/Category/CategoryTable";
import { getCategoryTree } from "../../Api/Category/CategoryApi";

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- LOAD DATA ---------------- */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCategoryTree();
      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to load category tree", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---------------- ANALYTICS ---------------- */
  const stats = useMemo(() => {
    let total = 0;
    const count = (arr) => arr.forEach(c => { 
      total++; 
      if(c.children) count(c.children); 
    });
    count(categories);
    return { 
      total, 
      active: categories.filter(c => c.status === 'active').length 
    };
  }, [categories]);

  /* ---------------- HANDLERS ---------------- */
  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-8">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Squares2X2Icon className="h-7 w-7 text-indigo-600" />
            Category Architecture
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Global product hierarchy & taxonomy management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={loadData} 
            className="p-2.5 text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl transition-all"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <PlusIcon className="h-5 w-5 stroke-[3px]" /> New Category
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard 
          label="Global Nodes" 
          value={stats.total} 
          icon={TagIcon} 
          color="indigo" 
        />
        <StatsCard 
          label="Active Root Nodes" 
          value={stats.active} 
          icon={ChartPieIcon} 
          color="emerald" 
        />
        <div className="bg-indigo-600 rounded-2xl p-5 text-white flex flex-col justify-center shadow-lg shadow-indigo-100">
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider">System Status</p>
          <p className="text-lg font-bold">Catalogue Synchronized</p>
        </div>
      </div>

      {/* 3. TABLE SECTION */}
      <CategoryTable 
        categories={categories} 
        onEdit={handleEdit} 
        refresh={loadData} 
      />

      {/* 4. CENTERED MODAL */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={closeForm}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl z-[110] overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-black text-slate-900">
                    {editingCategory ? "Update Category Node" : "Build New Node"}
                  </h2>
                  <button 
                    onClick={closeForm} 
                    className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"
                  >
                    <XMarkIcon className="h-5 w-5 text-slate-500" />
                  </button>
                </div>

                <CategoryForm 
                  initialData={editingCategory} 
                  categories={categories} 
                  onClose={closeForm} 
                  refresh={loadData} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Atomic Stats Card Component */
const StatsCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
    <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-900 leading-none mt-1">{value}</p>
    </div>
  </div>
);