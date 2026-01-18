import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import categoryApi from '../../Api/Category/categoryApi';
import { Loader } from '../common/Loader';

const TreeNode = ({ node, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div
        className="flex items-center py-2 px-3 hover:bg-gray-50 rounded cursor-pointer"
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          <span className="mr-1 text-gray-400">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        ) : (
          <span className="mr-1 w-4" />
        )}
        
        <span className="mr-2 text-blue-600">
          {isExpanded && hasChildren ? <FolderOpen size={18} /> : <Folder size={18} />}
        </span>
        
        <span className="text-sm font-medium text-gray-700">{node.name}</span>
        
        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
          node.status === 'Active' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {node.status}
        </span>
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child._id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryTree = () => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    try {
      const { data } = await categoryApi.getTree();
      setTree(data.data);
    } catch (error) {
      console.error('Failed to fetch category tree:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Loading category tree..." />;
  }

  if (tree.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No categories available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Hierarchy</h3>
      <div className="border rounded-lg p-2">
        {tree.map((node) => (
          <TreeNode key={node._id} node={node} />
        ))}
      </div>
    </div>
  );
};