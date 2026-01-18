export const buildTree = (categories, parentId = null) => {
  const tree = [];

  categories
    .filter(cat => {
      const parent = cat.parentId?._id || cat.parentId;
      return (parentId === null && !parent) || (parent && parent.toString() === parentId.toString());
    })
    .forEach(cat => {
      const node = {
        ...cat.toObject(),
        children: buildTree(categories, cat._id)
      };
      tree.push(node);
    });

  return tree;
};

export const buildBreadcrumb = async (Category, categoryId) => {
  const breadcrumb = [];
  let current = await Category.findById(categoryId);

  while (current) {
    breadcrumb.unshift({
      id: current._id,
      name: current.name,
      slug: current.slug
    });

    if (current.parentId) {
      current = await Category.findById(current.parentId);
    } else {
      break;
    }
  }

  return breadcrumb;
};