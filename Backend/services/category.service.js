import Category from "../models/Category/CategorySchema.js";

export const getAll = async ({ page = 1, limit = 10, search = "", status }) => {
  const query = { isDeleted: false };

  // 🔥 SAFE STATUS FILTER
  if (status === "active" || status === "inactive") {
    query.status = status;
  }

  // 🔥 SAFE SEARCH
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Category.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean(),

    Category.countDocuments(query)
  ]);

  return {
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
