import React from 'react';

const ProductSelectionBar = ({ 
  selectedCount, 
  totalPrice, 
  onClearSelection,
  onBulkAction,
  onEdit,
  onAddToCart
}) => {
  if (selectedCount === 0) return null;
  
  return (
    <div className="
      fixed bottom-0 sm:bottom-6 left-0 sm:left-1/2 transform sm:-translate-x-1/2 z-50
      bg-linear-to-r from-slate-900 to-slate-800
      text-white w-full sm:w-[calc(100%-2rem)] sm:max-w-5xl
      shadow-2xl shadow-slate-900/40 backdrop-blur-md border-b sm:border border-slate-700/50
      flex flex-col sm:flex-row justify-between items-stretch sm:items-center
      transition-all duration-500 animate-in slide-in-from-bottom-10
    ">
      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 gap-4 sm:gap-6">
        
        {/* LEFT SIDE: SELECTION DATA */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* SELECTION BADGE */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg sm:rounded-xl shadow-lg shadow-blue-900/20">
              <span className="text-xs sm:text-sm font-black">{selectedCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected</span>
              <span className="text-sm font-bold text-white uppercase tracking-tighter">
                {selectedCount === 1 ? 'Single Item' : `${selectedCount} Items`}
              </span>
            </div>
          </div>
          
          {/* VERTICAL DIVIDER - Hidden on mobile */}
          <div className="hidden sm:block w-px h-10 bg-slate-700/50"></div>
          
          {/* PRICE DISPLAY - Full width on mobile, inline on desktop */}
          <div className="w-full sm:w-auto flex justify-between items-center sm:block">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</span>
            <span className="text-lg sm:text-xl font-black text-white italic tracking-tighter">
              ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        {/* RIGHT SIDE: ACTIONS */}
        <div className="w-full sm:w-auto flex flex-wrap justify-end items-center gap-2 sm:gap-3">
          {/* EDIT BUTTON - Full width on mobile when visible */}
          {selectedCount === 1 && (
            <button 
              onClick={onEdit}
              className="w-full sm:w-auto flex-1 sm:flex-none px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] bg-emerald-600 hover:bg-emerald-500 rounded-lg sm:rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="truncate">Edit</span>
            </button>
          )}

          {/* DELETE BUTTON */}
          <button 
            onClick={() => onBulkAction('delete')} 
            className="flex-1 sm:flex-none px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] bg-rose-600 hover:bg-rose-500 rounded-lg sm:rounded-xl transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="truncate">
              {selectedCount > 1 ? `Delete (${selectedCount})` : 'Delete'}
            </span>
          </button>

          {/* HORIZONTAL DIVIDER - Visible on mobile, vertical on desktop */}
          <div className="w-full sm:w-px sm:h-6 bg-slate-700/30 my-2 sm:my-0 sm:mx-1"></div>

          {/* PROCESS/ADD TO CART BUTTON */}
          <button 
            onClick={onAddToCart} 
            className="flex-1 sm:flex-none px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] bg-white text-slate-900 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-all shadow-xl flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="truncate">Process</span>
          </button>

          {/* CLEAR SELECTION BUTTON - Always visible, smaller on mobile */}
          <button 
            onClick={onClearSelection} 
            className="p-2 sm:p-2.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
            title="Clear Selection"
            aria-label="Clear Selection"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* BOTTOM PROGRESS BAR */}
      <div className="h-1 bg-slate-700/30 overflow-hidden">
        <div className="h-full bg-linear-to-r from-blue-500 via-blue-400 to-blue-500 w-full animate-shimmer opacity-50"></div>
      </div>
      
      {/* ANIMATION STYLES */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer { 
          animation: shimmer 2.5s infinite ease-in-out; 
        }
      `}</style>
    </div>
  );
};

export default ProductSelectionBar;