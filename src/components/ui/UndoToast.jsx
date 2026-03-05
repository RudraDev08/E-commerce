import React from 'react';
import toast from 'react-hot-toast';
import { RotateCcw } from 'lucide-react';

/**
 * Enterprise Undo Snackbar / Toast
 * 
 * Usage:
 * const handleDelete = () => {
 *   // Optimistically update UI
 *   dispatch(removeProductUI(id));
 *   
 *   showUndoToast(
 *     "Product deleted successfully.",
 *     () => {
 *       // The undo action
 *       dispatch(restoreProductUI(id));
 *     },
 *     () => {
 *       // The final destructive commit action after 10 seconds empty timeout
 *       api.deleteProduct(id);
 *     }
 *   );
 * };
 */

export const showUndoToast = (message, onUndo, onConfirm, duration = 10000) => {
    let isUndoClicked = false;

    const toastId = toast.custom(
        (t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-sm w-full bg-gray-900 dark:bg-gray-800 shadow-xl rounded-lg pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 overflow-hidden`}
            >
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-white">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex border-l border-gray-700">
                    <button
                        onClick={() => {
                            isUndoClicked = true;
                            onUndo();
                            toast.dismiss(t.id);
                        }}
                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-bold text-blue-400 hover:text-blue-300 focus:outline-none transition-colors"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" /> Undo
                    </button>
                </div>
            </div>
        ),
        { duration }
    );

    // Trigger actual server deletion if timeout completes without Undo being clicked
    setTimeout(() => {
        if (!isUndoClicked && onConfirm) {
            onConfirm();
        }
    }, duration);
};
