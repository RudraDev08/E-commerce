import { useState } from "react";
import { locationData } from "../data/LocationData";

const ToggleOne = () => {
  const [on, setOn] = useState(false);
  const [country, setCountry] = useState("");

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 space-y-5 border border-gray-200">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Country Selection
          </h3>
          <p className="text-sm text-gray-500">
            Enable to select a country
          </p>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={() => {
            setOn(!on);
            setCountry("");
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${on ? "bg-blue-600" : "bg-gray-300"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${on ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>

      {/* Country Select */}
      {on && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Country
          </label>

          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                       transition"
          >
            <option value="">Choose a country</option>
            {Object.keys(locationData).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selected Preview */}
      {country && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
          Selected Country: <span className="font-semibold">{country}</span>
        </div>
      )}
    </div>
  );
};

export default ToggleOne;
