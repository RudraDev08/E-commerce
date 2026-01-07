import { useEffect, useState } from "react";
import { getCountries } from "../../api/countryApi";
import { getStates } from "../../Api/StateApi";
import {
  getCitiesByState,
  addCity,
  updateCity,
  deleteCity,
} from "../../Api/CityApi";
import {
  Plus,
  Trash2,
  Globe,
  MapPin,
  Building2,
  CheckCircle,
  XCircle,
  ChevronRight,
  Pencil,
  Check,
  X,
} from "lucide-react";

const CityTable = () => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");

  const [cityName, setCityName] = useState("");
  const [loading, setLoading] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  /* ================= LOADERS ================= */

  useEffect(() => {
    getCountries().then((res) => setCountries(res.data || []));
  }, []);

  useEffect(() => {
    if (!countryId) {
      setStates([]);
      setStateId("");
      setCities([]);
      return;
    }
    getStates(countryId).then((res) => setStates(res.data || []));
  }, [countryId]);

  const loadCities = async () => {
    if (!stateId) return;
    setLoading(true);
    const res = await getCitiesByState(stateId);
    setCities(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadCities();
  }, [stateId]);

  /* ================= ADD ================= */

  const handleAddCity = async () => {
    if (!cityName.trim()) return alert("Enter city name");

    await addCity({
      id: Date.now().toString(),
      name: cityName.trim(),
      stateId,
      active: true,
    });

    setCityName("");
    loadCities();
  };

  /* ================= EDIT ================= */

  const saveEdit = async (id) => {
    if (!editName.trim()) return alert("City name required");

    await updateCity(id, { name: editName.trim() });
    setEditId(null);
    setEditName("");
    loadCities();
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  /* ================= STATUS ================= */

  const toggleStatus = async (city) => {
    await updateCity(city.id, { active: !city.active });
    loadCities();
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Delete city?")) return;
    await deleteCity(id);
    loadCities();
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow">

        {/* COUNTRY / STATE */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <select
            value={countryId}
            onChange={(e) => setCountryId(e.target.value)}
            className="border p-3 rounded"
          >
            <option value="">Select Country</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={stateId}
            onChange={(e) => setStateId(e.target.value)}
            disabled={!countryId}
            className="border p-3 rounded"
          >
            <option value="">Select State</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* ADD CITY */}
        {stateId && (
          <div className="flex gap-3 mb-6">
            <input
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="City name"
              className="border px-4 py-2 rounded w-full"
            />
            <button
              onClick={handleAddCity}
              className="bg-blue-600 text-white px-5 rounded"
            >
              <Plus size={18} />
            </button>
          </div>
        )}

        {/* TABLE */}
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">City</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cities.map((city) => (
              <tr key={city.id} className="border-t">

                {/* NAME */}
                <td className="p-3">
                  {editId === city.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border px-2 py-1 rounded w-full"
                      autoFocus
                    />
                  ) : (
                    city.name
                  )}
                </td>

                {/* STATUS */}
                <td className="p-3 text-center">
                  <button
                    onClick={() => toggleStatus(city)}
                    className={`px-3 py-1 rounded text-sm ${
                      city.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {city.active ? "Active" : "Inactive"}
                  </button>
                </td>

                {/* ACTIONS */}
                <td className="p-3 flex gap-2 justify-center">
                  {editId === city.id ? (
                    <>
                      <button onClick={() => saveEdit(city.id)} className="text-green-600">
                        <Check size={18} />
                      </button>
                      <button onClick={cancelEdit} className="text-gray-600">
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditId(city.id);
                          setEditName(city.name);
                        }}
                        className="text-blue-600"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(city.id)}
                        className="text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {cities.length === 0 && (
              <tr>
                <td colSpan="3" className="p-4 text-center text-gray-500">
                  No cities found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {loading && <p className="text-center mt-4">Loading...</p>}
      </div>
    </div>
  );
};

export default CityTable;
