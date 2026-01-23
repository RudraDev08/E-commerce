import { useEffect, useState } from "react";
import { getProducts } from "../api/catalogApi";
import VariantForm from "../components/catalog/VariantForm";
import VariantTable from "../components/catalog/VariantTable";

const VariantPage = () => {
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    getProducts().then(res => setProducts(res.data.data || res.data));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <h1 className="text-xl font-semibold">Variant Management</h1>

      <VariantForm
        products={products}
        onVariantCreated={(v) => setVariants([v, ...variants])}
      />

      <VariantTable variants={variants} />
    </div>
  );
};

export default VariantPage;
