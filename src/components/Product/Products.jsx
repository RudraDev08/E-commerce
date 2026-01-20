import React, { useState, useEffect } from 'react';
import ProductCard from '../../components/Product/ProductCard';
import ProductTable from '../../components/Product/ProductTable';
import ProductFilters from '../../components/Product/ProductFilters';
import ProductSelectionBar from '../../components/Product/ProductSelectionBar';
import AddProductModal from '../../components/Product/AddProduct';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    brands: []
  });
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    brand: 'all',
    stockStatus: 'all',
    sort: 'newest'
  });
  const [loading, setLoading] = useState(false);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // ✅ FIX: Clean filters so we don't send "all" strings to the backend
      const activeFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] !== 'all' && filters[key] !== '') {
          activeFilters[key] = filters[key];
        }
      });

      const queryParams = new URLSearchParams(activeFilters).toString();
      const response = await fetch(`http://localhost:5000/api/products?${queryParams}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products/filter-options');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setFilterOptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Handle product selection
  const handleProductSelect = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    const selectableProducts = products.filter(p => p.stock > 0);
    
    if (selectedProducts.length === selectableProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(selectableProducts.map(p => p._id));
    }
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    return products
      .filter(p => selectedProducts.includes(p._id))
      .reduce((sum, p) => sum + p.price, 0);
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) return;
    
    try {
      let endpoint = '';
      let body = {};
      
      if (action === 'delete') {
        if (!window.confirm('Are you sure you want to delete selected products?')) return;
        endpoint = 'http://localhost:5000/api/products/bulk/delete';
        body = { productIds: selectedProducts };
      } else if (action === 'activate' || action === 'deactivate') {
        endpoint = 'http://localhost:5000/api/products/bulk/update';
        body = {
          productIds: selectedProducts,
          updates: { status: action === 'activate' ? 'active' : 'inactive' }
        };
      }
      
      const response = await fetch(endpoint, {
        method: action === 'delete' ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        fetchProducts();
        setSelectedProducts([]);
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleAddToCart = () => {
    const selectedProductData = products.filter(p => selectedProducts.includes(p._id));
    alert(`${selectedProducts.length} products added to cart!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 md:mb-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Product Management</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1">Manage your product inventory catalog</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-4 md:mt-6">
              <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                <span className="text-xs font-medium text-blue-700 block">Total Products</span>
                <span className="text-xl font-bold text-gray-900">{products.length}</span>
              </div>
              <div className="bg-green-50 rounded-xl px-4 py-3 border border-green-100">
                <span className="text-xs font-medium text-green-700 block">In Stock</span>
                <span className="text-xl font-bold text-gray-900">{products.filter(p => p.stock > 0).length}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2.5 justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Product
          </button>
        </div>
      </div>

      <ProductFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={filterOptions.categories}
        brands={filterOptions.brands}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="my-6 relative z-40">
        <ProductSelectionBar
          selectedCount={selectedProducts.length}
          totalPrice={calculateTotalPrice()}
          onClearSelection={() => setSelectedProducts([])}
          onBulkAction={handleBulkAction}
          onAddToCart={handleAddToCart}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-6"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Products</h3>
            <p className="text-sm text-gray-600">Fetching inventory from the vault...</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {products.map(product => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      isSelected={selectedProducts.includes(product._id)}
                      onSelect={handleProductSelect}
                      disabled={product.stock === 0}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 md:p-6">
                <ProductTable
                  products={products}
                  selectedProducts={selectedProducts}
                  onSelect={handleProductSelect}
                  onSelectAll={handleSelectAll}
                />
              </div>
            )}
          </>
        )}

        {products.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
               <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600 mb-6 max-w-md">Try adjusting your filters or add new products.</p>
          </div>
        )}
      </div>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductAdded={() => {
          fetchProducts();
          fetchFilterOptions();
        }}
      />
    </div>
  );
};

export default Products;