import countries from "../data/countryData"

const CountrySelect = ({ country, setCountry }) => {
  return (
    <select
      value={country}
      onChange={(e) => setCountry(e.target.value)}
      className="w-full border rounded px-3 py-2"
    >
      <option value="">Select Country</option>
      {countries.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
};

export default CountrySelect;
