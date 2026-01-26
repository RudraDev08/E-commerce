import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import ProfessionalAside from "./components/aside/SimpleAside";
import AdminHeader from "./components/header/Header";
import Dashboard from "./page/Dashboard";
import CountryPage from "./page/CountryPage";
import StatePage from "./page/StatePage";
import CityPage from "./page/CityPage";
import PincodeTable from "./components/tables/PincodeTable";
import BrandList from "./components/Brands/BrandList";
import AddBrand from "./components/Brands/AddBrand";
import EditBrand from "./components/Brands/EditBrand";
import Product from "./components/Product/Products";
import InventoryMaster from "./page/inventory/InventoryMaster";
import VariantTable from "./page/VariantBuilder"
import CategorySelectorDemo from "./page/CategorySelectorDemo";
import CategoryManagement from "./page/category/CategoryManagement";
import SizeManagement from "./page/size/SizeManagement";
import ColorManagement from "./page/color/ColorManagement";
import VariantManagement from "./page/variant/VariantManagement";
import ProductVariantMapping from "./page/variant/ProductVariantMapping";
import VariantBuilder from "./page/variant/VariantBuilder";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  // BUG FIX: Safety check for window object (SSR/build compatibility)
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // RESPONSIVE UI ENHANCEMENT: Handle window resize to auto-collapse on mobile
  useEffect(() => {
    // BUG FIX: Safety check for window object
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#F8FAFC]">
        {/* SIDEBAR */}
        <ProfessionalAside
          isExpanded={sidebarOpen}
          setIsExpanded={setSidebarOpen}
        />

        {/* MAIN AREA - UI LAYOUT FIX: Removed unnecessary margins */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          {/* HEADER */}
          <AdminHeader
            sidebarOpen={sidebarOpen}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* CONTENT - UI LAYOUT FIX: Removed max-w-7xl mx-auto to eliminate gap */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/country" element={<CountryPage />} />
              <Route path="/state" element={<StatePage />} />
              <Route path="/city" element={<CityPage />} />
              <Route path="/pincode" element={<PincodeTable />} />
              <Route path="/categories" element={<CategoryManagement />} />
              <Route path="/categories/:id" element={<CategoryManagement />} />

              {/* BRAND ROUTES */}

              <Route path="/brands" element={<BrandList />} />
              <Route path="/brands/add" element={<AddBrand />} />
              <Route path="/brands/edit/:id" element={<EditBrand />} />

              {/* PRODUCT ROUTES */}

              <Route path="/products" element={<Product />} />

              <Route path="/variants" element={<VariantTable />} />

              {/* inventory */}
              <Route path="/inventory" element={<InventoryMaster />} />

              {/* CATEGORY SELECTOR DEMO */}
              <Route path="/category-selector-demo" element={<CategorySelectorDemo />} />

              {/* SIZE & COLOR MANAGEMENT */}
              <Route path="/size-management" element={<SizeManagement />} />
              <Route path="/color-management" element={<ColorManagement />} />
              <Route path="/variant-management" element={<VariantManagement />} />

              {/* VARIANT MAPPING */}
              <Route path="/variant-mapping" element={<ProductVariantMapping />} />
              <Route path="/variant-builder/:productId" element={<VariantBuilder />} />
            </Routes>
          </main>
        </div>
      </div>

      {/* TOAST NOTIFICATIONS */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#4ade80",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
