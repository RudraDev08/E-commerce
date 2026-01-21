import { useState } from "react";
import categoryApi from "../../Api/Category/categoryApi";

export default function CategoryForm({ onSuccess }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await categoryApi.createCategory({ name });
    setName("");
    setLoading(false);
    onSuccess();
  };

  return (
    <form onSubmit={submit} className="mb-6 flex gap-3 max-w-md">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        className="flex-1 border rounded-lg px-4 py-2"
      />
      <button
        disabled={loading}
        className="px-5 py-2 bg-slate-900 text-white rounded-lg"
      >
        {loading ? "Saving..." : "Add"}
      </button>
    </form>
  );
}
