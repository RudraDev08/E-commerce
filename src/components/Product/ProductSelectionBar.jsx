import React from 'react';

const ProductSelectionBar = ({ 
  selectedCount, 
  totalPrice, 
  onClearSelection,
  onBulkAction,
  onAddToCart
}) => {
  if (selectedCount === 0) return null;
  
  return (
    // UI ENHANCEMENT: Premium floating action bar with better styling
    <div className="
      fixed 
      bottom-6 
      left-1/2 
      transform 
      -translate-x-1/2
      z-50
      bg-gradient-to-r from-gray-900 to-gray-800
      text-white 
      px-6 
      py-4 
      rounded-xl 
      shadow-2xl 
      shadow-gray-900/30
      backdrop-blur-sm
      border border-gray-700/50
      flex 
      flex-wrap 
      justify-between 
      items-center 
      gap-4
      max-w-4xl 
      w-[calc(100%-2rem)]
      transition-all 
      duration-300
      animate-in 
      slide-in-from-bottom-5
    ">
      {/* UI ENHANCEMENT: Left side - Enhanced selection info */}
      <div className="flex gap-6 items-center">
        <div className="flex items-center gap-3">
          {/* UI ENHANCEMENT: Selection count badge */}
          <div className="
            flex 
            items-center 
            justify-center
            w-8 
            h-8 
            bg-gradient-to-br from-blue-500 to-blue-600
            rounded-full
            shadow-md
          ">
            <span className="text-sm font-bold">{selectedCount}</span>
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-200 block">
              Products Selected
            </span>
            <span className="text-xs text-gray-400">
              {selectedCount === 1 ? '1 item' : `${selectedCount} items`}
            </span>
          </div>
        </div>
        
        {/* UI ENHANCEMENT: Divider */}
        <div className="w-px h-8 bg-gray-700/50"></div>
        
        {/* UI ENHANCEMENT: Total price with better styling */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-400 mb-0.5">
            Total Value
          </span>
          <span className="
            text-xl 
            font-bold 
            bg-gradient-to-r from-white to-gray-300 
            bg-clip-text 
            text-transparent
          ">
            ${totalPrice.toFixed(2)}
          </span>
        </div>
      </div>
      
      {/* UI ENHANCEMENT: Right side - Enhanced action buttons */}
      <div className="flex flex-wrap gap-2">
        {/* UI ENHANCEMENT: Clear Selection - Subtle secondary */}
        <button 
          onClick={onClearSelection} 
          className="
            px-4 
            py-2.5 
            text-sm 
            font-medium 
            border border-gray-600 
            rounded-lg 
            hover:bg-gray-700/50 
            hover:border-gray-500
            active:bg-gray-700
            transition-all 
            duration-200
            flex items-center gap-2
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
        
        {/* UI ENHANCEMENT: Divider between secondary and primary actions */}
        <div className="w-px h-6 bg-gray-700/50 self-center"></div>
        
        {/* UI ENHANCEMENT: Bulk Actions - Grouped with subtle styling */}
        <div className="flex items-center gap-1 border border-gray-600 rounded-lg p-1">
          <button 
            onClick={() => onBulkAction('activate')} 
            className="
              px-3 
              py-2 
              text-sm 
              font-medium 
              rounded-md 
              hover:bg-gray-700/50
              active:bg-gray-700
              transition-colors 
              duration-200
              flex items-center gap-1.5
            "
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Activate
          </button>
          
          <div className="w-px h-4 bg-gray-600"></div>
          
          <button 
            onClick={() => onBulkAction('deactivate')} 
            className="
              px-3 
              py-2 
              text-sm 
              font-medium 
              rounded-md 
              hover:bg-gray-700/50
              active:bg-gray-700
              transition-colors 
              duration-200
              flex items-center gap-1.5
            "
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Deactivate
          </button>
        </div>
        
        {/* UI ENHANCEMENT: Delete Selected - Destructive with strong visual cue */}
        <button 
          onClick={() => onBulkAction('delete')} 
          className="
            px-4 
            py-2.5 
            text-sm 
            font-semibold 
            bg-gradient-to-r from-red-600 to-red-700
            rounded-lg 
            hover:from-red-700 hover:to-red-800
            active:from-red-800 active:to-red-900
            shadow-lg 
            shadow-red-900/25
            transition-all 
            duration-200
            hover:shadow-red-900/40
            hover:-translate-y-0.5
            active:translate-y-0
            flex items-center gap-2
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
        
        {/* UI ENHANCEMENT: Add to Cart - Primary action with strong emphasis */}
        <button 
          onClick={onAddToCart} 
          className="
            px-5 
            py-2.5 
            text-sm 
            font-semibold 
            bg-gradient-to-r from-blue-600 to-blue-700
            rounded-lg 
            hover:from-blue-700 hover:to-blue-800
            active:from-blue-800 active:to-blue-900
            shadow-lg 
            shadow-blue-900/25
            transition-all 
            duration-200
            hover:shadow-blue-900/40
            hover:-translate-y-0.5
            active:translate-y-0
            flex items-center gap-2
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Add to Cart
        </button>
      </div>
      
      {/* UI ENHANCEMENT: Progress indicator */}
      <div className="
        absolute 
        bottom-0 
        left-0 
        right-0 
        h-1 
        bg-gradient-to-r from-blue-500 to-blue-600 
        rounded-b-xl
        overflow-hidden
      ">
        <div 
          className="
            h-full 
            bg-gradient-to-r from-white to-white/80 
            animate-shimmer
          "
          style={{ animation: 'shimmer 2s infinite linear' }}
        ></div>
      </div>
      
      {/* UI ENHANCEMENT: Animation keyframes (CSS-in-JS) */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default ProductSelectionBar;