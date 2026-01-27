import React from 'react';

const ProductTable = ({ products, selectedProducts, onSelect, onSelectAll, onEdit, onDelete }) => {
  const allSelected = products.length > 0 && products.every(p => selectedProducts.includes(p._id));

  // Helper to format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              {/* Checkbox Header */}
              <th className="w-12 px-6 py-4">
                <div className="flex items-center justify-center">
                  <div className={`
                    relative flex items-center justify-center w-5 h-5 border-2 rounded-md transition-all
                    ${allSelected ? 'bg-slate-900 border-slate-900 shadow-sm' : 'bg-white border-slate-300 hover:border-slate-400'}
                  `}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onSelectAll}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    {allSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </th>

              {/* Data Headers */}
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Identity</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Classification</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Brand</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Price</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Inventory</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {products.map(product => {
              const isSelected = selectedProducts.includes(product._id);
              const imageUrl = product.image
                ? `http://localhost:5000/uploads/${product.image.split(/[/\\]/).pop()}`
                : null;

              return (
                <tr
                  key={product._id}
                  className={`
                    group h-[72px] transition-colors
                    ${isSelected ? 'bg-slate-50/80' : 'hover:bg-slate-50/40'}
                  `}
                >
                  {/* Row Checkbox */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <div className={`
                        relative flex items-center justify-center w-5 h-5 border-2 rounded-md transition-all
                        ${isSelected ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200 group-hover:border-slate-400'}
                        cursor-pointer
                      `}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelect(product._id)}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Identity (Image + Name + SKU) */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 truncate max-w-[180px]">{product.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 font-medium">SKU: {product.sku || 'N/A'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Classification */}
                  <td className="px-4 py-4">
                    <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-md tracking-wider">
                      {product.category?.name || 'Uncategorized'}
                    </span>
                  </td>

                  {/* Brand */}
                  <td className="px-4 py-4">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      {product.brand?.name || 'No Brand'}
                    </span>
                  </td>

                  {/* Valuation */}
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-black text-slate-900">{formatPrice(product.price)}</span>
                  </td>

                  {/* Inventory */}
                  <td className="px-4 py-4 text-center">
                    {product.hasVariants ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-wider">
                        Variants
                      </span>
                    ) : (
                      <div className={`
                        inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider
                        ${product.stock > 10 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          product.stock > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-rose-50 text-rose-600 border-rose-100'}
                        `}>
                        {product.stock} Units
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 text-center">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                        ${product.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}
                    `}>
                      <div className={`w-1.5 h-1.5 rounded-full ${product.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {product.status}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(product)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button onClick={() => onDelete(product._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;