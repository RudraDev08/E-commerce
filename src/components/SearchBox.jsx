const SearchBox = ({ value, onChange }) => (
  <input
    placeholder="Search..."
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);

export default SearchBox;
