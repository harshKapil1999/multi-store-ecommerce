# Login 404 / Invalid Token - Troubleshooting

## What You're Seeing

```
GET /api/auth/me 401 - Invalid or expired token
GET /dashboard 404 - Dashboard not found
```

## Root Causes

1. **Token is invalid/expired** - The token in localStorage was generated before the JWT_SECRET was properly configured
2. **Dashboard route not accessible** - Missing authentication protection (NOW FIXED ✅)

## Solution: Create Fresh Admin User

### Step 1: Clear localStorage
Open browser DevTools (F12) and run:
```javascript
localStorage.clear();
```

### Step 2: Delete Old User from MongoDB
```bash
mongosh
use ecommerce-multi-store
db.users.deleteMany({ email: "harsh@example.com" })
exit
```

### Step 3: Create New Admin User
Use the curl command from CHEAT_SHEET.md:

```bash
curl -X POST http://localhost:4000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "harsh@example.com",
    "password": "harsh123456",
    "name": "Harsh Kapil",
    "role": "admin"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "harsh@example.com",
      "name": "Harsh Kapil",
      "role": "admin"
    },
    "token": "eyJ..."
  }
}
```

### Step 4: Hard Refresh Browser
- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`
- Or clear browser cache

### Step 5: Login
Go to `http://localhost:3001/login` and enter:
- Email: `harsh@example.com`
- Password: `harsh123456`

Click "Sign In"

## What Just Got Fixed ✅

1. **Dashboard Layout Protection** - Added authentication check
2. **Loading State** - Shows loader while checking auth
3. **Redirect Logic** - Redirects to login if not authenticated
4. **API Route Proxies** - Set up for `/api/auth/login` and `/api/auth/me`

## Testing the Flow

### Test 1: Login Works
- ✅ Navigate to http://localhost:3001/login
- ✅ Enter email and password
- ✅ Should see success response with token
- ✅ Token should be stored in localStorage

### Test 2: Dashboard Loads
- ✅ After login, should redirect to /dashboard
- ✅ Dashboard should load without errors
- ✅ Should see stores, products, etc.

### Test 3: Token Validation
- ✅ Refresh page
- ✅ Should still be logged in (not redirected to login)
- ✅ AuthContext should validate token and restore user

## If Still Having Issues

### Check Backend Logs
```bash
# In terminal showing @repo/backend:dev
# Look for:
# - "Invalid or expired token" = JWT validation failed
# - "Email already registered" = User already exists
# - "Invalid credentials" = Wrong password
```

### Check Frontend Logs
```javascript
// Open DevTools Console (F12)
// Look for:
localStorage.getItem('auth_token')  // Should show token
// If undefined, token wasn't saved during login
```

### Manual Token Test
```bash
# Get a fresh token first
curl -X POST http://localhost:4000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"harsh@example.com","password":"harsh123456"}'

# Get the token from response, then test:
TOKEN="eyJ..."
curl http://localhost:4000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"

# Should return user data, not 401
```

## Architecture Recap

```
Browser
   ↓
   ├─→ http://localhost:3001/login
   │     (Login Page)
   ↓
   ├─→ POST /api/auth/login (Next.js Route)
   │     ↓
   │     └→ POST /api/v1/users/login (Backend)
   │          ├─ Hash password check
   │          └─ Generate JWT token
   ↓
localStorage.auth_token = "eyJ..."
   ↓
   ├─→ Redirect to http://localhost:3001/dashboard
   ↓
   ├─→ GET /api/auth/me (Next.js Route)
   │     ↓
   │     └→ GET /api/v1/users/me (Backend)
   │          ├─ Verify JWT token
   │          └─ Return user data
   ↓
Dashboard Loads ✅
```

## Summary

You now have:
- ✅ Backend generating valid tokens with JWT_SECRET
- ✅ Next.js proxy routes for login and user validation
- ✅ Protected dashboard layout with auth checks
- ✅ Proper loading and redirect states
- ✅ All following Next.js 16 best practices

Just create a fresh user and you'll be able to login! 🎉

---

*Updated: November 13, 2025*
