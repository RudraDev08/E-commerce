import { useState } from "react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
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
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(null);

  const handlePincode = async (value) => {
    const trimmedValue = value.replace(/\D/g, "").slice(0, 6);
    setPincode(trimmedValue);
    setError("");
    setIsValid(null);

    // Reset when not 6 digits
    if (trimmedValue.length !== 6) {
      setCity("");
      setState("");
      setCountry("");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ City
      const cityRes = await getCityByPincode(trimmedValue);
      if (!cityRes.data || cityRes.data.length === 0) {
        setError("Invalid pincode. Please enter a valid 6-digit pincode.");
        setIsValid(false);
        setLoading(false);
        return;
      }

      const cityData = cityRes.data[0];
      setCity(cityData.name);

      // 2️⃣ State
      const stateRes = await getStateById(cityData.stateId);
      if (!stateRes.data) {
        setError("State information not available");
        setIsValid(false);
        setLoading(false);
        return;
      }
      setState(stateRes.data.name);

      // 3️⃣ Country
      const countryRes = await getCountryById(stateRes.data.countryId);
      if (!countryRes.data) {
        setError("Country information not available");
        setIsValid(false);
        setLoading(false);
        return;
      }
      setCountry(countryRes.data.name);
      setIsValid(true);
      setError("");
    } catch (error) {
      setError("Failed to fetch location details. Please try again.");
      setIsValid(false);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setPincode("");
    setCountry("");
    setState("");
    setCity("");
    setError("");
    setIsValid(null);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl mb-4">
          <MapPinIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Pincode Finder
        </h2>
        <p className="text-gray-600">
          Enter a 6-digit pincode to auto-fill location details
        </p>
      </div>

      {/* Pincode Input */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter Pincode
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={pincode}
            onChange={(e) => handlePincode(e.target.value)}
            placeholder="Enter 6-digit pincode"
            className="w-full pl-10 pr-12 py-3.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-base"
            maxLength={6}
          />
          {pincode && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {loading ? (
                <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : isValid === true ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              ) : isValid === false ? (
                <XCircleIcon className="h-6 w-6 text-red-500" />
              ) : null}
            </div>
          )}
        </div>
        {pincode.length > 0 && pincode.length < 6 && (
          <p className="mt-2 text-sm text-amber-600">
            {6 - pincode.length} more digits required
          </p>
        )}
      </div>

      {/* Location Cards */}
      <div className="space-y-4 mb-8">
        {/* Country Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center mr-4">
              <GlobeAltIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Country
              </div>
              <div className="text-lg font-semibold text-gray-800">
                {country || "Not selected"}
              </div>
            </div>
          </div>
        </div>

        {/* State Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center mr-4">
              <MapPinIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                State
              </div>
              <div className="text-lg font-semibold text-gray-800">
                {state || "Not selected"}
              </div>
            </div>
          </div>
        </div>

        {/* City Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg flex items-center justify-center mr-4">
              <BuildingOfficeIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                City
              </div>
              <div className="text-lg font-semibold text-gray-800">
                {city || "Not selected"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start">
            <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={clearAll}
          className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          Clear All
        </button>
        {isValid && (
          <button
            onClick={() => {
              // Handle submit action
              console.log({ pincode, country, state, city });
            }}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-600 active:scale-98 transition-all shadow-md hover:shadow-lg"
          >
            Use This Location
          </button>
        )}
      </div>

      {/* Info Text */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          This system automatically detects location based on Indian pincodes.
          Ensure you enter a valid 6-digit pincode.
        </p>
      </div>
    </div>
  );
};

export default PincodeAutoSelect;