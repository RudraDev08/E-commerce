import Size from "../../models/Size/sizeSchema.js";

/* CREATE */
export const createProductSize = async (req, res) => {
  const data = await Size.create(req.body);
  res.status(201).json({ success: true, data });
};

/* GET (SEARCH + PAGINATION) */
export const getProductSizes = async (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;

  const query = {
    sizeName: { $regex: search, $options: "i" }
  };

  const total = await Size.countDocuments(query);

  const data = await Size.find(query)
    .populate("product", "name")
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data,
    total
  });
};

/* UPDATE */
export const updateProductSize = async (req, res) => {
  const data = await Size.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json({ success: true, data });
};

/* DELETE */
export const deleteProductSize = async (req, res) => {
  await Size.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

/* TOGGLE STATUS */
export const toggleStatus = async (req, res) => {
  const item = await Size.findById(req.params.id);
  item.status = !item.status;
  await item.save();
  res.json({ success: true, data: item });
};
