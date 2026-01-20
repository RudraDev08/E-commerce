const URL = "http://localhost:5000/api/products";

export const getProducts = async () =>
  (await fetch(URL)).json();

/* CREATE */
export const addProduct = async (data) =>
  fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

/* UPDATE */
export const updateProduct = async (id, data) =>
  fetch(`${URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

/* DELETE */
export const deleteProduct = async (id) =>
  fetch(`${URL}/${id}`, { method: "DELETE" });
