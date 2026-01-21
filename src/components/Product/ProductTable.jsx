import React from 'react';

const ProductTable = ({ products, selectedProducts, onSelect, onSelectAll, onEdit, onDelete }) => {
  const allSelected = products.length > 0 && 
    products.every(p => selectedProducts.includes(p._id) || p.stock === 0);
  
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
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Valuation</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Inventory</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100">
            {products.map(product => {
              const disabled = product.stock === 0;
              const isSelected = selectedProducts.includes(product._id);
              
              return (
                <tr 
                  key={product._id} 
                  className={`
                    group h-[72px] transition-colors
                    ${isSelected ? 'bg-slate-50/80' : 'hover:bg-slate-50/40'}
                    ${disabled ? 'bg-slate-50/20' : ''}
                  `}
                >
                  {/* Row Checkbox */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <div className={`
                        relative flex items-center justify-center w-5 h-5 border-2 rounded-md transition-all
                        ${isSelected ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200 group-hover:border-slate-400'}
                        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                      `}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelect(product._id)}
                          disabled={disabled}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                        />
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Identity (Image + Name) */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt="" className="w-10 h-10 object-contain p-1" />
                        ) : (
                          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 truncate max-w-[180px] uppercase tracking-tight">{product.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">ID: {product._id?.slice(-6)}</span>
                      </div>
                    </div>
                  </td>

                  {/* Classification */}
                  <td className="px-4 py-4">
                    <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{product.category}</span>
                  </td>

                  {/* Brand */}
                  <td className="px-4 py-4">
                    <span className="text-xs font-bold text-slate-600">{product.brand}</span>
                  </td>

                  {/* Valuation */}
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-black text-slate-900">${product.price.toLocaleString()}</span>
                  </td>

                  {/* Inventory */}
                  <td className="px-4 py-4 text-center">
                    <div className={`
                      inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border
                      ${product.stock > 10 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        product.stock > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-rose-50 text-rose-600 border-rose-100'}
                    `}>
                      {product.stock} Units
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 text-center">
                    <div className={`w-2 h-2 rounded-full mx-auto ${product.status === 'active' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(product)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button onClick={() => onDelete(product._id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
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