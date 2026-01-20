// CategoryForm.jsx
import { useState } from "react";
import categoryApi from "../../Api/Category/categoryApi";

export default function CategoryForm({ reload }) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await categoryApi.createCategory({ name });
      setName("");
      reload();
    } catch (error) {
      console.error("Failed to create category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Add New Category
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Create a new category to organize your items
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Enter category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
        </div>
        
        <button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 whitespace-nowrap"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </div>
          ) : (
            "Add Category"
          )}
        </button>
      </div>

      {!name.trim() && (
        <p className="mt-2 text-sm text-gray-400">
          Enter a category name to enable the add button
        </p>
      )}
    </form>
  );
}