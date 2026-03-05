import React, { useEffect } from 'react';

/**
 * useKeyboardShortcut hook
 * Allows registering global key bindings for power users.
 * 
 * Usage:
 * useKeyboardShortcut('s', (e) => {
 *   if (e.ctrlKey || e.metaKey) {
 *     e.preventDefault();
 *     handleSave();
 *   }
 * });
 */
export const useKeyboardShortcut = (key, callback, dependencies = []) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Avoid triggering when focused inside inputs, textareas, etc unless explicitly checked
            const target = event.target;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            // If we are looking for Ctrl/Meta commands, inputs are usually fine because they rely on modifier keys
            if (isInput && !(event.ctrlKey || event.metaKey)) return;

            if (event.key.toLowerCase() === key.toLowerCase()) {
                callback(event);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [key, callback, ...dependencies]);
};

export default useKeyboardShortcut;
