# 🚀 QUICK START GUIDE

## Getting Started with the Hardened Backend

### 1. Environment Setup (First Time Only)

```bash
cd Backend

# Copy environment template
cp .env.example .env

# Generate secure JWT secrets
# On Linux/Mac:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Update .env with generated secrets:
# JWT_SECRET=<generated-secret-1>
# JWT_REFRESH_SECRET=<generated-secret-2>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start MongoDB

```bash
# Make sure MongoDB is running on localhost:27017
# Or update MONGO_URI in .env
```

### 4. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 5. Verify Server is Running

```bash
# Health check
curl http://localhost:5000/health

# Expected response:
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "status": "UP",
    "timestamp": "...",
    "uptime": 123,
    "environment": "development",
    "version": "1.0.0"
  }
}
```

---

## 🔐 Authentication Quick Reference

### Register New User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "admin"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Use Access Token

```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## 📚 API Endpoints

### New Versioned Endpoints (Recommended)

```
POST   /api/v1/auth/register     - Register new user
POST   /api/v1/auth/login        - Login user
GET    /api/v1/auth/me           - Get current user (protected)
POST   /api/v1/auth/logout       - Logout user (protected)
POST   /api/v1/auth/refresh      - Refresh access token

GET    /api/v1/products          - Get all products
POST   /api/v1/products          - Create product (protected)
GET    /api/v1/products/:id      - Get product by ID
PUT    /api/v1/products/:id      - Update product (protected)
DELETE /api/v1/products/:id      - Delete product (protected)

... (all other endpoints with /api/v1 prefix)
```

### Legacy Endpoints (Backward Compatible)

```
GET    /api/products             - Still works
POST   /api/products             - Still works
... (all old routes still functional)
```

---

## 🛡️ Protected Routes

To access protected routes, include the access token in the Authorization header:

```bash
curl http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Role-Based Access

- **admin**: Full access to all endpoints
- **manager**: Access to most endpoints (except user management)
- **user**: Read-only access

Example: Protect a route with admin role

```javascript
import { authenticate, authorize } from './middlewares/auth.middleware.js';

router.post('/products',
  authenticate,           // Verify JWT token
  authorize('admin'),     // Only admins allowed
  createProduct
);
```

---

## 🐛 Debugging

### Check Logs

```bash
# Development: logs appear in console
# Production: check log files
cat Backend/logs/error.log
cat Backend/logs/combined.log
```

### Common Issues

#### 1. "MONGO_URI environment variable is not defined"
**Solution:** Check your `.env` file exists and contains `MONGO_URI`

#### 2. "Missing required environment variables"
**Solution:** Ensure `.env` has:
```
MONGO_URI=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

#### 3. "MongoDB Connection Failed"
**Solution:** Make sure MongoDB is running:
```bash
# Check if MongoDB is running
mongosh

# Or start MongoDB service
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
# Mac: brew services start mongodb-community
```

#### 4. "Too many requests"
**Solution:** Rate limit exceeded. Wait 15 minutes or adjust limits in `.env`

---

## 📝 Environment Variables Reference

```bash
# Required
NODE_ENV=development|production
MONGO_URI=mongodb://localhost:27017/AdminPanel
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# Optional (with defaults)
PORT=5000
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
LOG_LEVEL=info
ENABLE_RATE_LIMITING=true
```

---

## 🧪 Testing

### Manual Testing

```bash
# 1. Health check
curl http://localhost:5000/health

# 2. Register user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'

# 3. Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 4. Get current user (use token from login response)
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Development Tips

### 1. Auto-reload on Changes

```bash
npm run dev  # Uses nodemon
```

### 2. Check for Errors

Watch the console for structured logs:
```
2026-02-11 16:12:36 [info]: Server started successfully
2026-02-11 16:12:36 [info]: 🚀 Server URL: http://localhost:5000
2026-02-11 16:12:36 [info]: 📊 Health Check: http://localhost:5000/health
```

### 3. Validate Input

All endpoints now validate input automatically. Invalid requests return:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "email must be a valid email"
      }
    ]
  }
}
```

---

## 📖 Next Steps

1. **Read Full Report:** `PROJECT_HARDENING_COMPLETE_REPORT.md`
2. **Review Audit:** `COMPREHENSIVE_TECHNICAL_AUDIT_REPORT.md`
3. **Check Environment:** `.env.example`
4. **Test Authentication:** Use curl commands above
5. **Integrate Frontend:** Update API calls to use `/api/v1/*`

---

## 🆘 Need Help?

- Check logs: `Backend/logs/`
- Review error messages (they're now descriptive!)
- Verify environment variables
- Ensure MongoDB is running
- Check CORS settings if frontend can't connect

---

**Happy Coding!** 🚀

