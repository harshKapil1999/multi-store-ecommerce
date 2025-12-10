# Authentication - Quick Start

## 🚀 Get Started in 2 Minutes

### Step 1: Start Services
```bash
# Terminal 1: Start Backend
cd apps/backend
pnpm dev

# Terminal 2: Start Admin Dashboard  
cd apps/admin
pnpm dev
```

### Step 2: Navigate to Admin
Open http://localhost:3001

### Step 3: Login
1. You'll see the landing page
2. Click "Sign In" button
3. Enter credentials:
   - **Email**: admin@example.com
   - **Password**: password
4. Click "Sign In"
5. You're now in the dashboard!

### Step 4: Logout
Click the "Logout" button in the sidebar (bottom left)

---

## 📋 What's Protected

These routes are now protected:
- ✅ `/dashboard` - Home page
- ✅ `/dashboard/stores` - Store management
- ✅ `/dashboard/billboards` - Billboard management
- ✅ `/dashboard/categories` - Category management
- ✅ `/dashboard/products` - Product management
- ✅ `/dashboard/orders` - Order management

Try accessing `/dashboard` without logging in → redirects to `/login`

---

## 🔐 Token Management

### Token Storage
- Token stored in: `localStorage.getItem('auth_token')`
- Automatically included in all API requests
- Cleared on logout

### Automatic Features
- ✅ Token sent with every API request
- ✅ Invalid tokens redirect to login
- ✅ Token validated on app load
- ✅ Session persists on page refresh

---

## 💡 Using Auth in Components

### Access Current User
```typescript
'use client';
import { useAuth } from '@/hooks/useAuth';

export function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  return <div>Welcome, {user?.email}!</div>;
}
```

### Login/Logout
```typescript
const { login, logout } = useAuth();

// Login
await login('admin@example.com', 'password');

// Logout
logout();
```

---

## ⚙️ Backend Setup

Ensure your backend has these endpoints:

### 1. Login Endpoint
```
POST /api/users/login
Body: { email, password }
Response: { data: { token, user: { id, email, role } } }
```

### 2. Current User Endpoint  
```
GET /api/users/me
Headers: Authorization: Bearer <token>
Response: { data: { id, email, role } }
```

### 3. Error Handling
```
401 Unauthorized → Redirects to login
403 Forbidden → Insufficient permissions
```

---

## 🧪 Testing Checklist

- [ ] Click "Sign In" on landing page
- [ ] Login with demo credentials
- [ ] Redirected to dashboard
- [ ] User email shown in header
- [ ] Click logout button
- [ ] Redirected back to login
- [ ] Try accessing /dashboard without login
- [ ] Should redirect to /login
- [ ] Close browser, reopen dashboard
- [ ] Should still be logged in (token persisted)

---

## 🐛 Troubleshooting

### Can't see login page?
```bash
# Clear cache
rm -rf apps/admin/.next
pnpm dev
```

### Login fails?
1. Check backend is running on :4000
2. Verify `NEXT_PUBLIC_API_URL=http://localhost:4000/api`
3. Check network tab in DevTools
4. Check backend console for errors

### Protected routes accessible without login?
1. Verify middleware.ts exists in `apps/admin/src/`
2. Clear Next.js cache
3. Restart dev server

---

## 📚 Full Documentation

For complete details, see: `ADMIN_AUTH_IMPLEMENTATION.md`

---

**That's it! You now have a fully authenticated admin dashboard.** 🎉
