import React, { useState } from 'react';

const ProductTableRow = ({ product, isSelected, onSelect, onEdit, onDelete }) => {
  const [imgError, setImgError] = useState(false);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const filename = imagePath.split(/[/\\]/).pop();
    return `http://localhost:5000/uploads/${filename}`;
  };

  const imageUrl = getImageUrl(product.image);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);
  };

  return (
    <tr
      className={`
        group h-[72px] transition-all duration-200
        ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}
        border-b last:border-b-0 border-slate-100
      `}
    >
      {/* Row Checkbox */}
      <td className="px-6 py-4">
        <label className="flex items-center justify-center cursor-pointer">
          <div className={`
            relative flex items-center justify-center w-5 h-5 border-2 rounded-lg transition-all duration-200
            ${isSelected
              ? 'bg-indigo-600 border-indigo-600 shadow-sm shadow-indigo-200'
              : 'bg-white border-slate-300 group-hover:border-indigo-300'
            }
          `}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(product._id)}
              className="hidden"
            />
            {isSelected && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </label>
      </td>

      {/* Identity (Image + Name + SKU) */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden relative group-hover:border-indigo-100 transition-colors">
            {imageUrl && !imgError ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-contain p-1 mix-blend-multiply"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 truncate max-w-[200px] group-hover:text-indigo-600 transition-colors">
              {product.name}
            </span>
            <span className="text-[11px] font-mono text-slate-400 font-medium tracking-wide">
              {product.sku || 'N/A'}
            </span>
          </div>
        </div>
      </td>

      {/* Classification */}
      <td className="px-4 py-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          {product.category?.name || 'Uncategorized'}
        </span>
      </td>

      {/* Brand */}
      <td className="px-4 py-4">
        <span className="text-xs font-semibold text-slate-600">
          {product.brand?.name || '—'}
        </span>
      </td>

      {/* Valuation */}
      <td className="px-4 py-4 text-right">
        <div className="flex flex-col items-end">
          <span className="text-sm font-bold text-slate-900">{formatPrice(product.price)}</span>
          {product.basePrice > product.price && (
            <span className="text-[10px] text-slate-400 line-through">{formatPrice(product.basePrice)}</span>
          )}
        </div>
      </td>

      {/* Inventory */}
      <td className="px-4 py-4 text-center">
        {product.hasVariants ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-wide">
            Variants
          </span>
        ) : (
          <div className={`
            inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider
            ${product.stock > 10
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : product.stock > 0
                ? 'bg-amber-50 text-amber-600 border-amber-100'
                : 'bg-rose-50 text-rose-600 border-rose-100'
            }
          `}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
              ${product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'}
             `}></span>
            {product.stock > 0 ? `${product.stock} Units` : 'Out of Stock'}
          </div>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-4 text-center">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
            ${product.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}
        `}>
          <div className={`w-1.5 h-1.5 rounded-full ${product.status === 'active' ? 'bg-blue-500' : 'bg-slate-400'}`} />
          {product.status}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <button
            onClick={() => onEdit(product)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit Asset"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(product._id)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Move to Trash"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

const ProductTable = ({ products, selectedProducts, onSelect, onSelectAll, onEdit, onDelete }) => {
  const allSelected = products.length > 0 && products.every(p => selectedProducts.includes(p._id));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {/* Checkbox Header */}
              <th className="w-16 px-6 py-4">
                <label className="flex items-center justify-center cursor-pointer">
                  <div className={`
                    relative flex items-center justify-center w-5 h-5 border-2 rounded-lg transition-all
                    ${allSelected ? 'bg-indigo-600 border-indigo-600 shadow-sm' : 'bg-white border-slate-300 hover:border-slate-400'}
                  `}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onSelectAll}
                      className="hidden"
                    />
                    {allSelected && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </label>
              </th>

              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Asset Identity</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Class</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Brand</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 text-right">Value</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 text-center">Stock</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {products.length > 0 ? (
              products.map(product => (
                <ProductTableRow
                  key={product._id}
                  product={product}
                  isSelected={selectedProducts.includes(product._id)}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm font-bold text-slate-400">No Assets Found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;