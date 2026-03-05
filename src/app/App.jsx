import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Auth
import { AuthProvider } from "../context/AuthContext";
import RoleRoute from "../components/auth/RoleRoute";
import LoginPage from "../modules/auth/LoginPage";
import UnauthorizedPage from "../modules/auth/UnauthorizedPage";

// Layout
import AdminLayout from "../layout/AdminLayout";

// Dashboard
import Dashboard from "../modules/dashboard/Dashboard";
import { DashboardLayout as ExecutiveDashboard } from "../components/dashboard/DashboardLayout";

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

// Orders
import OrderListPage from "../modules/orders/OrderListPage";
import OrderDetailPage from "../modules/orders/OrderDetailPage";

// System
import SystemDashboard from "../modules/system/SystemDashboard";

// Other
import CategorySelectorDemo from "../page/CategorySelectorDemo";

// ── Toast config ─────────────────────────────────────────────────────────────
const toastConfig = {
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
    style: { borderLeft: '3px solid #10B981' },
    iconTheme: { primary: '#10B981', secondary: '#0F172A' },
  },
  error: {
    duration: 5000,
    style: { borderLeft: '3px solid #F87171' },
    iconTheme: { primary: '#F87171', secondary: '#0F172A' },
  },
  loading: {
    style: { borderLeft: '3px solid #818CF8' },
    iconTheme: { primary: '#818CF8', secondary: '#0F172A' },
  },
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Public Routes ─────────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* ── Protected Admin Panel ────────────────────────────────── */}
          {/*
            All routes under "/" require at minimum the 'staff' role.
            Use nested <RoleRoute roles={['admin','super_admin']}> for
            sensitive sub-pages (e.g. system config, user management).
          */}
          <Route
            path="/"
            element={
              <RoleRoute roles={['staff', 'manager', 'admin', 'super_admin']}>
                <AdminLayout />
              </RoleRoute>
            }
          >
            {/* Dashboard — all staff and above */}
            <Route index element={<Dashboard />} />
            <Route path="executive-dashboard" element={<ExecutiveDashboard />} />

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

            {/* Attributes */}
            <Route path="attributes">
              <Route index element={<AttributeList />} />
              <Route path="create" element={<AttributeForm />} />
              <Route path=":id/edit" element={<AttributeForm />} />
              <Route path=":id/values" element={<AttributeValues />} />
            </Route>

            <Route path="variant-mapping" element={<ProductVariantMapping />} />
            <Route path="variant-builder/:productId" element={<VariantBuilder />} />

            {/* Inventory */}
            <Route path="inventory">
              <Route index element={<InventoryMaster />} />
              <Route path="warehouses" element={<WarehouseManagement />} />
              <Route path="transfers" element={<StockTransferManagement />} />
              <Route path="audits" element={<CycleCountManagement />} />
            </Route>

            {/* Orders */}
            <Route path="orders" element={<OrderListPage />} />
            <Route path="orders/:orderId" element={<OrderDetailPage />} />

            {/* System — admin/super_admin only */}
            <Route
              path="system"
              element={
                <RoleRoute roles={['admin', 'super_admin']}>
                  <SystemDashboard />
                </RoleRoute>
              }
            />

            {/* Demos */}
            <Route path="category-selector-demo" element={<CategorySelectorDemo />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster position="top-right" gutter={10}
          containerStyle={{ top: 24, right: 24 }}
          toastOptions={toastConfig}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
