// ============================================================================
// Atomic Checkpoint Utility - Crash-Safe File Writes
// ============================================================================
// CRITICAL FIX: Uses temp file + atomic rename pattern
// Prevents JSON corruption on process crash during write
// ============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CheckpointManager {
    constructor(checkpointPath) {
        this.checkpointPath = checkpointPath;
        this.tempPath = `${checkpointPath}.tmp`;
        this.lockPath = `${checkpointPath}.lock`;
    }

    /**
     * Load Checkpoint (Crash-Safe)
     * Handles corrupted temp files gracefully
     */
    load() {
        try {
            // Check if main checkpoint exists
            if (fs.existsSync(this.checkpointPath)) {
                const data = fs.readFileSync(this.checkpointPath, 'utf8');
                return JSON.parse(data);
            }

            // Fallback: Check if temp file exists (crash during rename)
            if (fs.existsSync(this.tempPath)) {
                const data = fs.readFileSync(this.tempPath, 'utf8');
                const parsed = JSON.parse(data);

                // Promote temp to main
                fs.renameSync(this.tempPath, this.checkpointPath);
                return parsed;
            }

        } catch (err) {
            console.error('Checkpoint load failed:', err.message);

            // Corrupted checkpoint - delete and start fresh
            this.clear();
        }

        return { lastProcessedId: null, processedCount: 0 };
    }

    /**
     * Save Checkpoint (Atomic Write)
     * CRITICAL: Uses temp file + rename for atomicity
     */
    save(data) {
        try {
            // Acquire lock (prevents concurrent writes)
            if (fs.existsSync(this.lockPath)) {
                console.warn('Checkpoint lock exists - skipping write');
                return false;
            }

            fs.writeFileSync(this.lockPath, Date.now().toString());

            // Write to temp file first
            const jsonData = JSON.stringify({
                ...data,
                timestamp: new Date().toISOString()
            }, null, 2);

            fs.writeFileSync(this.tempPath, jsonData, 'utf8');

            // Atomic rename (POSIX guarantees atomicity)
            fs.renameSync(this.tempPath, this.checkpointPath);

            // Release lock
            fs.unlinkSync(this.lockPath);

            return true;

        } catch (err) {
            console.error('Checkpoint save failed:', err.message);

            // Cleanup lock on error
            if (fs.existsSync(this.lockPath)) {
                fs.unlinkSync(this.lockPath);
            }

            return false;
        }
    }

    /**
     * Clear Checkpoint
     */
    clear() {
        try {
            if (fs.existsSync(this.checkpointPath)) {
                fs.unlinkSync(this.checkpointPath);
            }
            if (fs.existsSync(this.tempPath)) {
                fs.unlinkSync(this.tempPath);
            }
            if (fs.existsSync(this.lockPath)) {
                fs.unlinkSync(this.lockPath);
            }
        } catch (err) {
            console.error('Checkpoint clear failed:', err.message);
        }
    }

    /**
     * Check if checkpoint exists
     */
    exists() {
        return fs.existsSync(this.checkpointPath);
    }

    /**
     * Get checkpoint age in seconds
     */
    getAge() {
        try {
            if (!this.exists()) return null;

            const stats = fs.statSync(this.checkpointPath);
            return (Date.now() - stats.mtimeMs) / 1000;
        } catch (err) {
            return null;
        }
    }
}

export default CheckpointManager;
