import React from 'react';

const ProductCard = ({ product, isSelected, onSelect, disabled }) => {
  return (
    <div 
      className={`
        relative
        bg-white 
        border 
        rounded-xl 
        overflow-hidden
        transition-all 
        duration-300 
        hover:shadow-lg 
        hover:border-gray-300
        hover:-translate-y-1
        ${isSelected ? 'border-gray-900 ring-2 ring-gray-900 ring-opacity-20' : 'border-gray-200'}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* UI ENHANCEMENT: Improved checkbox positioning and styling */}
      <div className="absolute top-3 left-3 z-10">
        <div className={`
          flex items-center justify-center
          w-5 h-5
          border-2 rounded
          transition-colors duration-200
          ${isSelected 
            ? 'bg-gray-900 border-gray-900' 
            : 'bg-white border-gray-300 hover:border-gray-900'
          }
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
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
      
      {/* UI ENHANCEMENT: Enhanced image container with fallback and hover effects */}
      <div className="relative w-full h-56 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <div className="
          absolute inset-0 
          flex items-center justify-center
          bg-gradient-to-br from-gray-50 to-gray-100
        ">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name}
              className="
                w-full h-full
                object-contain
                p-3
                transition-transform duration-500
                group-hover:scale-105
              "
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling && e.target.nextSibling.style) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium">No Image</span>
            </div>
          )}
        </div>
        
        {/* UI ENHANCEMENT: Gradient overlay for better text readability on images */}
        <div className="
          absolute bottom-0 left-0 right-0 
          h-16 
          bg-gradient-to-t from-white via-white/90 to-transparent
          pointer-events-none
        "></div>
      </div>
      
      {/* UI ENHANCEMENT: Enhanced content area with better spacing and typography */}
      <div className="p-4">
        {/* UI ENHANCEMENT: Product name with better hierarchy */}
        <h3 className="
          text-base 
          font-semibold 
          text-gray-900 
          mb-2
          line-clamp-1
          tracking-tight
        ">
          {product.name}
        </h3>
        
        {/* UI ENHANCEMENT: Improved meta information layout */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-sm font-medium text-gray-600">{product.category}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-600">{product.brand}</span>
          </div>
        </div>
        
        {/* UI ENHANCEMENT: Enhanced price and stock section */}
        <div className="
          flex 
          justify-between 
          items-center 
          pt-4 
          border-t 
          border-gray-100
        ">
          {/* UI ENHANCEMENT: Price with premium styling */}
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500 mb-0.5">Price</span>
            <span className="
              text-lg 
              font-bold 
              text-gray-900
              tracking-tight
            ">
              ${product.price.toFixed(2)}
            </span>
          </div>
          
          {/* UI ENHANCEMENT: Improved stock badge */}
          <div className={`
            inline-flex 
            items-center 
            px-3 
            py-1.5 
            rounded-full 
            text-xs 
            font-semibold 
            tracking-wide
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
                {product.stock < 10 ? `${product.stock} left` : `${product.stock} in stock`}
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full mr-2 bg-red-500"></div>
                Out of stock
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* UI ENHANCEMENT: Selected state indicator */}
      {isSelected && (
        <div className="
          absolute 
          top-0 
          right-0 
          w-3 
          h-3 
          bg-gray-900 
          rounded-bl-lg
        "></div>
      )}
      
      {/* UI ENHANCEMENT: Hover overlay for better interaction feedback */}
      {!disabled && (
        <div className="
          absolute 
          inset-0 
          pointer-events-none 
          opacity-0 
          hover:opacity-100 
          transition-opacity 
          duration-200
          bg-gradient-to-t from-gray-900/5 to-transparent
        "></div>
      )}
    </div>
  );
};

export default ProductCard;