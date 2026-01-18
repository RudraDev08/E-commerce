import slugify from 'slugify';
import Category from '../models/Category/CategorySchema.js';

export const generateUniqueSlug = async (name, excludeId = null) => {
  let slug = slugify(name, { lower: true, strict: true });
  let counter = 1;
  let uniqueSlug = slug;

  while (true) {
    const query = { slug: uniqueSlug, isDeleted: false };
    if (excludeId) query._id = { $ne: excludeId };

    const existing = await Category.findOne(query);
    if (!existing) break;

    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};