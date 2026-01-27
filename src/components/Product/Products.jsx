import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ProductCard from '../../components/Product/ProductCard';
import ProductTable from '../../components/Product/ProductTable';
import ProductFilters from '../../components/Product/ProductFilters';
import ProductSelectionBar from '../../components/Product/ProductSelectionBar';
import AddProductModal from '../../components/Product/AddProduct';
import productApi from '../../Api/Product/productApi';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  const [filterOptions, setFilterOptions] = useState({ categories: [], brands: [] });
  const [filters, setFilters] = useState({
    search: '', category: 'all', brand: 'all', stockStatus: 'all', sort: 'newest'
  });

  // --- API: Fetch Products ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const activeFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] !== 'all' && filters[key] !== '') activeFilters[key] = filters[key];
      });

      const response = await productApi.getAll(activeFilters);
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [filters]);

  // --- API: Bulk/Single Delete ---
  const handleDelete = async (ids) => {
    const idArray = Array.isArray(ids) ? ids : [ids];

    try {
      if (idArray.length === 1) {
        await productApi.delete(idArray[0]);
      } else {
        await productApi.bulkDelete(idArray);
      }

      toast.success("Products moved to trash");
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  // --- Handlers: Edit & Modal ---
  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const handleAddToCart = () => {
    if (selectedProducts.length === 0) return;
    toast.success(`${selectedProducts.length} assets moved to processing`);
  };

  const calculateTotalPrice = () => {
    return products
      .filter(p => selectedProducts.includes(p._id))
      .reduce((sum, p) => sum + (p.price || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Product Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 uppercase text-xs tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Register Asset
        </button>
      </div>

      <ProductFilters
        filters={filters}
        onFilterChange={(n, v) => setFilters(prev => ({ ...prev, [n]: v }))}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="my-6 relative z-40">
        <ProductSelectionBar
          selectedCount={selectedProducts.length}
          totalPrice={calculateTotalPrice()}
          onClearSelection={() => setSelectedProducts([])}
          onBulkAction={(action) => action === 'delete' && handleDelete(selectedProducts)}
          onEdit={() => {
            const target = products.find(p => p._id === selectedProducts[0]);
            if (target) handleEdit(target);
          }}
          onAddToCart={handleAddToCart}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Syncing Vault...</p>
          </div>
        ) : (
          <div className="p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map(p => (
                  <ProductCard key={p._id} product={p} isSelected={selectedProducts.includes(p._id)} onSelect={(id) => setSelectedProducts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            ) : (
              <ProductTable products={products} selectedProducts={selectedProducts} onSelect={(id) => setSelectedProducts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} onEdit={handleEdit} onDelete={handleDelete} />
            )}
          </div>
        )}
      </div>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        initialData={editingProduct}
        onProductAdded={fetchProducts}
      />
    </div>
  );
};

export default Products;