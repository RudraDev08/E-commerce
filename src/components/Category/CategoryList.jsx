import { useState } from 'react';
import CategoryList from './CategoryList';

const initialCategories = [
  { _id: '1', name: 'Electronics' },
  { _id: '2', name: 'Home & Garden' },
  { _id: '3', name: 'Fashion' },
  { _id: '4', name: 'Books' },
];

export default function App() {
  const [categories, setCategories] = useState(initialCategories);

  const handleDelete = (id) => {
    // Filter out the category with the matching ID
    setCategories(categories.filter(category => category._id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Product Categories</h1>
      
      {categories.length > 0 ? (
        <CategoryList data={categories} onDelete={handleDelete} />
      ) : (
        <p className="text-gray-500">No categories left.</p>
      )}
    </div>
  );
}