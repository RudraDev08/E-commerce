import { useState, useCallback, useRef } from 'react';

/**
 * PRODUCTION-GRADE SUBMISSION LOCK
 * Phase 2 Frontend Hardening
 * 
 * Prevents double-clicks and rapid concurrent submissions 
 * in high-stress retail environments.
 */
export const useSubmissionLock = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const lockRef = useRef(false);

    const executeSafe = useCallback(async (callback) => {
        if (lockRef.current) {
            console.warn('[SubmissionLock] Blocked rapid re-entry attempt.');
            return;
        }

        try {
            lockRef.current = true;
            setIsSubmitting(true);
            await callback();
        } finally {
            // Slight delay (50ms) to ensure DOM has updated and user has released click
            setTimeout(() => {
                lockRef.current = false;
                setIsSubmitting(false);
            }, 50);
        }
    }, []);

    return { isSubmitting, executeSafe };
};
