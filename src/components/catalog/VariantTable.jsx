export default function VariantTable({ variants = [], onChange }) {
  // Safety guard
  if (!Array.isArray(variants) || variants.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-500">
        No variants generated yet
      </p>
    );
  }

  const handleChange = (index, field, value) => {
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      [field]: Number(value),
    };
    onChange(updated);
  };

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border border-gray-200 rounded-lg">
        <thead className="bg-gray-100 text-sm">
          <tr>
            <th className="p-3 text-left">Attributes</th>
            <th className="p-3 text-center w-32">Price</th>
            <th className="p-3 text-center w-32">Stock</th>
          </tr>
        </thead>

        <tbody>
          {variants.map((variant, index) => (
            <tr key={index} className="border-t">
              {/* ATTRIBUTES */}
              <td className="p-3">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(variant).map(([key, val]) => {
                    if (key === "price" || key === "stock") return null;

                    return (
                      <span
                        key={key}
                        className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700"
                      >
                        <b className="uppercase">{key}</b>: {val}
                      </span>
                    );
                  })}
                </div>
              </td>

              {/* PRICE */}
              <td className="p-3 text-center">
                <input
                  type="number"
                  className="w-24 border rounded px-2 py-1 text-sm"
                  placeholder="Price"
                  value={variant.price || ""}
                  onChange={e =>
                    handleChange(index, "price", e.target.value)
                  }
                />
              </td>

              {/* STOCK */}
              <td className="p-3 text-center">
                <input
                  type="number"
                  className="w-24 border rounded px-2 py-1 text-sm"
                  placeholder="Stock"
                  value={variant.stock || ""}
                  onChange={e =>
                    handleChange(index, "stock", e.target.value)
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
