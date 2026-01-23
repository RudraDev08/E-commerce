import { useEffect, useState } from "react";
import { getVariants, deleteVariant, toggleVariant } from "../../Api/catalogApi";

const VariantList = ({ productId }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Variants when Product changes
  const fetchVariants = async () => {
    if (!productId) {
      setVariants([]); 
      return;
    }
    
    setLoading(true);
    try {
      // Assuming your API supports ?productId=... filtering
      const res = await getVariants(productId); 
      setVariants(res.data.data || res.data);
    } catch (error) {
      console.error("Load failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  // 2. Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await deleteVariant(id);
      setVariants(prev => prev.filter(v => v._id !== id)); // Optimistic update
    } catch (error) {
      alert("Delete failed: " + error.message);
    }
  };

  // 3. Handle Status Toggle
  const handleToggle = async (id, currentStatus) => {
    try {
      await toggleVariant(id);
      setVariants(prev => prev.map(v => 
        v._id === id ? { ...v, status: !currentStatus } : v
      ));
    } catch (error) {
      alert("Toggle failed");
    }
  };

  // Helper to format the Attributes Map into a string
  const formatAttributes = (attrs) => {
    if (!attrs) return "-";
    // Convert { size: "M", color: "Red" } -> "Size: M, Color: Red"
    return Object.entries(attrs)
      .map(([key, val]) => `${key}: ${val}`)
      .join(" | ");
  };

  if (!productId) return null;

  return (
    <div className="bg-white rounded shadow p-6 mt-6 border border-gray-200">
      <h3 className="font-semibold mb-4 text-lg">Existing Variants</h3>
      
      {loading ? (
        <p className="text-gray-500 animate-pulse">Loading list...</p>
      ) : variants.length === 0 ? (
        <p className="text-gray-400 italic">No variants created for this product yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Attributes</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {variant.sku}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {/* The Helper Function makes this look clean */}
                    {formatAttributes(variant.attributes)}
                  </td>
                  <td className="px-4 py-3">
                    ${variant.price}
                  </td>
                  <td className="px-4 py-3">
                    {variant.stock > 0 ? (
                      <span className="text-green-600 font-bold">{variant.stock}</span>
                    ) : (
                      <span className="text-red-500 font-bold">Out of Stock</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => handleToggle(variant._id, variant.status)}
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        variant.status ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {variant.status ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDelete(variant._id)}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VariantList;