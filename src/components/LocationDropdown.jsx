const LocationDropdown = ({ label, data, value, onChange }) => (
  <div>
    <label>{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select {label}</option>
      {data.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </select>
  </div>
);

export default LocationDropdown;
