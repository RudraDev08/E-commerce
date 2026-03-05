import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertOctagon, RotateCcw, Bug } from 'lucide-react';

const FallbackComponent = ({ error, resetErrorBoundary }) => {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-8 bg-white dark:bg-gray-950 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30">
            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertOctagon className="w-10 h-10 text-red-500" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Something went wrong
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-left overflow-auto max-h-32 font-mono">
                    {error.message || 'An unexpected error occurred in this module.'}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={resetErrorBoundary}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Try Again
                    </button>

                    <button
                        onClick={() => {/* Trigger support modal or Sentry capture if needed */ }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Bug className="w-4 h-4" /> Report Issue
                    </button>
                </div>
            </div>
        </div>
    );
};

export const GlobalErrorBoundary = ({ children }) => {
    return (
        <ErrorBoundary
            FallbackComponent={FallbackComponent}
            onReset={() => {
                // Reset state or query cache here if needed
                window.location.reload();
            }}
            onError={(error, info) => {
                // Log to Sentry or internal analytics
                console.error('[ErrorBoundary Captured]', error, info);
            }}
        >
            {children}
        </ErrorBoundary>
    );
};
