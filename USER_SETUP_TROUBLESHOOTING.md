# 🔧 User Setup Troubleshooting

## Common Issues & Solutions

---

## ❌ Issue: "Email already registered"

### What It Means
You tried to register with an email that already exists in the database.

### Solutions

#### Solution 1: Use Different Email (Easiest)
```bash
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "password": "password123",
    "name": "Your Name",
    "role": "admin"
  }'
```

#### Solution 2: Delete Existing User (Advanced)

**Option A: Using MongoDB Compass**
1. Open MongoDB Compass
2. Connect to your database
3. Go to `ecommerce` database
4. Go to `users` collection
5. Find and delete the user
6. Try registering again

**Option B: Using MongoDB CLI**
```bash
# Connect to MongoDB
mongosh "your-mongodb-uri"

# Select database
use ecommerce

# Delete user by email
db.users.deleteOne({ email: "harsh@example.com" })

# Verify deletion
db.users.find({ email: "harsh@example.com" })
# Should return nothing
```

**Option C: Delete All Users (CAUTION!)
```bash
# Delete ALL users (be careful!)
db.users.deleteMany({})
```

---

## ❌ Issue: "Validation failed"

### What It Means
Your input doesn't match the requirements.

### Possible Causes & Solutions

#### Cause 1: Invalid Email Format
```
❌ Wrong: "harsh"
❌ Wrong: "harsh@"
❌ Wrong: "@example.com"

✅ Correct: "harsh@example.com"
✅ Correct: "your-name@domain.co.uk"
```

#### Cause 2: Password Too Short
```
❌ Wrong: "pass" (4 characters)
❌ Wrong: "abc" (3 characters)

✅ Correct: "password123" (11 characters)
✅ Correct: "MyPass12" (8 characters)
```

#### Cause 3: Name is Empty
```
❌ Wrong: "name": ""
❌ Wrong: "name": "   "

✅ Correct: "name": "Harsh Kapil"
✅ Correct: "name": "Admin User"
```

#### Cause 4: Missing Content-Type Header
```
❌ Wrong:
curl -X POST http://localhost:4000/api/users/register \
  -d '{"email": "test@example.com", ...}'

✅ Correct:
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", ...}'
```

---

## ❌ Issue: "Cannot connect to backend"

### What It Means
Your request can't reach the backend server.

### Causes & Solutions

#### Cause 1: Backend Not Running

**Check if backend is running:**
```bash
# Terminal should show something like:
# Server running on port 4000
# Connected to MongoDB...
```

**Start backend if not running:**
```bash
cd apps/backend && pnpm dev
```

#### Cause 2: Wrong Port

**Check backend is on port 4000:**
```bash
# Look at backend console output
# Should say: "listening on port 4000" or similar

# Check if port is in use
lsof -i :4000  # macOS/Linux
netstat -ano | findstr :4000  # Windows
```

**If port is in use:**
```bash
# Kill the process using port 4000
# Then restart backend
```

#### Cause 3: Wrong URL

**Make sure you're using:**
```
http://localhost:4000/api/users/register
                ^^^^^ ^^^ exact!
```

#### Cause 4: MongoDB Not Connected

**Check MongoDB connection:**
```bash
# Backend console should show:
# ✓ Connected to MongoDB
# or
# Database: Connected

# If not, check:
# - MongoDB is running
# - Connection string is correct
# - Network connectivity
```

---

## ❌ Issue: JSON Parsing Error

### What It Means
Your JSON syntax is incorrect.

### Common JSON Mistakes

#### Mistake 1: Single Quotes Instead of Double Quotes
```
❌ Wrong:
{'email': 'harsh@example.com'}

✅ Correct:
{"email": "harsh@example.com"}
```

#### Mistake 2: Missing Commas
```
❌ Wrong:
{
  "email": "harsh@example.com"
  "password": "password123"
}

✅ Correct:
{
  "email": "harsh@example.com",
  "password": "password123"
}
```

#### Mistake 3: Trailing Comma
```
❌ Wrong:
{
  "email": "harsh@example.com",
  "password": "password123",
}

✅ Correct:
{
  "email": "harsh@example.com",
  "password": "password123"
}
```

#### Validate JSON
Use an online tool: https://jsonlint.com/

---

## ❌ Issue: "Unexpected token" Error

### What It Means
The server received malformed data.

### Solutions

#### Check Your cURL Command
```bash
# This works (all on one line or with line breaks):
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test","role":"admin"}'

# Copy-paste the entire command exactly
```

#### Escape Quotes Properly
```bash
# macOS/Linux - Use single quotes for outer
curl -X POST http://localhost:4000/api/users/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com"}'

# Windows - Use double quotes and escape inner quotes
curl -X POST http://localhost:4000/api/users/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\"}"
```

---

## ❌ Issue: Can't Login After Registration

### What It Means
Registration succeeded but login fails.

