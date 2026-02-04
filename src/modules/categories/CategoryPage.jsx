import { useEffect, useState } from "react";
import categoryApi from "../../Api/Category/categoryApi";
import CategoryForm from "../../components/Category/CategoryForm";
import CategoryList from "../../components/Category/CategoryList";

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryApi.getAll();
      setCategories(res.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="w-full">
      <h1 className="text-xl font-bold mb-6">Category Management</h1>

      <CategoryForm onSuccess={fetchCategories} />

      <CategoryList
        loading={loading}
        data={categories}
        onRefresh={fetchCategories}
      />
    </div>
  );
}
