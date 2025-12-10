# Step-by-Step: Create User & Login

## 🎯 Your Goal
```
┌────────────────────────────────────────────────────┐
│ Create Account → Login → Access Dashboard          │
└────────────────────────────────────────────────────┘
```

---

## 📋 What You Need

Before starting, make sure:

```
✅ Backend running on http://localhost:4000
✅ Admin dashboard running on http://localhost:3001
✅ MongoDB connected (check backend console)
✅ Terminal access
```

---

## Step 1: Create Your Account

### Option A: Using Terminal (Fastest)

Open terminal and copy-paste this:

```bash
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password",
    "name": "Your Name",
    "role": "admin"
  }'
```

**Replace:**
- `your-email@example.com` → Use your actual email
- `your-password` → Your password (min 6 chars)
- `Your Name` → Your actual name

**Example:**
```bash
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "harsh@example.com",
    "password": "harsh123456",
    "name": "Harsh Kapil",
    "role": "admin"
  }'
```

### ✅ Success Response

You should see:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "harsh@example.com",
      "name": "Harsh Kapil",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### ❌ If It Fails

#### Error: "Email already registered"
```
Solution: Use a different email
          or delete the user first
```

#### Error: "Validation failed"
```
Check:
- Email is valid format (name@domain.com)
- Password is at least 6 characters
- Name is not empty
- Headers include Content-Type: application/json
```

#### Error: "Cannot connect"
```
Check:
- Backend running? Run: cd apps/backend && pnpm dev
- Port 4000 is correct? Check backend console
- MongoDB is connected? Check backend console
```

---

## Step 2: Navigate to Admin Dashboard

Open your browser and go to:

```
http://localhost:3001
```

You should see:

```
┌──────────────────────────────────────────────────┐
│  Multi-Store eCommerce Admin Dashboard           │
│                                                  │
│  [Hero Section with Login Button]                │
│                                                  │
│  ┌────────────────────────────────────┐         │
│  │  Sign In                 View Docs  │         │
│  └────────────────────────────────────┘         │
│                                                  │
│  Features:                                       │
│  📦 Multi-Store Management                       │
│  📦 Product Management                           │
│  🛒 Order Tracking                               │
└──────────────────────────────────────────────────┘
```

---

## Step 3: Click "Sign In"

Click the **"Sign In"** button

You should be redirected to:

```
http://localhost:3001/login
```

---

## Step 4: Enter Your Credentials

You should see:

```
┌────────────────────────────────────────────┐
│  Admin Dashboard - Sign In                 │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ Email: [_________________]           │ │
│  │                                      │ │
│  │ Password: [_________________]        │ │
│  │                                      │ │
│  │ [Sign In Button]                    │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Demo credentials:                         │
│  admin@example.com / password              │
│                                            │
│  Back to home                              │
└────────────────────────────────────────────┘
```

### Enter Your Details

**Email Field:**
```
harsh@example.com
```

**Password Field:**
```
harsh123456
```

---

## Step 5: Click "Sign In"

Click the **Sign In** button and wait...

You should see:
```
⏳ Signing in...
```

---

## Step 6: ✅ You're Logged In!

You should be redirected to:

```
http://localhost:3001/dashboard
```

And see:

```
┌────────────────────────────────────────────────────────┐
│  Multi-Store Admin Dashboard                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Sidebar          │  Dashboard Home                    │
│  ────────         │  ───────────────                   │
│  🏠 Dashboard     │  ┌─────────────────────┐          │
│  📦 Stores        │  │ Select a Store      │          │
│  🎠 Billboards    │  │ (to get started)    │          │
│  📂 Categories    │  └─────────────────────┘          │
│  📦 Products      │                                    │
│  🛒 Orders        │  Quick Stats:                      │
│  🚪 Logout        │  • Stores: 0                       │
│                   │  • Products: 0                     │
│                   │  • Orders: 0                       │
│                   │                                    │
└────────────────────────────────────────────────────────┘
```

**Success!** 🎉

---

## 🎬 What's Next?

### Create Your First Store

1. Click **"Stores"** in the sidebar
2. Click **"New Store"** button
3. Fill in details:
   ```
   Name: My First Store
   Slug: my-first-store
   Domain: (optional)
   ```
4. Click **"Create Store"**

### Select Your Store

1. Look at top-right dropdown
2. Click and select your store
3. Dashboard updates with your store data

### Add Products

1. Click **"Products"** in sidebar
2. Click **"New Product"**
3. Fill in details
4. Click **"Create Product"**

---

## 🆘 Troubleshooting

### I see "Admin Dashboard" but no login form

**Problem**: Already logged in
**Solution**: Good! You're already logged in. Go to `/dashboard`

### I see error message on login page

**Problem**: Wrong email/password
**Solution**: 
- Check if you used exact email you registered
- Check if password is correct
- Try creating user again if you forgot

### I get "Cannot connect to API"

**Problem**: Backend not running
**Solution**:
```bash
# Terminal 1
cd apps/backend && pnpm dev
# Should say "Server running on port 4000"
```

### "Invalid token" error after login

**Problem**: Token expired or invalid
**Solution**:
- Clear browser localStorage: `localStorage.clear()`
- Logout and login again
- Check backend is running

### Dashboard shows "Please select a store"

**Problem**: No store created yet
**Solution**:
1. Click "Stores" in sidebar
2. Create your first store
3. Select it from dropdown

---

## 📊 Quick Reference

### Endpoints
```
Register:  POST http://localhost:4000/api/users/register
Login:     POST http://localhost:4000/api/users/login
Me:        GET http://localhost:4000/api/users/me
Dashboard: http://localhost:3001
```

### Credentials Format
```
{
  "email": "your-email@example.com",
  "password": "your-password",
  "name": "Your Name",
  "role": "admin"
}
```

### Roles
- `admin` - Full access (use this!)
- `store_owner` - Can manage own store
- `customer` - Can browse products

---

## ✨ You Made It!

Congratulations! 🎉

You now have:
- ✅ A user account
- ✅ Admin access
- ✅ Logged into dashboard
- ✅ Ready to create stores and products

---

## 📚 Next Steps

1. **Read**: `ADMIN_DASHBOARD.md` - Learn all features
2. **Create**: Your first store and products
3. **Upload**: Media for your products
4. **Customize**: Add more stores and content

---

## 🤝 Need Help?

- **Quick setup**: Read `QUICK_USER_SETUP.md`
- **Full guide**: Read `USER_SETUP_GUIDE.md`
- **All docs**: Check `ADMIN_DOCS_INDEX_v2.md`

---

**Happy building!** 🚀

*Last Updated: November 13, 2025*
