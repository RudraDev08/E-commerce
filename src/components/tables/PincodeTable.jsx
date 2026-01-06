import { useState } from "react";
import {
  getCityByPincode,
  getStateById,
  getCountryById,
} from "../../Api/locationApi";

const PincodeAutoSelect = () => {
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");

  const handlePincode = async (value) => {
    setPincode(value);
    setError("");

    if (value.length < 4) return;

    try {
      // 1️⃣ City
      const cityRes = await getCityByPincode(value);
      if (cityRes.data.length === 0) {
        setError("Invalid pincode");
        return;
      }

      const cityData = cityRes.data[0];
      setCity(cityData.name);

      // 2️⃣ State
      const stateRes = await getStateById(cityData.stateId);
      setState(stateRes.data.name);

      // 3️⃣ Country
      const countryRes = await getCountryById(stateRes.data.countryId);
      setCountry(countryRes.data.name);
    } catch {
      setError("Failed to fetch location");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Pincode Auto Select</h2>

      <input
        value={pincode}
        onChange={(e) => handlePincode(e.target.value)}
        placeholder="Enter Pincode"
        className="border px-3 py-2 w-full rounded mb-3"
      />

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <input value={country} disabled placeholder="Country"
        className="border px-3 py-2 w-full rounded mb-2 bg-gray-100" />

      <input value={state} disabled placeholder="State"
        className="border px-3 py-2 w-full rounded mb-2 bg-gray-100" />

      <input value={city} disabled placeholder="City"
        className="border px-3 py-2 w-full rounded bg-gray-100" />
    </div>
  );
};

export default PincodeAutoSelect;
