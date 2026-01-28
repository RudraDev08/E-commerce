import React, { useState } from 'react';

const ProductCard = ({ product, isSelected, onSelect, disabled }) => {
  const [imgError, setImgError] = useState(false);

  // Helper to construct image URL robustly
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;

    // Handle potential double slashes or mixed separators
    const filename = imagePath.split(/[/\\]/).pop();
    return `http://localhost:5000/uploads/${filename}`;
  };

  const imageUrl = getImageUrl(product.image);

  return (
    <div
      className={`
        group
        relative
        bg-white 
        rounded-2xl 
        overflow-hidden
        transition-all 
        duration-300 
        hover:shadow-xl
        hover:shadow-indigo-500/10
        border
        ${isSelected
          ? 'border-indigo-600 ring-4 ring-indigo-50'
          : 'border-slate-100 hover:border-indigo-200'
        }
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-3 left-3 z-20">
        <label className={`
          flex items-center justify-center
          w-6 h-6
          border-2 rounded-lg
          transition-all duration-200
          cursor-pointer
          ${isSelected
            ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-200'
            : 'bg-white/80 backdrop-blur-sm border-slate-300 hover:border-indigo-400'
          }
        `}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => !disabled && onSelect(product._id)}
            disabled={disabled}
            className="hidden"
          />
          {isSelected && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </label>
      </div>

      {/* Image Area */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={product.name}
            onError={() => setImgError(true)}
            className="
              w-full h-full
              object-contain
              p-4
              transition-transform duration-500
              group-hover:scale-105
            "
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">No Image</span>
            {/* Debug Info (Only visible if needed or for dev) */}
            <span className="text-[10px] mt-1 text-red-400 hidden group-hover:block px-2 text-center">
              {product.image || 'Null'}
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className={`
            px-2.5 py-1 
            rounded-full 
            text-[10px] 
            font-bold 
            uppercase 
            tracking-wider 
            backdrop-blur-md
            ${product.stock > 0
              ? 'bg-emerald-500/10 text-emerald-700'
              : 'bg-rose-500/10 text-rose-700'
            }
          `}>
            {product.stock > 0 ? (product.stock < 10 ? 'Low Stock' : 'In Stock') : 'Out of Stock'}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 bg-white">
        {/* Category & Brand */}
        <div className="flex items-center gap-2 mb-2 text-xs font-medium text-slate-500">
          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
            {product.category?.name || 'Uncategorized'}
          </span>
          <span>•</span>
          <span className="truncate max-w-[100px]">{product.brand?.name || 'No Brand'}</span>
        </div>

        {/* Product Name */}
        <h3 className="
          text-sm 
          font-bold 
          text-slate-900 
          mb-3
          line-clamp-2
          h-10
          leading-relaxed
        ">
          {product.name}
        </h3>

        {/* Price & Action */}
        <div className="flex items-end justify-between pt-2 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price</span>
            <span className="text-lg font-black text-slate-900">
              ${Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            className="
              text-xs font-bold 
              text-indigo-600 
              bg-indigo-50 
              px-3 py-1.5 
              rounded-lg 
              hover:bg-indigo-100 
              transition-colors
              opacity-0 group-hover:opacity-100
            "
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product._id);
            }}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;