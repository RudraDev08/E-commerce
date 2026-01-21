import Variant from "../../models/variant/variantSchema.js";

export const createVariants = async (req, res) => {
  const { productId, variants } = req.body;

  const data = variants.map(v => ({
    ...v,
    product: productId
  }));

  const saved = await Variant.insertMany(data);
  res.json(saved);
};

export const getVariantsByProduct = async (req, res) => {
  const variants = await Variant.find({
    product: req.params.productId
  });
  res.json(variants);
};
