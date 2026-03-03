import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { corsOptions } from './middlewares/security.middleware.js';


const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
];
console.log('ENV CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('ALLOWED ORIGINS LIST:', allowedOrigins);

const mockCallback = (err, result, origin) => {
    if (err) {
        console.log(`BLOCKED: ${origin}`, err.message);
    } else {
        console.log(`ALLOWED: ${origin}`, result);
    }
};

console.log('--- STARTING TESTS ---');
corsOptions.origin('http://localhost:5174', (err, res) => mockCallback(err, res, 'http://localhost:5174'));
corsOptions.origin('http://localhost:5173', (err, res) => mockCallback(err, res, 'http://localhost:5173'));
corsOptions.origin('http://localhost:3000', (err, res) => mockCallback(err, res, 'http://localhost:3000'));
corsOptions.origin('http://evil.com', (err, res) => mockCallback(err, res, 'http://evil.com'));

