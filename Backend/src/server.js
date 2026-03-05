import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Load environment variables *before* any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../.env') });

// Initialize Sentry early
Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    integrations: [
        nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
});

// Now import the rest of the application
// Dynamic imports ensure env vars are loaded first
const { default: logger } = await import('../config/logger.js');
const { default: app, runInventoryInvariantCheck, loadSystemState } = await import('./app.js');
const { default: connectDB } = await import('../config/db.js');
const { startReservationWorker } = await import('../jobs/reservationCleanup.js');
const { startBackgroundWorker } = await import('../jobs/backgroundQueue.js');
const { startReconciliationDaemon, runReconciliation } = await import('../services/reconciliation/ReconciliationEngine.js');
const { scheduleInventorySnapshotJob, runInventorySnapshot } = await import('../jobs/inventorySnapshot.cron.js');

// Database Connection
connectDB().then(async () => {
    // Run non-blocking startup integrity checks after DB connects
    await loadSystemState();
    runInventoryInvariantCheck();

    // Fix 6: Register nightly inventory snapshot cron (0 0 * * *)
    scheduleInventorySnapshotJob();
    // Optionally run once immediately on boot to backfill any missed snapshot
    // runInventorySnapshot();
});

// Start Background Workers
startReservationWorker();
await import('./workers/variantWorker.js'); // Starts BullMQ worker
startBackgroundWorker(); // Global background queue worker
startReconciliationDaemon();
runReconciliation(); // Run immediately on boot

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    logger.info('Server started successfully');
    logger.info(`🚀 Server URL: http://localhost:${PORT}`);
    logger.info(`📊 Health Check: http://localhost:${PORT}/health`);
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', { error: err.message, stack: err.stack });
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
    Sentry.captureException(err);
    logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
    process.exit(1);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
    });
});
