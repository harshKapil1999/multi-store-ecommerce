# 🎯 User Setup Cheat Sheet

Quick reference for creating users and logging in.

---

## ⚡ Copy-Paste Command

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

**Replace:**
- `harsh@example.com` → your email
- `harsh123456` → your password (6+ chars)
- `Harsh Kapil` → your name

---

## ✅ You Should See

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

---

## 🔐 Now Login

| Step | Action | Result |
|------|--------|--------|
| 1 | Go to `http://localhost:3001` | See landing page |
| 2 | Click "Sign In" | Redirected to login |
| 3 | Enter email | Form filled |
| 4 | Enter password | Form filled |
| 5 | Click "Sign In" | Dashboard loaded! ✅ |

---

## 🎮 What's Available

| URL | Purpose |
|-----|---------|
| `http://localhost:3001` | Admin Dashboard |
| `http://localhost:3001/login` | Login Page |
| `http://localhost:3001/dashboard` | Dashboard Home |
| `http://localhost:4000/api` | Backend API |

---

## 📝 Create User via Terminal

```bash
# Method 1: Single line
curl -X POST http://localhost:4000/api/users/register -H "Content-Type: application/json" -d '{"email":"user@example.com","password":"password123","name":"User","role":"admin"}'

# Method 2: Multi-line (shown above)
# Method 3: Save JSON to file then use
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d @user.json
# where user.json contains the user data
```

---

## 📧 Create User via Postman/Thunder Client

```
METHOD:  POST
URL:     http://localhost:4000/api/users/register

Headers:
Content-Type: application/json

Body (JSON):
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "role": "admin"
}
```

---

## 🗂️ User Data Format

```javascript
{
  "email": "harsh@example.com",        // Required, valid email
  "password": "harsh123456",           // Required, min 6 chars
  "name": "Harsh Kapil",               // Required
  "role": "admin"                      // Optional: admin|store_owner|customer
}
```

---

## 🔑 Valid Roles

```
"admin"         → Full system access ✅
"store_owner"   → Manage own store
"customer"      → Browse products
```

---

## ❌ Common Mistakes

| Mistake | Result | Fix |
|---------|--------|-----|
| Single quotes | Parse error | Use double quotes |
| Password < 6 | Validation error | Use longer password |
| Missing email | Validation error | Add email field |
| Wrong email format | Validation error | Use name@domain.com |
| No Content-Type | May fail | Add -H "Content-Type: application/json" |

---

## 🧪 Test Your Setup

```bash
# Test 1: Can reach backend?
curl http://localhost:4000/api/users/login -X POST

# Test 2: Create user
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test","role":"admin"}'

# Test 3: Login with new user
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## 🆘 Quick Fixes

| Issue | Fix |
|-------|-----|
| Cannot connect | Run: `cd apps/backend && pnpm dev` |
| Email already exists | Use different email |
| Validation failed | Check email format & password length |
| Parse error | Check JSON syntax (double quotes, commas) |
| No response | Backend not running or wrong URL |
| Login fails | Email/password don't match |
| Dashboard won't load | Clear browser cache, check backend |

---

## 📱 Credentials Reference

**What you create:**
```
Email: harsh@example.com
Password: harsh123456
```

**Use to login:**
```
Go to: http://localhost:3001
Enter email: harsh@example.com
Enter password: harsh123456
```

---

## 🔄 Password Reset (If Forgot)

Since there's no recovery, you need to:

1. Delete user from MongoDB
2. Create new user with new password

Or just use a new email address.

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 201 | Success - User created |
| 200 | Success - Logged in |
| 400 | Bad request - Check your data |
| 401 | Unauthorized - Wrong credentials |
| 500 | Server error - Check backend logs |

---

## 🎯 After Login, You Can:

- ✅ Create stores
- ✅ Manage products
- ✅ Upload media
- ✅ Add categories
- ✅ Create billboards
- ✅ View dashboard stats
- ✅ Logout

---

## 📚 For More Info

| Need | Read |
|------|------|
| Quick setup | `QUICK_USER_SETUP.md` |
| Step-by-step | `STEP_BY_STEP_GUIDE.md` |
| All options | `USER_SETUP_GUIDE.md` |
| Troubleshoot | `USER_SETUP_TROUBLESHOOTING.md` |
| Everything | `USER_CREATION_GUIDE.md` |

---

## 💡 Pro Tips

```bash
# Test JSON before sending
echo '{"email":"test@test.com","password":"test123"}' | jq

# Save command for later
echo "curl -X POST http://localhost:4000/api/users/register \
  -H 'Content-Type: application/json' \
  -d '{...}'" > register.sh
chmod +x register.sh
./register.sh

# View all users (MongoDB)
mongosh
use ecommerce
db.users.find()
```

---

## ✨ Summary

1. **Create**: Copy curl command → Modify with your details → Paste & run
2. **Wait**: Get success response
3. **Login**: Go to http://localhost:3001 → Enter credentials → Click Sign In
4. **Use**: Access dashboard!

**Total time: 5 minutes** ⏱️

---

*Last Updated: November 13, 2025*
