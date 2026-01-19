import React, { memo } from "react";
import {
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { TableLoader } from "../common/Loader";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CategoryTable = memo(
  ({
    categories = [],
    pagination,
    loading = false,
    onEdit,
    onDelete,
    onStatusChange,
    onPageChange
  }) => {
    const safeCategories = Array.isArray(categories) ? categories : [];

    if (loading) return <TableLoader />;

    if (!safeCategories.length) {
      return (
        <div className="py-16 text-center text-sm text-gray-500 bg-white border rounded-lg">
          No categories found
        </div>
      );
    }

    const start =
      pagination?.page && pagination?.limit
        ? (pagination.page - 1) * pagination.limit + 1
        : 1;

    const end = start + safeCategories.length - 1;

    return (
      <div className="space-y-3">
        {/* TABLE */}
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2">Image</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2">Parent</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {safeCategories.map((cat) => {
                const isActive = cat.status === "active";

                return (
                  <tr key={cat._id} className="hover:bg-gray-50">
                    {/* IMAGE */}
                    <td className="px-3 py-2">
                      <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        {cat.image ? (
                          <img
                            src={`${API_URL}/${cat.image}`}
                            alt={cat.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon size={14} className="text-gray-400" />
                        )}
                      </div>
                    </td>

                    {/* NAME */}
                    <td className="px-3 py-2">
                      <div className="font-medium">{cat.name}</div>
                      <div className="text-[11px] text-gray-400">
                        {cat.slug}
                      </div>
                    </td>

                    {/* PARENT */}
                    <td className="px-3 py-2 text-gray-500 italic">
                      {cat.parentId?.name ?? "Root"}
                    </td>

                    {/* STATUS */}
                    <td className="px-3 py-2">
                      <button
                        onClick={() =>
                          onStatusChange(
                            cat._id,
                            isActive ? "inactive" : "active"
                          )
                        }
                        className="flex items-center gap-1 text-xs"
                      >
                        {isActive ? (
                          <>
                            <ToggleRight size={16} className="text-green-600" />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={16} className="text-gray-400" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => onEdit(cat)}
                          className="text-gray-500 hover:text-indigo-600"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(cat)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pagination?.pages > 1 && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {start}–{end} of {pagination.total}
            </span>

            <div className="flex gap-1">
              <button
                disabled={pagination.page === 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="p-1 border rounded disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="p-1 border rounded disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CategoryTable.displayName = "CategoryTable";

export default CategoryTable;
