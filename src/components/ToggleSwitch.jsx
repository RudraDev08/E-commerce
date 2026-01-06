const ToggleSwitch = ({ value, onToggle }) => (
  <button onClick={onToggle}>
    {value ? "Enabled" : "Disabled"}
  </button>
);

export default ToggleSwitch;
