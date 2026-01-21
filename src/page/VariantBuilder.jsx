import { useEffect, useState } from "react";
import { getProducts, getProductType, createVariants } from "../Api/catalogApi";
import AttributeInputs from "../components/AttributeInputs";
import VariantTable from "../components/VariantTable";

export default function VariantBuilder() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    getProducts().then(res => setProducts(res.data));
  }, []);

  const selectProduct = async (id) => {
    const product = products.find(p => p._id === id);
    setSelectedProduct(product);

    const res = await getProductType(product.productType);
    setAttributes(res.data.attributes);
  };

  const generateVariants = (data) => {
    setVariants(data);
  };

  const saveVariants = async () => {
    await createVariants({
      productId: selectedProduct._id,
      variants
    });
    alert("Variants Created");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <select
        onChange={e => selectProduct(e.target.value)}
        className="border p-2 rounded w-full"
      >
        <option>Select Product</option>
        {products.map(p => (
          <option key={p._id} value={p._id}>{p.name}</option>
        ))}
      </select>

      {attributes.length > 0 && (
        <AttributeInputs
          attributes={attributes}
          onGenerate={generateVariants}
        />
      )}

      {variants.length > 0 && (
        <>
          <VariantTable variants={variants} />
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
