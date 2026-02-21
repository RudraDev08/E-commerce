import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout
import AdminLayout from "../layout/AdminLayout";

// Dashboard
import Dashboard from "../modules/dashboard/Dashboard";

// Infrastructure Pages
import CountryPage from "../page/CountryPage";
import StatePage from "../page/StatePage";
import CityPage from "../page/CityPage";
import PincodeTable from "../components/tables/PincodeTable";

// Catalogue
import CategoryManagement from "../modules/categories/CategoryManagement";
import BrandList from "../modules/brands/BrandList";

// Products & Attributes
import Product from "../modules/products/Products";
import VariantTable from "../page/VariantBuilder";
import SizeManagement from "../page/size/SizeManagement";
import ColorManagement from "../page/color/ColorManagement";
import ProductVariantMapping from "../modules/variants/ProductVariantMapping";
import VariantBuilder from "../modules/variants/VariantBuilder";
import AttributeList from "../modules/attributes/AttributeList";
import AttributeForm from "../modules/attributes/AttributeForm";
import AttributeValues from "../modules/attributes/AttributeValues";

// Inventory
import InventoryMaster from "../modules/inventory/InventoryMaster";
import WarehouseManagement from "../modules/inventory/WarehouseManagement";
import StockTransferManagement from "../modules/inventory/StockTransferManagement";
import CycleCountManagement from "../modules/inventory/CycleCountManagement";

// Other
import CategorySelectorDemo from "../page/CategorySelectorDemo";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Admin Wrapper */}
        <Route path="/" element={<AdminLayout />}>

          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Infrastructure */}
          <Route path="country" element={<CountryPage />} />
          <Route path="state" element={<StatePage />} />
          <Route path="city" element={<CityPage />} />
          <Route path="pincode" element={<PincodeTable />} />

          {/* Catalogue */}
          <Route path="categories">
            <Route index element={<CategoryManagement />} />
            <Route path=":id" element={<CategoryManagement />} />
          </Route>

          <Route path="brands" element={<BrandList />} />

          {/* Products */}
          <Route path="products" element={<Product />} />
          <Route path="size-management" element={<SizeManagement />} />
          <Route path="color-management" element={<ColorManagement />} />

          {/* Attributes - Nested Example */}
          <Route path="attributes">
            <Route index element={<AttributeList />} />
            <Route path="create" element={<AttributeForm />} />
            <Route path=":id/edit" element={<AttributeForm />} />
            <Route path=":id/values" element={<AttributeValues />} />
          </Route>

          <Route path="variant-mapping" element={<ProductVariantMapping />} />
          <Route path="variant-builder/:productId" element={<VariantBuilder />} />
          <Route path="variants" element={<VariantTable />} />

          {/* Inventory */}
          <Route path="inventory">
            <Route index element={<InventoryMaster />} />
            <Route path="warehouses" element={<WarehouseManagement />} />
            <Route path="transfers" element={<StockTransferManagement />} />
            <Route path="audits" element={<CycleCountManagement />} />
          </Route>

          {/* Demos */}
          <Route path="category-selector-demo" element={<CategorySelectorDemo />} />

        </Route>

        {/* Catch all - Redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Toaster — Premium Dark Theme */}
      <Toaster
        position="top-right"
        gutter={10}
        containerStyle={{ top: 24, right: 24 }}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0F172A',
            color: '#F1F5F9',
            borderRadius: '14px',
            fontSize: '13.5px',
            fontWeight: '500',
            padding: '14px 18px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            maxWidth: '380px',
            lineHeight: '1.5',
            borderLeft: '3px solid transparent',
          },
          success: {
            duration: 3000,
            style: {
              borderLeft: '3px solid #10B981',
            },
            iconTheme: {
              primary: '#10B981',
              secondary: '#0F172A',
            },
          },
          error: {
            duration: 5000,
            style: {
              borderLeft: '3px solid #F87171',
            },
            iconTheme: {
              primary: '#F87171',
              secondary: '#0F172A',
            },
          },
          loading: {
            style: {
              borderLeft: '3px solid #818CF8',
            },
            iconTheme: {
              primary: '#818CF8',
              secondary: '#0F172A',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
