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
import CategoryPage from "./page/Category/CategoryPage";
import BrandList from "./components/Brands/BrandList";
import AddBrand from "./components/Brands/AddBrand";
import EditBrand from "./components/Brands/EditBrand";
import Product from "./components/Product/Products";
import InventoryMaster from "./page/inventory/InventoryMaster";
import VariantTable from "./page/VariantBuilder"

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
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

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          {/* HEADER */}
          <AdminHeader
            sidebarOpen={sidebarOpen}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* CONTENT */}
          <main className="">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/country" element={<CountryPage />} />
                <Route path="/state" element={<StatePage />} />
                <Route path="/city" element={<CityPage />} />
                <Route path="/pincode" element={<PincodeTable />} />
                <Route path="/categories" element={<CategoryPage />} />
                <Route path="/categories/:id" element={<CategoryPage />} />

                {/* BRAND ROUTES */}

                <Route path="/brands" element={<BrandList />} />
                <Route path="/brands/add" element={<AddBrand />} />
                <Route path="/brands/edit/:id" element={<EditBrand />} />

                {/* PRODUCT ROUTES */}

                <Route path="/products" element={<Product />} />

                <Route path="/variants" element={<VariantTable />} />

                {/* inventory */}
                <Route path="/inventory" element={<InventoryMaster />} />
              </Routes>
            </div>
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
