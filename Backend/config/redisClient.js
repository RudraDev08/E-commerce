import { createRedisConnection } from './redis.js';

// Singleton instance for global app usage
const redisClient = createRedisConnection();

export default redisClient;
