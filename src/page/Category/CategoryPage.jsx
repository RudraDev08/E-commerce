// CategoryPage.jsx
import { useEffect, useState } from "react";
import categoryApi from "../../Api/Category/categoryApi";

import CategoryForm from "../../components/Category/CategoryForm";
import CategoryList from "../../components/Category/CategoryList";
import CategoryTree from "../../components/Category/CategoryTree";

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);

      const [listRes, treeRes] = await Promise.all([
        categoryApi.getAll(),
        categoryApi.getTree()
      ]);

      setCategories(listRes.data?.data || listRes.data || []);
      setTree(treeRes.data || []);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    await categoryApi.deleteCategory(id);
    load();
  };

  return (
    <div className="container">
      <h2>Category Management</h2>

      <CategoryForm reload={load} />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <CategoryList data={categories} onDelete={handleDelete} />
      )}

      <CategoryTree tree={tree} />
    </div>
  );
}
