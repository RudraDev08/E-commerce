import Attribute from "../../models/attribute/attributeSchema.js";

export const createAttribute = async (req, res) => {
  const attr = await Attribute.create(req.body);
  res.json(attr);
};

export const getAttributes = async (req, res) => {
  const attrs = await Attribute.find();
  res.json(attrs);
};
