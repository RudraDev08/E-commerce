import { useState, useEffect } from 'react';
import categoryApi from '../../Api/Category/categoryApi';
import { flattenTree } from '../../utils/buildBreadcrumb';

export const CategorySelect = ({ 
  value, 
  onChange, 
  excludeId = null,
  placeholder = 'Select parent category',
  showBreadcrumb = true 
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await categoryApi.getTree();
      const flattened = flattenTree(data.data);
      
      // Filter out the current category and its descendants
      const filtered = excludeId 
        ? flattened.filter(cat => !isDescendant(cat._id, excludeId, flattened))
        : flattened;
      
      setCategories(filtered);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDescendant = (catId, ancestorId, allCats) => {
    if (catId === ancestorId) return true;
    
    const cat = allCats.find(c => c._id === catId);
    if (!cat || !cat.parentId) return false;
    
    return isDescendant(cat.parentId, ancestorId, allCats);
  };

  const getBreadcrumb = (category) => {
    const breadcrumb = [category.name];
    let current = category;
    
    while (current.parentId) {
      const parent = categories.find(c => c._id === current.parentId);
      if (!parent) break;
      breadcrumb.unshift(parent.name);
      current = parent;
    }
    
    return breadcrumb.join(' > ');
  };

  if (loading) {
    return (
      <select disabled className="w-full p-2 border rounded-lg bg-gray-50">
        <option>Loading categories...</option>
      </select>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">{placeholder}</option>
      {categories.map((category) => (
        <option key={category._id} value={category._id}>
          {'  '.repeat(category.level)}
          {showBreadcrumb ? getBreadcrumb(category) : category.name}
        </option>
      ))}
    </select>
  );
};