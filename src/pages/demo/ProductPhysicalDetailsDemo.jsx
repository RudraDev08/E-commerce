import { useState } from 'react';
import ProductPhysicalDetailsForm from '../../components/products/ProductPhysicalDetailsForm';
import toast from 'react-hot-toast';

/**
 * Demo Page for ProductPhysicalDetailsForm
 * 
 * Shows the component in action with state management
 */

const ProductPhysicalDetailsDemo = () => {
    const [formData, setFormData] = useState({
        dimensions: {
            thickness: '',
            width: '',
            height: '',
            unit: 'mm'
        },
        weight: {
            value: '',
            unit: 'g'
        },
        formFactor: '',
        build: {
            frontMaterial: '',
            backMaterial: '',
            frameMaterial: '',
            hingeType: '',
            waterResistance: ''
        },
        tags: []
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        toast.success('Form data captured (Check debug panel below)');
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Product Physical Details
                    </h1>
                    <p className="text-slate-600">
                        Manage physical specifications, build quality, and product tags
                    </p>
                </div>

                {/* Form Component */}
                <ProductPhysicalDetailsForm
                    formData={formData}
                    onChange={handleChange}
                />

                {/* Action Buttons */}
                <div className="mt-8 flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => setFormData({
                            dimensions: { thickness: '', width: '', height: '', unit: 'mm' },
                            weight: { value: '', unit: 'g' },
                            formFactor: '',
                            build: { frontMaterial: '', backMaterial: '', frameMaterial: '', hingeType: '', waterResistance: '' },
                            tags: []
                        })}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        Save Changes
                    </button>
                </div>

                {/* Debug Panel */}
                <div className="mt-8 bg-slate-900 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-slate-400 mb-3">Current Form State</h3>
                    <pre className="text-xs text-emerald-400 font-mono overflow-x-auto">
                        {JSON.stringify(formData, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default ProductPhysicalDetailsDemo;
