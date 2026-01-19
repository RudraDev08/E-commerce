import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBrandById, updateBrand } from "../../Api/Brands/brandApi";
import BrandForm from "../../components/Brands/BrandForm";

const EditBrand = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getBrandById(id).then((res) => setBrand(res.data.data));
  }, [id]);

  const handleUpdate = async (data) => {
    setIsSubmitting(true);
    await updateBrand(id, data);
    navigate("/brands");
  };

  const handleCancel = () => {
    navigate("/brands");
  };

  if (!brand) return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li className="h-4 w-24 bg-gray-200 rounded animate-pulse"></li>
          <li className="text-gray-400">/</li>
          <li className="h-4 w-16 bg-gray-200 rounded animate-pulse"></li>
          <li className="text-gray-400">/</li>
          <li className="h-4 w-20 bg-gray-200 rounded animate-pulse"></li>
        </ol>
      </nav>
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-4 w-56 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="p-6 space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <button
              onClick={() => navigate("/dashboard")}
              className="hover:text-gray-900 transition-colors"
            >
              Dashboard
            </button>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <button
              onClick={() => navigate("/brands")}
              className="hover:text-gray-900 transition-colors"
            >
              Brands
            </button>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">Edit Brand</li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/brands")}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:bg-white hover:shadow-sm transition-all"
              aria-label="Go back to brands"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit Brand</h1>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Editing Mode
                  </span>
                </div>
                <p className="text-gray-600 mt-1">Update brand information for {brand.name}</p>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="text-sm text-gray-500">Brand ID: </span>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">{id}</code>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Form Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Brand Details
                </h2>
                <p className="text-sm text-gray-500 mt-1">Modify the fields below to update brand information</p>
              </div>
              <div className="text-sm">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5"></span>
                  Last updated: Recently
                </span>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-700">
                  You are editing <span className="font-semibold">{brand.name}</span>. Changes will be reflected immediately upon saving.
                </p>
              </div>
            </div>
            <BrandForm initialData={brand} onSubmit={handleUpdate} />
          </div>

          {/* Form Footer */}
          <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="brand-form"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Brand
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Feedback (Visual Only) */}
        <div className="mt-6 space-y-4">
          <div className="hidden p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">Save your changes before leaving this page</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBrand;