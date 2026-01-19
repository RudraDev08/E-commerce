import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Globe,
  MapPin,
  Building,
  Hash,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Folder,
  Navigation,
  LayoutGrid,
  Layers,
  Package,
  Map,
  Tag
} from "lucide-react";
import categoryApi from "../../Api/Category/categoryApi";

const ProfessionalAside = ({ isExpanded, setIsExpanded }) => {
  const [categoryTree, setCategoryTree] = useState([]);
  const [openCategoryIds, setOpenCategoryIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  /* ---------------- API DATA FETCHING ---------------- */
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoryApi.getTree();
      setCategoryTree(response.data.data || []);
    } catch (err) {
      console.error("Failed to load category tree", err);
      setCategoryTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();

    // Listen for category updates
    const handleUpdate = (e) => {
      if (e.key === "CATEGORY_UPDATED") {
        fetchCategories();
      }
    };

    window.addEventListener("storage", handleUpdate);
    return () => window.removeEventListener("storage", handleUpdate);
  }, [fetchCategories]);

  /* ---------------- UTILS ---------------- */
  const toggleCategory = (id) => {
    setOpenCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleCategoryClick = (cat, hasChildren) => {
    if (hasChildren) {
      toggleCategory(cat._id);
    } else {
      // Navigate to category detail page or filter products by category
      navigate(`/categories/${cat._id}`);
    }
  };

  /* ---------------- RECURSIVE CATEGORY RENDER ---------------- */
  const renderCategories = (categories, level = 0) => {
    if (!categories || categories.length === 0) return null;

    return categories.map((cat) => {
      const isOpen = openCategoryIds.includes(cat._id);
      const hasChildren = cat.children?.length > 0;
      const isActive = location.pathname.includes(`/categories/${cat._id}`);

      return (
        <div key={cat._id} className="w-full">
          <button
            onClick={() => handleCategoryClick(cat, hasChildren)}
            className={`w-full flex items-center justify-between group px-2.5 py-2 rounded-lg transition-all ${
              isActive
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <div
                className={`p-1 rounded-md ${
                  isActive
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <Folder size={12} />
              </div>
              {isExpanded && (
                <span className="text-[12px] font-medium truncate">
                  {cat.name}
                </span>
              )}
            </div>
            {isExpanded && hasChildren && (
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={12} className="opacity-40" />
              </motion.div>
            )}
          </button>

          <AnimatePresence>
            {isExpanded && isOpen && hasChildren && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-4 pl-2 border-l border-slate-200 mt-1 space-y-1 overflow-hidden"
              >
                {renderCategories(cat.children, level + 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  return (
    <motion.aside
      animate={{ width: isExpanded ? 260 : 80 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-white border-r border-slate-200 flex flex-col sticky top-0 z-50 shadow-sm"
    >
      {/* BRAND SECTION */}
      <div className="h-20 flex items-center px-5 gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
          <Navigation size={20} />
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <h1 className="text-sm font-bold text-slate-900">Nexus ERP</h1>
              <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                v2.0 Admin
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SCROLLABLE NAV CONTENT */}
      <div className="flex-1 overflow-y-auto px-3 space-y-6 pb-10 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {/* GROUP 1: CORE */}
        <section>
          <SectionHeader label="Core" isExpanded={isExpanded} />
          <MenuItem
            item={{ name: "Dashboard", icon: LayoutGrid }}
            isActive={location.pathname === "/"}
            isExpanded={isExpanded}
            onClick={() => navigate("/")}
          />
        </section>

        {/* GROUP 2: GEOGRAPHIC */}
        <section>
          <SectionHeader label="Infrastructure" isExpanded={isExpanded} />
          <div className="space-y-1">
            <MenuItem
              item={{ name: "Country", icon: Globe }}
              isActive={location.pathname === "/country"}
              isExpanded={isExpanded}
              onClick={() => navigate("/country")}
            />
            <MenuItem
              item={{ name: "State", icon: MapPin }}
              isActive={location.pathname === "/state"}
              isExpanded={isExpanded}
              onClick={() => navigate("/state")}
            />
            <MenuItem
              item={{ name: "City", icon: Building }}
              isActive={location.pathname === "/city"}
              isExpanded={isExpanded}
              onClick={() => navigate("/city")}
            />
            <MenuItem
              item={{ name: "Pincode", icon: Hash }}
              isActive={location.pathname === "/pincode"}
              isExpanded={isExpanded}
              onClick={() => navigate("/pincode")}
            />
          </div>
        </section> 

        {/* GROUP 4: Brands  */}

        <section>
          <SectionHeader label="Catalogue" isExpanded={isExpanded} />

          <MenuItem
            item={{ name: "Categories Hub", icon: Layers }}
            isActive={location.pathname === "/categories"}
            isExpanded={isExpanded}
            onClick={() => navigate("/categories")}
          />

          <MenuItem
            item={{ name: "Brands", icon: Tag }}
            isActive={location.pathname.startsWith("/brands")}
            isExpanded={isExpanded}
            onClick={() => navigate("/brands")}
          />

          {/* CATEGORY TREE */}
          {isExpanded && (
            <div className="mt-2 space-y-1 border-t border-slate-50 pt-2">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                </div>
              ) : categoryTree.length > 0 ? (
                renderCategories(categoryTree)
              ) : (
                <p className="text-[11px] text-slate-400 text-center py-3">
                  No categories
                </p>
              )}
            </div>
          )}
        </section>

        {/* GROUP 4: PRODUCTS (Optional) */}
        <section>
          <SectionHeader label="Products" isExpanded={isExpanded} />
          <div className="space-y-1">
            <MenuItem
              item={{ name: "All Products", icon: Package }}
              isActive={location.pathname === "/products"}
              isExpanded={isExpanded}
              onClick={() => navigate("/products")}
            />
            <MenuItem
              item={{ name: "Inventory", icon: Map }}
              isActive={location.pathname === "/inventory"}
              isExpanded={isExpanded}
              onClick={() => navigate("/inventory")}
            />
          </div>
        </section>
      </div>

      {/* BOTTOM TOGGLE */}
      <div className="p-4 bg-slate-50/50 border-t">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 transition-all shadow-md"
        >
          {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </motion.aside>
  );
};

/* ---------------- ATOMIC COMPONENTS ---------------- */

const MenuItem = ({ item, isExpanded, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
      isActive
        ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`}
  >
    <item.icon
      size={18}
      className={
        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
      }
    />
    {isExpanded && (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="text-xs font-semibold"
      >
        {item.name}
      </motion.span>
    )}
  </button>
);

const SectionHeader = ({ label, isExpanded }) =>
  isExpanded ? (
    <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-4 mb-2">
      {label}
    </p>
  ) : (
    <div className="h-px bg-slate-100 my-6 mx-2" />
  );

export default ProfessionalAside;
