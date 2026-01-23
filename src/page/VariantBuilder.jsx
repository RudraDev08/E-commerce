import { useEffect, useState } from "react";
import {
  getProducts,
  getProductType,
  createVariants,
} from "../Api/catalogApi";

import AttributeInputs from "../components/catalog/AttributeInputs";
import VariantTable from "../components/catalog/VariantTable";

export default function VariantBuilder() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH PRODUCTS ---------------- */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await getProducts();

        const list =
          Array.isArray(res.data) ? res.data :
            Array.isArray(res.data?.data) ? res.data.data :
              Array.isArray(res.data?.data?.data) ? res.data.data.data :
                [];

        setProducts(list);
      } catch (err) {
        console.error("Failed to fetch products", err);
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);


  /* ---------------- PRODUCT SELECT ---------------- */
  const selectProduct = async (id) => {
  if (!id) return;

  const product = products.find((p) => p._id === id);
  if (!product) return;

  if (!product.productType) {
    return;
  }

  setSelectedProduct(product);
  setAttributes([]);
  setVariants([]);

  try {
    setLoading(true);

    const res = await getProductType(product.productType);

    const attrs =
      Array.isArray(res.data?.attributes)
        ? res.data.attributes
        : Array.isArray(res.data?.data?.attributes)
        ? res.data.data.attributes
        : [];

    setAttributes(attrs);
  } catch (err) {
    console.error("Failed to load product type", err);
  } finally {
    setLoading(false);
  }
};


  /* ---------------- SAVE VARIANTS ---------------- */
  const saveVariants = async () => {
    if (!selectedProduct || variants.length === 0) return;

    try {
      await createVariants({
        productId: selectedProduct._id,
        variants,
      });
      alert("Variants created successfully ✅");
      setVariants([]);
    } catch (err) {
      console.error("Failed to save variants", err);
      alert("Failed to create variants");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">
        Variant Builder
      </h1>

      {/* PRODUCT SELECT */}
      <select
        onChange={(e) => selectProduct(e.target.value)}
        className="border p-2 rounded w-full mb-4"
        value={selectedProduct?._id || ""}
      >
        <option value="">Select Product</option>
        {Array.isArray(products) &&
          products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
      </select>

      {/* ATTRIBUTES */}
      {loading && (
        <p className="text-sm text-gray-500">Loading attributes…</p>
      )}

      {attributes.length > 0 && (
        <AttributeInputs
          attributes={attributes}
          onGenerate={setVariants}
        />
      )}

      {/* VARIANTS TABLE */}
      {variants.length > 0 && (
        <>
          <VariantTable
            variants={variants}
            onChange={setVariants}
          />

          <button
            onClick={saveVariants}
            className="mt-4 bg-black text-white px-4 py-2 rounded"
          >
            Save Variants
          </button>
        </>
      )}
    </div>
  );
}
