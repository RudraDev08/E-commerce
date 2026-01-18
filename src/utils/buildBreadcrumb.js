/**
 * Build breadcrumb trail from a tree structure
 */
export const buildBreadcrumbFromTree = (tree, targetId, breadcrumb = []) => {
  for (const node of tree) {
    const currentPath = [...breadcrumb, { id: node._id, name: node.name }];
    
    if (node._id === targetId) {
      return currentPath;
    }
    
    if (node.children && node.children.length > 0) {
      const result = buildBreadcrumbFromTree(node.children, targetId, currentPath);
      if (result) return result;
    }
  }
  
  return null;
};

/**
 * Flatten a hierarchical tree into a flat array with level information
 */
export const flattenTree = (tree, level = 0, result = []) => {
  if (!tree || !Array.isArray(tree)) {
    return result;
  }
  
  tree.forEach(node => {
    // Add the node with its level
    result.push({ ...node, level });
    
    // Recursively flatten children
    if (node.children && node.children.length > 0) {
      flattenTree(node.children, level + 1, result);
    }
  });
  
  return result;
};

/**
 * Find a specific node in the tree by ID
 */
export const findNodeInTree = (tree, targetId) => {
  if (!tree || !Array.isArray(tree)) {
    return null;
  }
  
  for (const node of tree) {
    if (node._id === targetId) return node;
    
    if (node.children && node.children.length > 0) {
      const found = findNodeInTree(node.children, targetId);
      if (found) return found;
    }
  }
  
  return null;
};