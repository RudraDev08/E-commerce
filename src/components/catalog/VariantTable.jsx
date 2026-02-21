import { useState } from "react";
import { deleteVariant, updateVariant } from "../../Api/catalogApi";

const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount));
};

/**
 * Enterprise-hardened VariantTable Component
 * Fully aligned with VariantMaster.enterprise.js backend invariants.
 */
const VariantTable = ({ variants, reload }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Handle Lifecycle-Aware Status Change with OCC
  const handleStatusChange = async (variant, newStatus) => {
    if (variant.status === newStatus) return;

    setIsUpdating(true);
    try {
      // ✅ Critical Fix: OCC version enforcement + Enum status
      await updateVariant(variant._id, {
        status: newStatus,
        // Send version so backend query middleware can validate for stale data
        governance: { version: variant.governance?.version }
      });
      // ✅ Structural Rule: UI must refetch after mutation to ensure state precision
      await reload();
    } catch (error) {
      if (error.response?.status === 409) {
        alert("Conflict Error: Variant has been updated by another administrator. Refreshing list...");
        reload();
      } else if (error.response?.status === 422) {
        alert("Business Logic Error: The selected lifecycle transition is not valid.");
      } else if (error.response?.status === 403) {
        alert("Governance Guard: This variant is locked and cannot be modified.");
      } else {
        alert(error.response?.data?.message || "Status update failed.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // 2. Handle Delete with OCC and Scope Checks
  const handleDelete = async (variant) => {
    // Blocks terminal states
    const isTerminal = ["LOCKED", "ARCHIVED"].includes(variant.status);
    if (isTerminal) {
      alert("Terminal states (LOCKED/ARCHIVED) cannot be deleted directly.");
      return;
    }

    if (!window.confirm("Are you sure? This operation is irreversible.")) return;

    setIsUpdating(true);
    try {
      // ✅ Critical Fix: OCC on delete prevents silent accidental deletion of updated docs
      await deleteVariant(variant._id, {
        governance: { version: variant.governance?.version }
      });
      await reload();
    } catch (error) {
      if (error.response?.status === 409) {
        alert("Conflict Detected: Refreshing current dataset before retrying.");
        reload();
      } else if (error.response?.status === 403) {
        alert("Delete Blocked: Variant is locked at the identity level.");
      } else {
        alert("Delete operation failed.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded shadow overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">Variant SKU</th>
            <th className="p-3">Identity (Size/Color)</th>
            <th className="p-3">Resolved Price</th>
            <th className="p-3">Inventory Status</th>
            <th className="p-3">Lifecycle Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {variants.map(v => {
            const isLocked = v.status === "LOCKED";
            const isArchived = v.status === "ARCHIVED";
            const qty = v.inventory?.quantityOnHand || 0;
            const isAvailable = qty > 0 && v.status === "ACTIVE";

            return (
              <tr key={v._id} className="border-t hover:bg-slate-50 transition-colors">
                {/* SKU Code */}
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-slate-800">{v.sku}</span>
                    <span className="text-[9px] text-slate-400 font-mono">v{v.governance?.version || 1}</span>
                  </div>
                </td>

                {/* Structured Identity - No longer relies on legacy attributes map */}
                <td className="p-3">
                  <div className="flex flex-col text-xs">
                    <span className="font-semibold text-slate-700">
                      Size: {v.size?.displayName || v.size?.name || "-"}
                    </span>
                    <span className="text-slate-500">
                      Color: {v.color?.name || "-"}
                    </span>
                  </div>
                </td>

                {/* Canonical Pricing - Uses resolvedPrice, never base price */}
                <td className="p-3 font-semibold text-indigo-700">
                  {formatCurrency(v.resolvedPrice || 0)}
                </td>

                {/* Inventory Intelligence */}
                <td className="p-3">
                  <div className="flex flex-col">
                    {isAvailable ? (
                      <span className="text-emerald-600 font-bold">{qty} in stock</span>
                    ) : (
                      <span className="text-rose-500 font-bold">Unavailable</span>
                    )}
                    <span className="text-[10px] uppercase text-slate-400">
                      {qty <= 0 ? "Out of Stock" : v.status !== "ACTIVE" ? "Status Restricted" : "ACTIVE"}
                    </span>
                  </div>
                </td>

                {/* Lifecycle Status - No boolean toggle */}
                <td className="p-3">
                  {isLocked ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase">
                      LOCKED
                    </span>
                  ) : (
                    <select
                      value={qty === 0 && v.status === 'ACTIVE' ? 'OUT_OF_STOCK' : v.status}
                      onChange={(e) => handleStatusChange(v, e.target.value)}
                      disabled={isUpdating || isArchived}
                      className={`text-[11px] font-bold rounded px-2 py-1 border focus:ring-2 transition-all ${(qty === 0 && v.status === 'ACTIVE') || v.status === 'OUT_OF_STOCK' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        v.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          v.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="ACTIVE" disabled={qty === 0}>ACTIVE</option>
                      <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  )}
                </td>

                {/* Actions */}
                <td className="p-3">
                  <button
                    disabled={isUpdating || isLocked || isArchived}
                    onClick={() => handleDelete(v)}
                    className="text-rose-600 hover:text-rose-800 font-medium text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
  );
};

export default VariantTable;
