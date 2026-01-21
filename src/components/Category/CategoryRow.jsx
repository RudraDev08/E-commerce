import categoryApi from "../../Api/Category/categoryApi";

export default function CategoryRow({ data, onRefresh }) {
  const toggleStatus = async () => {
    await categoryApi.toggleStatus(data._id);
    onRefresh();
  };

  const remove = async () => {
    if (confirm("Delete category?")) {
      await categoryApi.deleteCategory(data._id);
      onRefresh();
    }
  };

  return (
    <tr className="border-t">
      <td className="p-3">{data.name}</td>
      <td className="p-3 text-center">
        <button
          onClick={toggleStatus}
          className={`px-3 py-1 rounded text-xs ${
            data.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}
        >
          {data.isActive ? "Active" : "Inactive"}
        </button>
      </td>
      <td className="p-3 text-right">
        <button onClick={remove} className="text-red-500 text-xs">
          Delete
        </button>
      </td>
    </tr>
  );
}
