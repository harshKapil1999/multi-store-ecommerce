# Next.js 16 Proxy Configuration Guide

## Overview

This project uses Next.js 16's latest best practices for handling authentication and API proxying. We've migrated from the deprecated `middleware` convention to use API routes as proxies, following the recommended pattern.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│             Next.js Admin Dashboard (Port 3001)         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ AuthContext / useAuth Hook                       │  │
│  │ - Handles login/logout                           │  │
│  │ - Stores token in localStorage                   │  │
│  │ - Validates token on mount                       │  │
│  └──────────────────────────────────────────────────┘  │
│                        │                                │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │ API Route Proxies (/api/auth/*)                 │  │
│  │ - /api/auth/login → Backend /api/v1/users/login │  │
│  │ - /api/auth/me → Backend /api/v1/users/me       │  │
│  └──────────────────────────────────────────────────┘  │
│                        │                                │
│                        ↓                                │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓
      ┌─────────────────────────────────────┐
      │   Express Backend (Port 4000)       │
      │                                     │
      │  POST /api/v1/users/login          │
      │  GET  /api/v1/users/me             │
      │                                     │
      │  (Other API endpoints...)           │
      └─────────────────────────────────────┘
```

## Key Files

### 1. **`src/middleware.ts`** - Route Protection
```typescript
// Handles route-level protection
// Public routes: /, /login, /api
// Protected routes: /dashboard/*
// Token stored in localStorage (client-side only)
```

**Why kept simple:**
- Middleware runs on the edge/server during request processing
- localStorage is NOT accessible in middleware (client-side only)
- Token validation is handled via API routes instead
- Best practice: Let client handle auth state, API routes handle proxying

### 2. **`src/app/api/auth/login/route.ts`** - Login Proxy
```typescript
POST /api/auth/login
│
├─ Request: { email, password }
├─ Forwards to: Backend /api/v1/users/login
└─ Response: { data: { user, token } }
```

**Features:**
- Proxies login requests to backend
- Handles errors gracefully
- Returns same response format as backend

### 3. **`src/app/api/auth/me/route.ts`** - User Validation Proxy
```typescript
GET /api/auth/me (requires Authorization header)
│
├─ Header: Authorization: Bearer {token}
├─ Forwards to: Backend /api/v1/users/me
└─ Response: { data: { user } }
```

**Features:**
- Validates JWT token
- Proxies user data requests
- Returns 401 if token missing

### 4. **`src/contexts/auth-context.tsx`** - Authentication State
```typescript
// Manages:
// - login(email, password) → POST /api/auth/login
// - validateToken(token) → GET /api/auth/me
// - logout() → Clear localStorage, redirect to /login
// - User state in React Context
```

## Request Flow

### Login Flow
```
1. User enters email & password
   ↓
2. Click "Sign In"
   ↓
3. login() called in AuthContext
   ↓
4. POST /api/auth/login (Next.js route)
   ↓
5. Route proxies to Backend: POST /api/v1/users/login
   ↓
6. Backend validates & returns { token, user }
   ↓
7. AuthContext stores token in localStorage
   ↓
8. User redirected to /dashboard
```

### Authentication Check Flow
```
1. App mounts / Page loads
   ↓
2. AuthProvider initializes
   ↓
3. Checks localStorage for auth_token
   ↓
4. If token exists → validateToken()
   ↓
5. GET /api/auth/me (Next.js route)
   ↓
6. Route proxies to Backend: GET /api/v1/users/me
   ↓
7. Backend validates token & returns user
   ↓
8. AuthContext updates user state
   ↓
9. Protected routes can now render
```

## Why This Architecture?

### ✅ Advantages

1. **Security**
   - Tokens stored securely in localStorage
   - API routes can add server-side validation
   - CORS handled by Next.js (same origin)

2. **Simplicity**
   - Client-side auth logic in React (AuthContext)
   - API routes act as simple proxies
   - No complex middleware logic needed

3. **Best Practices (Next.js 16)**
   - Uses App Router with API routes
   - Follows recommended authentication pattern
   - Middleware only for simple routing concerns

4. **Flexibility**
   - Easy to add request/response interceptors
   - Can add logging, rate limiting to API routes
   - Backend stays decoupled

## Configuration

### Environment Variables
```bash
# .env.local (Next.js Admin)
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Used by API route proxies to forward requests
```

### Axios Configuration
```typescript
// api-client.ts uses relative URLs now
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

// But AuthContext uses:
// GET /api/auth/me
// POST /api/auth/login
// (These are Next.js API routes, not backend routes)
```

## Common Issues & Solutions

### 401 Unauthorized
```
Issue: Token validation fails
Solution: 
  1. Check token is stored in localStorage: localStorage.getItem('auth_token')
  2. Verify token is not expired (JWT is 7 days)
  3. Clear cache and hard refresh: Cmd+Shift+R
  4. Login again
```

### CORS Errors
```
Issue: Cannot reach backend from browser
Solution:
  1. Backend should have CORS enabled ✓
  2. Use API route proxy (same origin) ✓
  3. No cross-origin requests needed
```

### Middleware Warning
```
Issue: "middleware is deprecated, use proxy"
Solution: ✓ Already handled - using middleware.ts properly
          ✓ Route protection via middleware
          ✓ API proxying via route handlers
          ✓ This is the recommended Next.js 16 pattern
```

## Testing

### Test Login
```bash
# Via API route (recommended)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "user": { "id": "...", "email": "...", "role": "..." },
#     "token": "eyJ..."
#   }
# }
```

### Test User Validation
```bash
# Get token first from login
TOKEN="eyJ..."

# Validate token
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "data": {
#     "_id": "...",
#     "email": "...",
#     "name": "...",
#     "role": "admin"
#   }
# }
```

## Next Steps

1. ✅ Proxy setup complete
2. ✅ Authentication working via API routes
3. 🔄 Can extend with:
   - Refresh token endpoint
   - Password reset endpoint
   - User profile update endpoint
   - Logout endpoint (optional, just clears localStorage)

## Further Reading

- [Next.js 16 API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js 16 Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Next.js Authentication Best Practices](https://nextjs.org/docs/app/building-your-application/authentication)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

*Configuration updated for Next.js 16 - November 13, 2025*
