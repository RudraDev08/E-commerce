import { useState } from "react";
import {
  toggleCategoryStatus,
  deleteCategory,
  updateCategory,
} from "../../Api/Category/CategoryApi";
import { Power, Tag, Layers, Pencil, Trash2 } from "lucide-react";

const CategoryTable = ({ categories, onRefresh }) => {
  const [editCat, setEditCat] = useState(null);
  const [editName, setEditName] = useState("");

  // 🔥 FILTER STATE
  const [typeFilter, setTypeFilter] = useState("ALL");

  /* ===== FILTER LOGIC ===== */
  const filteredCategories =
    typeFilter === "ALL"
      ? categories
      : categories.filter((cat) => cat.type === typeFilter);

  /* ===== TOGGLE STATUS ===== */
  const handleToggle = async (id) => {
    try {
      await toggleCategoryStatus(id);
      onRefresh();
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  /* ===== DELETE ===== */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      onRefresh();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  /* ===== EDIT ===== */
  const openEdit = (cat) => {
    setEditCat(cat);
    setEditName(cat.name);
  };

  const saveEdit = async () => {
    try {
      await updateCategory(editCat._id, { name: editName });
      setEditCat(null);
      onRefresh();
    } catch (error) {
      console.error("Edit failed", error);
    }
  };

  const headerStyle =
    "px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100";
  const cellStyle = "px-6 py-4 text-xs text-slate-600 border-b border-slate-50";

  return (
    <>
      {/* 🔥 FILTER DROPDOWN */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-semibold text-slate-500">
          Filter:
        </span>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-8 px-3 rounded-lg border text-xs"
        >
          <option value="ALL">All Categories</option>
          <option value="MAIN">Main Categories</option>
          <option value="SUB">Sub Categories</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className={headerStyle}>Name</th>
                <th className={headerStyle}>Type</th>
                <th className={headerStyle}>Parent Category</th>
                <th className={headerStyle}>Status</th>
                <th className={headerStyle}>Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <tr
                    key={cat._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    {/* NAME */}
                    <td className={cellStyle}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Tag size={14} />
                        </div>
                        <span className="font-semibold text-slate-900">
                          {cat.name}
                        </span>
                      </div>
                    </td>

                    {/* TYPE */}
                    <td className={cellStyle}>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                          cat.type === "MAIN"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {cat.type}
                      </span>
                    </td>

                    {/* PARENT */}
                    <td className={cellStyle}>
                      {cat.type === "SUB" ? (
                        <div className="flex items-center gap-1.5">
                          <Layers size={12} className="text-slate-400" />
                          {cat.parentId?.name || "—"}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className={cellStyle}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggle(cat._id)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            cat.status ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                              cat.status ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>

                        <span
                          className={`text-[11px] font-semibold ${
                            cat.status
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          {cat.status ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    {/* ACTION */}
                    <td className={cellStyle}>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggle(cat._id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                            cat.status
                              ? "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          }`}
                        >
                          <Power size={12} />
                          {cat.status ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          onClick={() => openEdit(cat)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(cat._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-400 text-xs italic"
                  >
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editCat && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-80">
            <h3 className="text-sm font-bold mb-3">Edit Category</h3>

            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full h-9 border rounded-lg px-3 text-xs"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditCat(null)}
                className="text-xs"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryTable;
