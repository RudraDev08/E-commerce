import { useEffect, useState } from "react";
import { getVariants, deleteVariant, updateVariant } from "../../Api/catalogApi";

const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount));
};

/**
 * Enterprise-grade Variant List Component
 * Aligned with VariantMaster.enterprise.js backend invariants.
 */
const VariantList = ({ productId }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // Guard for double-clicks

  // 1. Fetch Variants
  const fetchVariants = async () => {
    if (!productId) {
      setVariants([]);
      return;
    }

    setLoading(true);
    try {
      const res = await getVariants(productId);
      setVariants(res.data.data || res.data || []);
    } catch (error) {
      console.error("Load failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  // 2. Handle Delete with OCC
  const handleDelete = async (variant) => {
    const isLocked = ["LOCKED", "ARCHIVED"].includes(variant.status);
    if (isLocked) {
      alert("This variant is locked or archived and cannot be deleted.");
      return;
    }

    if (!window.confirm("Are you sure? This cannot be undone.")) return;

    setIsUpdating(true);
    try {
      // ✅ Critical Fix: OCC on Delete
      await deleteVariant(variant._id, {
        governance: { version: variant.governance?.version }
      });
      // ✅ Success rule: Always refetch, no optimistic boolean toggle
      await fetchVariants();
    } catch (error) {
      if (error.response?.status === 409) {
        alert("Conflict: Variant was updated by another admin. Refreshing list...");
        fetchVariants();
      } else if (error.response?.status === 403) {
        alert("Critical Error: Variant is locked at the database level.");
      } else {
        alert(error.response?.data?.message || "Delete failed");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. Handle Status Change with Lifecycle Logic & OCC
  const handleStatusChange = async (variant, newStatus) => {
    if (variant.status === newStatus) return;
    if (variant.status === "LOCKED") return;

    setIsUpdating(true);
    try {
      // ✅ Critical Fix: Await API, Refetch List, Never invert locally
      await updateVariant(variant._id, {
        status: newStatus,
        governance: { version: variant.governance?.version }
      });

      await fetchVariants(); // Ensure state is precise
    } catch (error) {
      // ✅ Improved Error Handling per status codes
      if (error.response?.status === 409) {
        alert("Conflict: Variant was updated by another admin. Refreshing...");
        fetchVariants();
      } else if (error.response?.status === 422) {
        alert("Invalid Operation: This lifecycle transition is not allowed.");
      } else if (error.response?.status === 403) {
        alert("Access Denied: Variant is locked and cannot be modified.");
      } else {
        alert(error.response?.data?.message || "Status update failed");
      }
    } finally {
      setIsUpdating(false);
    }
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
                <th className="px-4 py-3">Identity (Size/Color)</th>
                <th className="px-4 py-3">Resolved Price</th>
                <th className="px-4 py-3">Inventory</th>
                <th className="px-4 py-3">Lifecycle Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => {
                const isLocked = ["LOCKED", "ARCHIVED"].includes(variant.status);
                const qty = variant.inventory?.quantityOnHand || 0;

                return (
                  <tr key={variant._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-gray-900">{variant.sku}</span>
                        <span className="font-mono text-[9px] text-gray-400">v{variant.governance?.version || 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {/* ✅ Structured Attribute Display */}
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold">Size: {variant.size?.displayName || variant.size?.name || "N/A"}</span>
                        <span>Color: {variant.color?.name || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-600">
                      {/* ✅ Uses resolvedPrice, never base price */}
                      {formatCurrency(variant.resolvedPrice || 0)}
                    </td>
                    <td className="px-4 py-3">
                      {/* ✅ Uses inventory.quantityOnHand + ACTIVE check */}
                      {qty > 0 && variant.status === "ACTIVE" ? (
                        <div className="flex flex-col">
                          <span className="text-green-600 font-bold">{qty} in stock</span>
                          <span className="text-[10px] text-gray-400 uppercase">Available</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-red-500 font-bold">Unavailable</span>
                          <span className="text-[10px] text-gray-400 uppercase">
                            {qty === 0 ? "Out of Stock" : "Status Restricted"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {/* ✅ Dropdown Lifecycle Enum display */}
                      {variant.status === "LOCKED" ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-bold rounded bg-indigo-100 text-indigo-800 uppercase ring-1 ring-indigo-200">
                            LOCKED
                          </span>
                        </div>
                      ) : (
                        <select
                          value={qty === 0 && variant.status === 'ACTIVE' ? 'OUT_OF_STOCK' : variant.status}
                          disabled={isUpdating || variant.status === "ARCHIVED"}
                          onChange={(e) => handleStatusChange(variant, e.target.value)}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 font-bold"
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="ACTIVE" disabled={qty === 0}>ACTIVE</option>
                          <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(variant)}
                        disabled={isUpdating || isLocked}
                        className={`font-medium transition-colors ${isLocked
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-red-600 hover:text-red-900"
                          }`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VariantList;