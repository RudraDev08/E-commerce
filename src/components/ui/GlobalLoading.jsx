import React, { useEffect, useState } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useLocation } from 'react-router-dom';

// Customize NProgress settings globally
NProgress.configure({
    showSpinner: false,
    trickleSpeed: 200,
    minimum: 0.1
});

/**
 * GlobalLoading component:
 * Hook into React Router navigation flows or global API interceptors.
 * 
 * Usage: Place at root of the app.
 */
export const GlobalLoading = () => {
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    // Watch route changes to simulate Top Bar Progress
    useEffect(() => {
        // Start progress on mount / location change start
        NProgress.start();
        setLoading(true);

        // Complete after a tiny timeout to simulate rendering transition
        const timeout = setTimeout(() => {
            NProgress.done();
            setLoading(false);
        }, 300);

        return () => {
            clearTimeout(timeout);
            NProgress.done();
        };
    }, [location.pathname]);

    // Optional: Listen to a global state/event for API fetching
    useEffect(() => {
        const handleStart = () => NProgress.start();
        const handleStop = () => NProgress.done();

        window.addEventListener('api-request-start', handleStart);
        window.addEventListener('api-request-end', handleStop);

        return () => {
            window.removeEventListener('api-request-start', handleStart);
            window.removeEventListener('api-request-end', handleStop);
        };
    }, []);

    return null;
};
