import { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';

// AddSize Component
const AddSize = ({ refresh }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ name: "", code: "", category: "" });

    const handleChange = (field) => (e) => {
        setForm({ ...form, [field]: e.target.value });
    };

    const submit = async (e) => {
        e.preventDefault();
        
        if (!form.name.trim() || !form.code.trim() || !form.category.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);
        
        setTimeout(() => {
            console.log("Submitted:", form);
            toast.success("Size added successfully!");
            setIsSubmitting(false);
            setForm({ name: "", code: "", category: "" });
            if (refresh) refresh();
        }, 1000);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Add New Size</h2>
                    <p className="text-gray-600 mt-1">Fill in the details to add a new size</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Size Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Size Name
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={handleChange("name")}
                                placeholder="e.g., Medium"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 outline-none transition-all duration-200"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Size Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Code
                            </label>
                            <input
                                type="text"
                                value={form.code}
                                onChange={handleChange("code")}
                                placeholder="e.g., M"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 outline-none transition-all duration-200"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <input
                                type="text"
                                value={form.category}
                                onChange={handleChange("category")}
                                placeholder="e.g., Clothing"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 outline-none transition-all duration-200"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setForm({ name: "", code: "", category: "" })}
                            className="px-5 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                            disabled={isSubmitting}
                        >
                            Clear Form
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 flex items-center ${
                                isSubmitting
                                    ? "bg-blue-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Adding Size...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                    </svg>
                                    Add Size
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// SizeTable Component
const SizeTable = ({ sizes, toggle, remove }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Size Management</h2>
                    <p className="text-gray-600 mt-1">Manage your product sizes and categories</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {sizes.length} {sizes.length === 1 ? 'Size' : 'Sizes'}
                    </span>
                </div>
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Size Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Code
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Category
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sizes.map((s) => (
                        <tr key={s._id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-lg">
                                        <span className="text-blue-600 font-semibold">{s.code.charAt(0)}</span>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{s.name}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {s.code}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{s.category}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                    onClick={() => toggle(s._id)}
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                                        s.status
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                                    }`}
                                >
                                    <span className={`h-2 w-2 rounded-full mr-2 ${s.status ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    {s.status ? "Active" : "Inactive"}
                                </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => toggle(s._id)}
                                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors duration-200 flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                                        </svg>
                                        Toggle
                                    </button>
                                    <button
                                        onClick={() => remove(s._id)}
                                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors duration-200 flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        {sizes.length === 0 && (
            <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No sizes added yet</h3>
                <p className="mt-1 text-gray-500">Add your first size using the form above</p>
            </div>
        )}
    </div>
);

// Mock data for demonstration
const mockSizes = [
    { _id: '1', name: 'Small', code: 'S', category: 'Clothing', status: true },
    { _id: '2', name: 'Medium', code: 'M', category: 'Clothing', status: true },
    { _id: '3', name: 'Large', code: 'L', category: 'Clothing', status: false },
    { _id: '4', name: 'Extra Large', code: 'XL', category: 'Clothing', status: true },
    { _id: '5', name: '38', code: '38', category: 'Footwear', status: true },
    { _id: '6', name: '40', code: '40', category: 'Footwear', status: false },
];

// Main App Component
function App() {
    const [sizes, setSizes] = useState(mockSizes);

    const handleRefresh = () => {
        console.log("List refreshed!");
        toast.success("Size list refreshed!");
    };

    const handleToggle = (id) => {
        setSizes(sizes.map(size => 
            size._id === id ? { ...size, status: !size.status } : size
        ));
        toast.success("Status toggled!");
    };

    const handleRemove = (id) => {
        if (window.confirm('Are you sure you want to delete this size?')) {
            setSizes(sizes.filter(size => size._id !== id));
            toast.success("Size deleted!");
        }
    };

    const handleAddSize = (newSize) => {
        const sizeToAdd = {
            _id: String(Date.now()),
            ...newSize,
            status: true
        };
        setSizes([...sizes, sizeToAdd]);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                        borderRadius: '10px',
                        padding: '16px',
                    },
                    success: {
                        style: {
                            background: '#10B981',
                            color: '#fff',
                        },
                    },
                    error: {
                        style: {
                            background: '#EF4444',
                            color: '#fff',
                        },
                    },
                }}
            />
            
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Size Management Dashboard</h1>
                <p className="text-gray-600 mt-2">Manage product sizes, categories and their status</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column - Add Form */}
                <div className="lg:col-span-1">
                    <AddSize refresh={handleRefresh} onAddSize={handleAddSize} />
                    
                    {/* Stats Card */}
                    <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-blue-700">{sizes.length}</div>
                                <div className="text-sm text-blue-600">Total Sizes</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-green-700">
                                    {sizes.filter(s => s.status).length}
                                </div>
                                <div className="text-sm text-green-600">Active Sizes</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Size Table */}
                <div className="lg:col-span-2">
                    <SizeTable 
                        sizes={sizes} 
                        toggle={handleToggle} 
                        remove={handleRemove} 
                    />
                </div>
            </div>

            {/* Footer Note */}
            <div className="mt-8 text-center text-gray-500 text-sm">
                <p>Size Management System • {new Date().getFullYear()}</p>
            </div>
        </div>
    );
}

export default App;