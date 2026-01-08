const LocationDropdown = ({ data, value, onChange, label }) => (
  <div>
    <label className="text-sm font-semibold">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border px-3 py-2 rounded"
    >
      <option value="">Select</option>
      {data.map((item) => (
        <option key={item._id} value={item._id}>
          {item.name}
        </option>
      ))}
    </select>
  </div>
);

export default LocationDropdown;
