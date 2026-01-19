import { Routes, Route } from "react-router-dom";
import BrandList from "../components/Brands/BrandList";
import AddBrand from "../components/Brands/AddBrand";
import EditBrand from "../components/Brands/EditBrand";

const AdminRoutes = () => (
  <Routes>
    <Route path="/brands" element={<BrandList />} />
    <Route path="/brands/add" element={<AddBrand />} />
    <Route path="/brands/edit/:id" element={<EditBrand />} />
  </Routes>
);

export default AdminRoutes;
