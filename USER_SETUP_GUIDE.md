# User Setup Guide - Create Your First Admin Account

## 🎯 How to Create & Login as Owner

You have **two options** to create your first user account:

---

## Option 1: Using REST Client (Easiest) 🚀

### Step 1: Install Thunder Client (Optional but Recommended)
If you don't have a REST client, install one:
- **VS Code Extension**: Thunder Client (search in VS Code Extensions)
- **Alternatives**: Postman, Insomnia, or use `curl`

### Step 2: Create User via API

#### Using Thunder Client / Postman
```
METHOD: POST
URL: http://localhost:4000/api/users/register

Headers:
- Content-Type: application/json

Body (JSON):
{
  "email": "your-email@example.com",
  "password": "your-password",
  "name": "Your Name",
  "role": "admin"
}
```

#### Example with Your Info
```json
{
  "email": "harsh@example.com",
  "password": "password123",
  "name": "Harsh",
  "role": "admin"
}
```

#### Response (Success)
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "harsh@example.com",
      "name": "Harsh",
      "role": "admin"
    },
    "token": "eyJhbGc..."
  }
}
```

### Step 3: Login via Admin Dashboard

1. Go to `http://localhost:3001`
2. Click "Sign In"
3. Enter your credentials:
   - **Email**: harsh@example.com
   - **Password**: password123
4. Click "Sign In"
5. ✅ Done! You're logged in!

---

## Option 2: Using cURL (Terminal) 📟

### Step 1: Create User via Terminal

```bash
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "harsh@example.com",
    "password": "password123",
    "name": "Harsh",
    "role": "admin"
  }'
```

### Step 2: Login via Dashboard
Same as Option 1, Step 3

---

## Option 3: Database Direct Insert (Advanced) 🔧

If you want to add user directly to MongoDB:

### Prerequisites
- MongoDB client installed (MongoDB Compass or mongosh)
- Know your MongoDB connection string

### Steps

1. **Open MongoDB Compass or mongosh**
   ```bash
   # If using mongosh
   mongosh "your-mongodb-uri"
   ```

