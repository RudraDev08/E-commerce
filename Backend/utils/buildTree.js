export const buildTree = (items, parentId = null) => {
  return items
    .filter(item =>
      parentId === null
        ? item.parentId === null
        : String(item.parentId) === String(parentId)
    )
    .map(item => ({
      ...item,
      children: buildTree(items, item._id)
    }));
};
