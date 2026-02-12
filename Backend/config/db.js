import mongoose from 'mongoose';

/**
 * Database Connection Manager
 * Implements secure MongoDB connection with error handling
 */
const connectDB = async () => {
    try {
        // Validate required environment variable
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not defined');
        }

        // Connection options
        // Mongoose 6+ manages connection pool and unified topology automatically
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
        };

        // Connect to MongoDB
        const conn = await mongoose.connect(process.env.MONGO_URI, options);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('🛑 MongoDB connection closed due to app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        console.error('💡 Please check your MONGO_URI in .env file');
        // Fail fast - exit if database connection fails
        process.exit(1);
    }
};

export default connectDB;
