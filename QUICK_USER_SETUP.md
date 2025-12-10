# 📋 Quick User Setup - Just 3 Steps!

## ⚡ The Fastest Way (Using cURL)

### 1️⃣ Create Your Account (Copy-Paste in Terminal)

```bash
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "harsh@example.com",
    "password": "mypassword123",
    "name": "Harsh Kapil",
    "role": "admin"
  }'
```

**Replace with your details:**
- `harsh@example.com` → Your email
- `mypassword123` → Your password
- `Harsh Kapil` → Your name

### 2️⃣ Wait for Success Message

You should see:
```json
{
  "success": true,
  "data": {
    "user": {
      "email": "harsh@example.com",
      "name": "Harsh Kapil",
      "role": "admin"
    },
    "token": "eyJhbGc..."
  }
}
```

### 3️⃣ Login to Dashboard

1. Go to: `http://localhost:3001`
2. Click "Sign In"
3. Enter your email & password
4. Click "Sign In"
5. ✅ Done!

---

## 🎬 Visual Guide

```
┌─────────────────────────────────────────┐
│ Step 1: Create User (Terminal)          │
├─────────────────────────────────────────┤
│ POST http://localhost:4000/api/users... │
│ Body: { email, password, name, role }   │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ Step 2: Get Response (Check for success)│
├─────────────────────────────────────────┤
│ { "success": true, "data": {...} }      │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ Step 3: Login to Dashboard              │
├─────────────────────────────────────────┤
│ http://localhost:3001                   │
│ Click "Sign In"                         │
│ Enter credentials                       │
│ Click "Sign In"                         │
└─────────────────────────────────────────┘
             ↓
        ✅ LOGGED IN!
```

---

## 🤖 Alternative: Using Node Script

```bash
# Make script executable
chmod +x setup-user.js

# Run it (requires node_modules with axios)
node setup-user.js

# Follow the prompts
```

---

## 🐚 Alternative: Using Bash Script

```bash
# Make script executable
chmod +x setup-user.sh

# Run it
./setup-user.sh

# Follow the prompts
```

---

## 🔑 Login Credentials

After creating account, use these to login:

```
Email:    harsh@example.com      (whatever you created)
Password: mypassword123          (whatever you created)
URL:      http://localhost:3001
```

---

## ⚠️ Common Issues & Fixes

### Issue: "Email already registered"
**Fix**: Use a different email or delete user first

### Issue: "Cannot connect"
**Fix**: Make sure backend is running
```bash
cd apps/backend && pnpm dev
```

### Issue: "Invalid email"
**Fix**: Use proper email format (name@domain.com)

### Issue: "Password too short"
**Fix**: Use at least 6 characters

---

## 🎯 What Happens Next

After you login, you can:
- ✅ Create stores
- ✅ Add products
- ✅ Upload media
- ✅ Manage everything

---

## 📱 Admin Vs Other Roles

| Role | What They Can Do |
|------|-----------------|
| **admin** | Everything (recommended for you) |
| **store_owner** | Manage their own store |
| **customer** | Buy products (not relevant for admin) |

**Use `"role": "admin"` for full access.**

---

## 🆘 If Something Goes Wrong

### Quick Checklist:
1. ✅ Backend running? (`cd apps/backend && pnpm dev`)
2. ✅ Backend on port 4000? (Check console)
3. ✅ MongoDB running? (Should see connection message)
4. ✅ Email valid? (name@domain.com)
5. ✅ Password 6+ chars? (At least 6)
6. ✅ Copied the curl command correctly?

### Get Help:
- Read full guide: `USER_SETUP_GUIDE.md`
- Check backend logs for errors
- Verify API endpoint is correct

---

## 🚀 You're Ready!

**Next:** Read the full guide at `USER_SETUP_GUIDE.md` for more details!

---

*Last Updated: November 13, 2025*
