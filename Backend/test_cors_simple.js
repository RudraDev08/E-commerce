import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { corsOptions } from './middlewares/security.middleware.js';

console.log('ENV:', process.env.CORS_ORIGIN);

const test = (origin) => {
    corsOptions.origin(origin, (err, allowed) => {
        if (err) {
            console.log(origin + ': BLOCKED');
        } else {
            console.log(origin + ': ALLOWED');
        }
    });
};

test('http://localhost:5174');
test('http://localhost:5173');
test('http://localhost:3000');
test('http://evil.com');
