import { useState } from 'react';
import CategorySelector from '../components/category/CategorySelector';

// Sample hierarchical category data
const sampleCategories = [
    {
        _id: '1',
        name: 'Electronics',
        productCount: 145,
        children: [
            {
                _id: '1-1',
                name: 'Mobile Phones',
                productCount: 45,
                children: [
                    { _id: '1-1-1', name: 'Smartphones', productCount: 32 },
                    { _id: '1-1-2', name: 'Feature Phones', productCount: 13 }
                ]
            },
            {
                _id: '1-2',
                name: 'Laptops',
                productCount: 58,
                children: [
                    { _id: '1-2-1', name: 'Gaming Laptops', productCount: 24 },
                    { _id: '1-2-2', name: 'Business Laptops', productCount: 34 }
                ]
            },
            { _id: '1-3', name: 'Accessories', productCount: 42 }
        ]
    },
    {
        _id: '2',
        name: 'Fashion',
        productCount: 289,
        children: [
            {
                _id: '2-1',
                name: "Men's Clothing",
                productCount: 134,
                children: [
                    { _id: '2-1-1', name: 'Shirts', productCount: 45 },
                    { _id: '2-1-2', name: 'Pants', productCount: 38 },
                    { _id: '2-1-3', name: 'Jackets', productCount: 51 }
                ]
            },
            {
                _id: '2-2',
                name: "Women's Clothing",
                productCount: 155,
                children: [
                    { _id: '2-2-1', name: 'Dresses', productCount: 62 },
                    { _id: '2-2-2', name: 'Tops', productCount: 48 },
                    { _id: '2-2-3', name: 'Skirts', productCount: 45 }
                ]
            }
        ]
    },
    {
        _id: '3',
        name: 'Home & Kitchen',
        productCount: 178,
        children: [
            { _id: '3-1', name: 'Furniture', productCount: 67 },
            { _id: '3-2', name: 'Kitchen Appliances', productCount: 54 },
            { _id: '3-3', name: 'Home Decor', productCount: 57 }
        ]
    },
    {
        _id: '4',
        name: 'Sports & Outdoors',
        productCount: 92,
        children: [
            { _id: '4-1', name: 'Fitness Equipment', productCount: 34 },
            { _id: '4-2', name: 'Outdoor Gear', productCount: 28 },
            { _id: '4-3', name: 'Sports Accessories', productCount: 30 }
        ]
    }
];

const CategorySelectorDemo = () => {
    const [singleSelected, setSingleSelected] = useState([]);
    const [multiSelected, setMultiSelected] = useState([]);

    return (
        <div className="min-h-screen bg-slate-50 px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Category Selector</h1>
                    <p className="mt-2 text-slate-600">
                        Premium category selection component with hierarchical tree view
                    </p>
                </div>

                {/* Single Select Example */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Single Select Mode</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Select one category at a time
                        </p>
                    </div>

                    <CategorySelector
                        categories={sampleCategories}
                        selectedCategories={singleSelected}
                        onChange={setSingleSelected}
                        mode="single"
                        placeholder="Select a category..."
                        showCount={true}
                    />

                    {singleSelected.length > 0 && (
                        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                            <p className="text-sm font-semibold text-indigo-900">Selected:</p>
                            <p className="text-sm text-indigo-700 mt-1">
                                {singleSelected[0].name}
                            </p>
                        </div>
                    )}
                </div>

                {/* Multi Select Example */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Multi Select Mode</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Select multiple categories with checkboxes
                        </p>
                    </div>

                    <CategorySelector
                        categories={sampleCategories}
                        selectedCategories={multiSelected}
                        onChange={setMultiSelected}
                        mode="multi"
                        placeholder="Select categories..."
                        showCount={true}
                    />

                    {multiSelected.length > 0 && (
                        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                            <p className="text-sm font-semibold text-indigo-900 mb-2">
                                Selected ({multiSelected.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {multiSelected.map(cat => (
                                    <span
                                        key={cat._id}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"
                                    >
                                        {cat.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Loading State Example */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Loading State</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Shows loading spinner while fetching data
                        </p>
                    </div>

                    <CategorySelector
                        categories={[]}
                        selectedCategories={[]}
                        onChange={() => { }}
                        loading={true}
                        placeholder="Loading categories..."
                    />
                </div>

                {/* Empty State Example */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Empty State</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Shows when no categories are available
                        </p>
                    </div>

                    <CategorySelector
                        categories={[]}
                        selectedCategories={[]}
                        onChange={() => { }}
                        placeholder="No categories available"
                    />
                </div>

                {/* Disabled State Example */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Disabled State</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Selector is disabled and not interactive
                        </p>
                    </div>

                    <CategorySelector
                        categories={sampleCategories}
                        selectedCategories={[]}
                        onChange={() => { }}
                        disabled={true}
                        placeholder="Disabled selector"
                    />
                </div>

                {/* Features List */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Features</h2>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-600">✓</span>
                            <span>Single and multi-select modes</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-600">✓</span>
                            <span>Hierarchical category tree with expand/collapse</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-600">✓</span>
                            <span>Real-time search filtering</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-600">✓</span>
                            <span>Product count display</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-600">✓</span>
                            <span>Loading, empty, and error states</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-600">✓</span>
                            <span>Click outside to close</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-600">✓</span>
                            <span>Clear selection button</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-600">✓</span>
                            <span>Disabled state support</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-600">✓</span>
                            <span>Responsive and touch-friendly</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-600">✓</span>
                            <span>Premium admin panel styling</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CategorySelectorDemo;
