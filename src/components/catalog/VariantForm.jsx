import { useEffect, useState } from "react";
import { getProductType, createVariants, getAllProductTypes } from "../../Api/catalogApi";

const VariantForm = ({ products, onVariantCreated }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // New State for the "Manual Override" dropdown
  const [allProductTypes, setAllProductTypes] = useState([]);
  const [manualTypeId, setManualTypeId] = useState(""); 

  const [attributes, setAttributes] = useState([]);
  const [values, setValues] = useState({});
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [loadingAttrs, setLoadingAttrs] = useState(false);

  // 1. Fetch All Product Types on Load (For the Fallback Dropdown)
  useEffect(() => {
    getAllProductTypes().then(res => {
      setAllProductTypes(res.data.data || res.data);
    }).catch(err => console.error("Could not load types", err));
  }, []);

  // 2. Handle Product Selection
  const handleProductChange = (e) => {
    const prodId = e.target.value;
    const prod = products.find((p) => p._id === prodId);
    setSelectedProduct(prod);
    setManualTypeId("");
    setValues({});
    setAttributes([]);
  };


  useEffect(() => {
    if (!selectedProduct) return;

    let typeId = selectedProduct.productType?._id || selectedProduct.productType;

    if (!typeId) {
      if (manualTypeId) {
        typeId = manualTypeId; // Use the manual override
      } else {
        return; 
      }
    }

    setLoadingAttrs(true);

    getProductType(typeId)
      .then((res) => {
        const data = res.data.data || res.data;
        if (Array.isArray(data.attributes)) {
          setAttributes(data.attributes);
        } else {
          setAttributes([]);
        }
      })
      .finally(() => setLoadingAttrs(false));
  }, [selectedProduct, manualTypeId]); // Re-run if Manual Type changes

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const payload = {
      productId: selectedProduct._id,
      attributes: values,
      price: Number(price),
      stock: Number(stock),
      sku,
    };

    try {
      const res = await createVariants(payload);
      onVariantCreated(res.data.data || res.data);
      alert("Saved!");
      setValues({});
    } catch (error) {
      alert(error.message);
    }
  };

  // Helper to check if we are in "Missing Data" mode
  const isMissingType = selectedProduct && !selectedProduct.productType;

  return (
    <form onSubmit={submit} className="bg-white rounded shadow p-6 space-y-5">
      <h2 className="font-semibold">Create Variant</h2>

      {/* PRODUCT SELECT */}
      <div>
        <label className="block text-sm font-medium mb-1">Select Product</label>
        <select
          className="w-full border p-2 rounded"
          onChange={handleProductChange}
          value={selectedProduct?._id || ""}
        >
          <option value="">-- Choose Product --</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* 🔴 FALLBACK DROPDOWN: Only shows if data is missing */}
      {isMissingType && (
        <div className="bg-yellow-50 p-4 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-700 mb-2">
            ⚠️ <strong>Missing Link:</strong> This product has no Type assigned. 
            Please select one to continue:
          </p>
          <select 
            className="w-full border p-2 rounded bg-white"
            value={manualTypeId}
            onChange={(e) => setManualTypeId(e.target.value)}
          >
            <option value="">-- Select Manual Type --</option>
            {allProductTypes.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* ATTRIBUTES INPUTS */}
      {loadingAttrs && <p className="text-sm text-gray-400">Loading specs...</p>}
      
      <div className="grid grid-cols-2 gap-4">
        {attributes.map((attr) => (
          <div key={attr._id || attr.slug}>
            <label className="block text-xs uppercase font-bold text-gray-500">
              {attr.name}
            </label>
            {attr.values?.length > 0 ? (
               <select 
                 className="w-full border p-2 rounded"
                 onChange={e => setValues({...values, [attr.slug]: e.target.value})}
               >
                 <option value="">Select...</option>
                 {attr.values.map(v => <option key={v} value={v}>{v}</option>)}
               </select>
            ) : (
               <input 
                 className="w-full border p-2 rounded"
                 onChange={e => setValues({...values, [attr.slug]: e.target.value})}
               />
            )}
          </div>
        ))}
      </div>

      {/* PRICE / STOCK / SKU */}
      <div className="grid grid-cols-3 gap-3">
         <input placeholder="Price" className="border p-2" onChange={e => setPrice(e.target.value)} />
         <input placeholder="Stock" className="border p-2" onChange={e => setStock(e.target.value)} />
         <input placeholder="SKU" className="border p-2" onChange={e => setSku(e.target.value)} />
      </div>

      <button className="bg-black text-white px-4 py-2 rounded w-full">
        Save Variant
      </button>
    </form>
  );
};

export default VariantForm;