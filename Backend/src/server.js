import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables *before* any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../.env') });

// Now import the rest of the application
// Dynamic imports ensure env vars are loaded first
const { default: logger } = await import('../config/logger.js');
const { default: connectDB } = await import('../config/db.js');
const { default: app } = await import('./app.js');
const { startReservationWorker } = await import('../jobs/reservationCleanup.js');

// Database Connection
connectDB();

// Start Background Workers
startReservationWorker();

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
