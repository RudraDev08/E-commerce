import ProductType from "../../models/ProductType/productTypeSchema.js";

export const createProductType = async (req, res) => {
  const type = await ProductType.create(req.body);
  res.json(type);
};

export const getProductType = async (req, res) => {
  const type = await ProductType
    .findById(req.params.id)
    .populate("attributes");
  res.json(type);
};
