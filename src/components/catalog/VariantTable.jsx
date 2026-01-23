import { deleteVariant, toggleVariant } from "../../Api/catalogApi";

const VariantTable = ({ variants, reload }) => {
  return (
    <div className="bg-white rounded shadow overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">Product</th>
            <th className="p-3">Attributes</th>
            <th className="p-3">Price</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {variants.map(v => (
            <tr key={v._id} className="border-t">
              <td className="p-3">{v.productId?.name}</td>
              <td className="p-3">
                {Object.entries(v.attributes).map(([k, val]) => (
                  <span key={k} className="mr-2">
                    {k}:{val}
                  </span>
                ))}
              </td>
              <td className="p-3">₹{v.price}</td>
              <td className="p-3">{v.stock}</td>
              <td className="p-3">
                <span className={v.status ? "text-green-600" : "text-red-600"}>
                  {v.status ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="p-3 space-x-2">
                <button
                  onClick={() => toggleVariant(v._id).then(reload)}
                  className="text-blue-600"
                >
                  Toggle
                </button>
                <button
                  onClick={() => deleteVariant(v._id).then(reload)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VariantTable;
