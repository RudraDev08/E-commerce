import { useState } from "react";
import { pincodeData } from "../data/LocationData";

const ToggleFour = () => {
  const [on, setOn] = useState(false);
  const [pincode, setPincode] = useState("");

  // ✅ derived value (no effect, no extra state)
  const result = pincodeData[pincode] || null;

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 space-y-5 border border-gray-200">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Pincode Auto Selection
          </h3>
          <p className="text-sm text-gray-500">
            Enter pincode to auto-detect location
          </p>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={() => {
            setOn(!on);
            setPincode("");
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

      {/* Pincode Input */}
      {on && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Pincode
            </label>
            <input
              type="text"
              placeholder="e.g. 90001"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                         transition"
            />
          </div>

          {/* Result */}
          {result && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Location Found:{" "}
              <span className="font-semibold">
                {result.country} → {result.state} → {result.city}
              </span>
            </div>
          )}

          {/* Invalid pincode feedback */}
          {pincode && !result && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              No location found for this pincode
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ToggleFour;