### Causes & Solutions

#### Cause 1: Wrong Credentials
```
Check:
- Email exactly matches what you registered
- Password exactly matches (case-sensitive)
- No extra spaces before/after
```

#### Cause 2: User Wasn't Actually Created
```bash
# Check in MongoDB if user exists
mongosh "your-mongodb-uri"
use ecommerce
db.users.findOne({ email: "harsh@example.com" })

# Should return user data
# If it returns null, user wasn't created
```

#### Cause 3: Backend Down
```bash
# Check if backend is running
curl http://localhost:4000/api/users/login -X POST

# Should get error, not "Connection refused"
```

---

## ❌ Issue: Dashboard Shows "Please login again"

### What It Means
Your session expired or token is invalid.

### Solutions

#### Solution 1: Clear localStorage and Login Again
```javascript
// In browser console (F12)
localStorage.clear()
// Then refresh and login again
```

#### Solution 2: Logout and Login
1. Close browser or go to another site
2. Clear cookies
3. Go to http://localhost:3001
4. Login again

#### Solution 3: Backend Issue
- Check if backend is still running
- Restart backend: `cd apps/backend && pnpm dev`
- Try login again

---

## ❌ Issue: MongoDB Connection Error

### What It Means
Backend can't connect to MongoDB.

### Check MongoDB

#### Local MongoDB
```bash
# Check if mongod is running
# macOS: look for mongodb in Activity Monitor
# Linux: ps aux | grep mongod
# Windows: check Services

# Start MongoDB if not running
mongod  # or: brew services start mongodb-community
```

#### MongoDB Atlas (Cloud)
```bash
# Check connection string in MONGODB_URI
# Should look like:
# mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Verify:
- Username and password are correct
- IP address is whitelisted
- Database name is correct
- Network is connected
```

#### Fix Connection
```bash
# In apps/backend/.env
MONGODB_URI=mongodb://localhost:27017/ecommerce

# Or for MongoDB Atlas:
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ecommerce

# Restart backend
cd apps/backend && pnpm dev
```

---

## ❌ Issue: "Role is not valid"

### What It Means
You used a role that doesn't exist.

### Valid Roles
```json
{
  "role": "admin"         // ✅ Full access
}

// or

{
  "role": "store_owner"   // ✅ Can manage store
}

// or

{
  "role": "customer"      // ✅ Can buy products
}
```

### Invalid Roles
```
❌ "role": "super_admin"
❌ "role": "owner"
❌ "role": "user"
❌ "role": "Admin"  // case-sensitive!
```

---

## 🧪 Testing Your Setup

### Test 1: Backend Connection
```bash
curl http://localhost:4000/api/users/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Should get error about invalid credentials (not connection error)
```

### Test 2: Create User
```bash
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test123@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "admin"
  }'

# Should return success with token
```

### Test 3: Login
```bash
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test123@example.com",
    "password": "password123"
  }'

# Should return success with token
```

### Test 4: Dashboard Access
```
Open: http://localhost:3001
Click: Sign In
Enter: test123@example.com
Enter: password123
Click: Sign In

Should see dashboard or error message
```

---

## 📋 Checklist Before You Start

- [ ] Backend running? (`cd apps/backend && pnpm dev`)
- [ ] Backend shows "listening on port 4000"?
- [ ] MongoDB connected? (Backend shows connection message)
- [ ] Admin dashboard running? (`cd apps/admin && pnpm dev`)
- [ ] Dashboard on port 3001? (`http://localhost:3001`)
- [ ] Internet connection working?

---

## 🆘 Still Having Issues?

### Gather Information
```bash
# Get backend version
cd apps/backend && npm list

# Check Node version
node --version

# Check MongoDB status
mongosh --eval "db.serverStatus()"

# Check ports
lsof -i :4000  # Backend port
lsof -i :3001  # Admin port
```

### Check Logs
```bash
# Backend logs in terminal where you ran pnpm dev
# Look for errors with red text

# Browser console (F12 in Chrome)
# Look for red error messages
```

### Reset Everything
```bash
# Stop all services (Ctrl+C)

# Clear caches
cd apps/backend && rm -rf node_modules/.cache .next
cd apps/admin && rm -rf .next node_modules/.cache

# Clear database (if needed)
# Connect to MongoDB and run: db.users.deleteMany({})

# Restart
cd apps/backend && pnpm dev
cd apps/admin && pnpm dev
```

---

## 📞 Get Help

1. **Read full guide**: `USER_SETUP_GUIDE.md`
2. **Quick reference**: `QUICK_USER_SETUP.md`
3. **Step-by-step**: `STEP_BY_STEP_GUIDE.md`
4. **All docs**: `ADMIN_DOCS_INDEX_v2.md`

---

**Common issue?** Check above. Still stuck? Review the full guides or restart both services.

*Last Updated: November 13, 2025*
