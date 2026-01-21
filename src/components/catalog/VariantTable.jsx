export default function VariantTable({ variants }) {
  return (
    <table className="w-full mt-6 border">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2">Attributes</th>
          <th>Price</th>
          <th>Stock</th>
        </tr>
      </thead>
      <tbody>
        {variants.map((v, i) => (
          <tr key={i} className="border-t">
            <td className="p-2">{JSON.stringify(v)}</td>
            <td><input className="border p-1 w-24" /></td>
            <td><input className="border p-1 w-24" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
