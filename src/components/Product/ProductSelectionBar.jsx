import React from 'react';

const ProductSelectionBar = ({ 
  selectedCount, 
  totalPrice, 
  onClearSelection,
  onBulkAction, // This will handle 'delete'
  onEdit,       // NEW: Handler for single-item edit
  onAddToCart
}) => {
  if (selectedCount === 0) return null;
  
  return (
    <div className="
      fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50
      bg-gradient-to-r from-slate-900 to-slate-800
      text-white px-6 py-4 rounded-2xl shadow-2xl shadow-slate-900/40
      backdrop-blur-md border border-slate-700/50
      flex flex-wrap justify-between items-center gap-4
      max-w-5xl w-[calc(100%-2rem)]
      transition-all duration-500 animate-in slide-in-from-bottom-10
    ">
      {/* LEFT SIDE: SELECTION DATA */}
      <div className="flex gap-6 items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/20">
            <span className="text-sm font-black">{selectedCount}</span>
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Selected Assets</span>
            <span className="text-sm font-bold text-white uppercase tracking-tighter">
              {selectedCount === 1 ? 'Single Identity' : 'Batch Selection'}
            </span>
          </div>
        </div>
        
        <div className="w-px h-10 bg-slate-700/50"></div>
        
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Valuation</span>
          <span className="text-xl font-black text-white italic tracking-tighter">
            ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      
      {/* RIGHT SIDE: ACTIONS */}
      <div className="flex items-center gap-3">
        {/* EDIT BUTTON: Only visible if exactly 1 item is selected */}
        {selectedCount === 1 && (
          <button 
            onClick={onEdit}
            className="px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Asset
          </button>
        )}

        {/* DELETE BUTTON: Always visible if items are selected */}
        <button 
          onClick={() => onBulkAction('delete')} 
          className="px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-900/20 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Purge {selectedCount > 1 ? 'Selection' : ''}
        </button>

        <div className="w-px h-6 bg-slate-700 mx-1"></div>

        <button 
          onClick={onAddToCart} 
          className="px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] bg-white text-slate-900 hover:bg-slate-100 rounded-xl transition-all shadow-xl flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Process
        </button>

        <button 
          onClick={onClearSelection} 
          className="p-2.5 text-slate-400 hover:text-white transition-colors"
          title="Clear Selection"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* BOTTOM PROGRESS BAR */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700/30 rounded-b-2xl overflow-hidden">
        <div className="h-full bg-blue-500 w-full animate-shimmer opacity-50"></div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer { animation: shimmer 3s infinite linear; }
      `}</style>
    </div>
  );
};

export default ProductSelectionBar;