import React from 'react';

const ProductTable = ({ products, selectedProducts, onSelect, onSelectAll }) => {
  const allSelected = products.length > 0 && 
    products.every(p => selectedProducts.includes(p._id) || p.stock === 0);
  
  return (
    // UI ENHANCEMENT: Improved container with better shadows and overflow
    <div className="
      bg-white 
      border border-gray-200 
      rounded-xl 
      shadow-sm 
      overflow-hidden 
      overflow-x-auto
      hover:shadow-md 
      transition-shadow duration-300
    ">
      <table className="w-full min-w-[800px]">
        {/* UI ENHANCEMENT: Sticky header with improved visual hierarchy */}
        <thead className="
          bg-gradient-to-r from-gray-50 to-gray-100 
          border-b border-gray-300
          sticky top-0 
          z-10
          shadow-sm
        ">
          <tr>
            {/* UI ENHANCEMENT: Enhanced checkbox header with better alignment */}
            <th className="px-6 py-4 text-left">
              <div className="flex items-center">
                <div className={`
                  flex items-center justify-center
                  w-5 h-5
                  border-2 rounded
                  transition-colors duration-200
                  ${allSelected 
                    ? 'bg-gray-900 border-gray-900' 
                    : 'bg-white border-gray-300 hover:border-gray-900'
                  }
                  cursor-pointer
                `}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="
                      absolute 
                      w-full h-full 
                      opacity-0 
                      cursor-pointer
                    "
                  />
                  {allSelected && (
                    <svg 
                      className="w-3 h-3 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </th>
            
            {/* UI ENHANCEMENT: Enhanced header cells with better typography and spacing */}
            <th className="px-6 py-4 text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Image
              </div>
            </th>
            <th className="px-6 py-4 text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Product
              </div>
            </th>
            <th className="px-6 py-4 text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Category
              </div>
            </th>
            <th className="px-6 py-4 text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Brand
              </div>
            </th>
            <th className="px-6 py-4 text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Price
              </div>
            </th>
            <th className="px-6 py-4 text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Stock
              </div>
            </th>
            <th className="px-6 py-4 text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </div>
            </th>
          </tr>
        </thead>
        
        <tbody>
          {products.map(product => {
            const disabled = product.stock === 0;
            const isSelected = selectedProducts.includes(product._id);
            
            return (
              // UI ENHANCEMENT: Enhanced row styling with better hover and selected states
              <tr 
                key={product._id} 
                className={`
                  border-b border-gray-100 
                  transition-all duration-200
                  hover:bg-gray-50/80
                  ${isSelected ? 'bg-blue-50/50 hover:bg-blue-50/70' : ''}
                  ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                  ${isSelected && disabled ? 'bg-blue-100/30' : ''}
                `}
              >
                {/* UI ENHANCEMENT: Enhanced checkbox cell */}
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className={`
                      flex items-center justify-center
                      w-5 h-5
                      border-2 rounded
                      transition-colors duration-200
                      ${isSelected 
                        ? 'bg-gray-900 border-gray-900' 
                        : 'bg-white border-gray-300 hover:border-gray-900'
                      }
                      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(product._id)}
                        disabled={disabled}
                        className="
                          absolute 
                          w-full h-full 
                          opacity-0 
                          cursor-pointer
                          disabled:cursor-not-allowed
                        "
                      />
                      {isSelected && (
                        <svg 
                          className="w-3 h-3 text-white" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </td>
                
                {/* UI ENHANCEMENT: Improved image thumbnail */}
                <td className="px-6 py-4">
                  <div className="
                    relative
                    w-14 h-14 
                    bg-gradient-to-br from-gray-50 to-gray-100 
                    rounded-lg 
                    overflow-hidden
                    border border-gray-200
                    flex items-center justify-center
                  ">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="
                          w-full h-full 
                          object-contain 
                          p-1.5
                        "
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling && e.target.nextSibling.style) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </td>
                
                {/* UI ENHANCEMENT: Better product name styling */}
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <span className="
                      text-sm font-medium text-gray-900 
                      line-clamp-1
                    ">
                      {product.name}
                    </span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="
                        w-2 h-2 
                        rounded-full 
                        ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}
                      "></div>
                      <span className="text-xs text-gray-500">
                        ID: {product._id?.slice(-6) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </td>
                
                {/* UI ENHANCEMENT: Better category styling */}
                <td className="px-6 py-4">
                  <span className="
                    text-sm font-medium text-gray-700 
                    bg-gray-50 
                    px-3 py-1 
                    rounded-md
                    inline-block
                  ">
                    {product.category}
                  </span>
                </td>
                
                {/* UI ENHANCEMENT: Better brand styling */}
                <td className="px-6 py-4">
                  <span className="
                    text-sm font-medium text-gray-700
                  ">
                    {product.brand}
                  </span>
                </td>
                
                {/* UI ENHANCEMENT: Better price styling */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="
                      text-sm font-bold text-gray-900
                    ">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.price > 100 && (
                      <span className="text-xs text-gray-500 mt-0.5">
                        Premium
                      </span>
                    )}
                  </div>
                </td>
                
                {/* UI ENHANCEMENT: Enhanced stock badge */}
                <td className="px-6 py-4">
                  <div className={`
                    inline-flex 
                    items-center 
                    px-3 py-1.5 
                    rounded-full 
                    text-xs 
                    font-semibold 
                    min-w-[70px]
                    justify-center
                    transition-all duration-200
                    ${product.stock > 0 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                    }
                    ${product.stock > 0 && product.stock < 10 
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' 
                      : ''
                    }
                  `}>
                    {product.stock > 0 ? (
                      <>
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${product.stock < 10 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                        {product.stock < 10 ? `${product.stock} left` : product.stock}
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full mr-2 bg-red-500"></div>
                        Out
                      </>
                    )}
                  </div>
                </td>
                
                {/* UI ENHANCEMENT: Enhanced status badge */}
                <td className="px-6 py-4">
                  <div className={`
                    inline-flex 
                    items-center 
                    px-3 py-1.5 
                    rounded-full 
                    text-xs 
                    font-semibold 
                    uppercase 
                    tracking-wide
                    min-w-[80px]
                    justify-center
                    transition-all duration-200
                    ${product.status === 'active' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'bg-gray-50 text-gray-700 border border-gray-200'
                    }
                  `}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${product.status === 'active' ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                    {product.status}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* UI ENHANCEMENT: Empty state (if needed, logic unchanged) */}
      {products.length === 0 && (
        <div className="
          flex flex-col 
          items-center justify-center 
          py-12 px-4
          text-center
        ">
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            No products match your current filters. Try adjusting your search or add new products.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductTable;