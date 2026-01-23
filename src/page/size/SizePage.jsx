import { useEffect, useState } from "react";
import {
  getSizes,
  addSize,
  deleteSize,
  toggleSize
} from "../../Api/Size/sizeApi";
import { getProducts } from "../../Api/Product/productApi";

const ProductSizePage = () => {
  const [products, setProducts] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    product: "",
    sizeName: "",
    sizeValue: ""
  });

  /* ---------------- FETCH PRODUCTS ---------------- */
  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res?.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  /* ---------------- FETCH SIZES ---------------- */
  const fetchSizes = async () => {
    try {
      const res = await getSizes({ search, page });
      setSizes(res?.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch sizes", err);
      setSizes([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSizes();
  }, [search, page]);

  /* ---------------- SUBMIT ---------------- */
  const submit = async (e) => {
    e.preventDefault();

    if (!form.product || !form.sizeName || !form.sizeValue) {
      alert("All fields are required");
      return;
    }

    await addSize(form);
    setForm({ product: "", sizeName: "", sizeValue: "" });
    fetchSizes();
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className="space-y-6">

      {/* FORM */}
      <form
        onSubmit={submit}
        className="bg-white p-4 rounded-xl shadow space-y-3"
      >
        <select
          value={form.product}
          onChange={(e) =>
            setForm({ ...form, product: e.target.value })
          }
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Size Name (e.g. Medium)"
          value={form.sizeName}
          onChange={(e) =>
            setForm({ ...form, sizeName: e.target.value })
          }
        />

        <input
          placeholder="Size Value (e.g. M / 128GB)"
          value={form.sizeValue}
          onChange={(e) =>
            setForm({ ...form, sizeValue: e.target.value })
          }
        />

        <button type="submit">Add Size</button>
      </form>

      {/* SEARCH */}
      <input
        placeholder="Search size..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* LIST */}
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Size Name</th>
            <th>Size Value</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {sizes.length === 0 ? (
            <tr>
              <td colSpan="5">No sizes found</td>
            </tr>
          ) : (
            sizes.map((s) => (
              <tr key={s._id}>
                <td>{s.product?.name}</td>
                <td>{s.sizeName}</td>
                <td>{s.sizeValue}</td>
                <td>
                  <button onClick={() => toggleSize(s._id)}>
                    {s.status ? "Active" : "Inactive"}
                  </button>
                </td>
                <td>
                  <button onClick={() => deleteSize(s._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* PAGINATION */}
      <div className="flex gap-2">
        <button onClick={() => setPage((p) => Math.max(p - 1, 1))}>
          Prev
        </button>
        <button onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

export default ProductSizePage;
