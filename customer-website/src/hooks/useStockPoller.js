import { useEffect, useRef } from 'react';

/**
 * FIX 7 + 8 — useStockPoller
 * Polls the stock endpoint for a given variantId at a configurable interval.
 * - Only polls when the browser tab is visible (Page Visibility API).
 * - Clears interval on unmount.
 * - Calls onStockUpdate(availableStock) whenever fresh data arrives.
 *
 * @param {string|null} variantId   - ID to poll (null → polling disabled)
 * @param {Function}    onStockUpdate - callback(availableStock: number)
 * @param {number}      interval    - poll interval in ms (default: 30_000)
 */
export function useStockPoller(variantId, onStockUpdate, interval = 30_000) {
    const cbRef = useRef(onStockUpdate);
    cbRef.current = onStockUpdate; // Always keep the latest callback without re-creating effect

    useEffect(() => {
        if (!variantId) return;

        const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

        const poll = async () => {
            // Skip if tab hidden — saves bandwidth during backgrounded sessions
            if (document.visibilityState === 'hidden') return;
            try {
                const res = await fetch(`${API_BASE}/inventory/${variantId}`);
                if (!res.ok) return;
                const json = await res.json();
                const stock = json?.data?.availableStock ?? json?.availableStock;
                if (typeof stock === 'number') cbRef.current(stock);
            } catch {
                // Silently fail — never interrupt UX for polling errors
            }
        };

        // Immediate first poll
        poll();

        const id = setInterval(poll, interval);

        return () => clearInterval(id);
    }, [variantId, interval]);
}
