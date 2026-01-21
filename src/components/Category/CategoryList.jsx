import CategoryRow from "./CategoryRow";

export default function CategoryList({ data, loading, onRefresh }) {
  if (loading) return <p>Loading categories...</p>;
  if (!data.length) return <p>No categories found.</p>;

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((cat) => (
            <CategoryRow key={cat._id} data={cat} onRefresh={onRefresh} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
