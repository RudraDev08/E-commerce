import { useEffect, useState } from "react";
import { getCategories } from "../../Api/Category/CategoryApi";
import CategoryForm from "../../components/Category/CategoryForm";
import CategoryTable from "../../components/Category/CategoryTable";

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    const res = await getCategories();
    setCategories(res.data.data || res.data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Category Management
      </h2>

      <CategoryForm onSuccess={fetchCategories} />

      <CategoryTable
        categories={categories}
        onRefresh={fetchCategories}
      />
    </div>
  );
};

export default CategoryPage;