2. **Navigate to database**
   ```bash
   use ecommerce
   db.users.insertOne({
     "email": "harsh@example.com",
     "password": "$2a$10$...",  # bcrypt hashed password
     "name": "Harsh",
     "role": "admin",
     "createdAt": new Date(),
     "updatedAt": new Date()
   })
   ```

   ⚠️ **Note**: Password must be bcrypt hashed! 
   
   Use a tool to generate: [bcryptjs online tool](https://www.npmjs.com/package/bcryptjs)

---

## ✅ Recommended: Use Option 1 (REST Client)

### Why It's Best
- ✅ Password automatically hashed
- ✅ Token automatically generated
- ✅ No manual database access needed
- ✅ User validation works
- ✅ Easiest and safest

### Quick Steps
1. Use Thunder Client or Postman
2. POST to `http://localhost:4000/api/users/register`
3. Send email, password, name, role
4. Get response with token
5. Use same credentials to login on admin dashboard

---

## 🔐 User Roles Explained

| Role | Permissions | Can Do |
|------|-------------|--------|
| **customer** | Read products | Browse store |
| **store_owner** | CRUD store resources | Manage own store |
| **admin** | All operations | Manage all stores |

**For you**: Use `"role": "admin"` to have full access.

---

## 🚀 Complete Example - Step by Step

### Your Scenario
You want to create account for **harsh@example.com** as **admin**.

### Step 1: Using Thunder Client

1. Open VS Code
2. Click Extensions (left sidebar)
3. Search "Thunder Client"
4. Install it
5. Click Thunder Client icon
6. Click "New Request"
7. Set:
   - **Method**: POST
   - **URL**: http://localhost:4000/api/users/register
8. Click "Headers" tab
9. Add header:
   - **Key**: Content-Type
   - **Value**: application/json
10. Click "Body" tab
11. Select "JSON"
12. Paste:
    ```json
    {
      "email": "harsh@example.com",
      "password": "mypassword123",
      "name": "Harsh Kapil",
      "role": "admin"
    }
    ```
13. Click "Send"
14. ✅ See response with token

### Step 2: Login on Dashboard

1. Go to `http://localhost:3001`
2. Click "Sign In"
3. Enter:
   - **Email**: harsh@example.com
   - **Password**: mypassword123
4. Click "Sign In"
5. ✅ You're logged in as admin!

---

## 📝 What Information You Need

### Required Fields
- **email** (string) - Must be valid email format
- **password** (string) - Minimum 6 characters
- **name** (string) - Your name
- **role** (string) - 'admin', 'store_owner', or 'customer'

### Example Credentials to Use
```
Email: harsh@example.com          // Use your email
Password: password123             // Your choice (min 6 chars)
Name: Harsh Kapil                 // Your name
Role: admin                        // Full access
```

---

## 🔑 After Creating Account

### What You Get
✅ **Token** (JWT) - For API requests (auto-used by dashboard)
✅ **User Record** - Stored in MongoDB
✅ **Ability to Login** - On admin dashboard

### What Happens When You Login
1. Dashboard sends email + password to backend
2. Backend validates credentials
3. Returns new token
4. Token stored in localStorage
5. All future API requests include token

---

## ⚠️ Troubleshooting

### "Email already registered" error
**Solution**: Use a different email or delete the user first

### "Validation failed" error
**Solutions**:
- Make sure email is valid format
- Password is at least 6 characters
- Name is not empty
- Content-Type is application/json

### "Cannot connect to backend"
**Check**:
1. Is backend running? `cd apps/backend && pnpm dev`
2. Is it on port 4000? Check console output
3. Is MongoDB running?

### "Cannot login after registration"
**Check**:
1. Use the exact same email and password you registered
2. Check if backend is running
3. Check browser console for errors

---

## 🔄 Creating Multiple Users

You can create as many users as needed:

```bash
# Admin user
{
  "email": "admin@example.com",
  "password": "admin123",
  "name": "Admin User",
  "role": "admin"
}

# Store owner user
{
  "email": "owner@example.com",
  "password": "owner123",
  "name": "Store Owner",
  "role": "store_owner"
}

# Customer user
{
  "email": "customer@example.com",
  "password": "customer123",
  "name": "Customer",
  "role": "customer"
}
```

---

## 📊 Password Best Practices

### What NOT to Use
❌ "123456"
❌ "password"
❌ Empty
❌ Less than 6 characters

### What to Use
✅ "MySecure123!"
✅ "Admin@2025"
✅ "Store_Owner#456"
✅ Anything 6+ characters

---

## 🎯 Next Steps After Login

1. **Create Your First Store**
   - Click "Stores" in sidebar
   - Click "New Store"
   - Fill store details
   - Click "Create Store"

2. **Select Your Store**
   - Click store dropdown in header
   - Select your store

3. **Add Products**
   - Click "Products" in sidebar
   - Click "New Product"
   - Fill product details
   - Click "Create Product"

4. **Upload Media**
   - Use media upload in forms
   - Upload images for products/billboards

---

## 🧪 Test User Credentials

For testing, you can use these demo accounts:

```
# Already available demo account
Email: admin@example.com
Password: password

# Or create your own following this guide
```

---

## 📱 Token Explanation

When you register or login, you get a **JWT token**. This is:
- ✅ Automatically stored in localStorage
- ✅ Automatically sent with all API requests
- ✅ Validates your identity
- ✅ Expires after 7 days
- ✅ Can logout to clear it

You don't need to manage the token manually - the dashboard does it for you!

---

## ✨ You're All Set!

### Summary
1. Create user via `/register` endpoint (REST client or cURL)
2. Login via admin dashboard (`http://localhost:3001`)
3. Start managing your stores!

### Resources
- **API Endpoint**: POST `http://localhost:4000/api/users/register`
- **Dashboard**: `http://localhost:3001`
- **Default Role**: admin (for full access)

**Let me know if you run into any issues!** 🚀

---

*Last Updated: November 13, 2025*
*Version: 1.0*
