#!/bin/bash

# Admin User Setup Script
# This script helps you create your first admin user

echo "🚀 Admin Dashboard - User Setup"
echo "================================"
echo ""

# Check if backend is running
echo "⏳ Checking if backend is running on port 4000..."
if ! curl -s http://localhost:4000/api > /dev/null 2>&1; then
    echo "❌ Backend is not running!"
    echo "Start it with: cd apps/backend && pnpm dev"
    exit 1
fi
echo "✅ Backend is running"
echo ""

# Get user input
echo "📝 Enter your details:"
echo ""

read -p "Email (e.g., harsh@example.com): " EMAIL
read -p "Full Name (e.g., Harsh Kapil): " NAME
read -sp "Password (min 6 characters): " PASSWORD
echo ""
read -sp "Confirm Password: " PASSWORD_CONFIRM
echo ""

# Validate inputs
if [ "$PASSWORD" != "$PASSWORD_CONFIRM" ]; then
    echo "❌ Passwords don't match!"
    exit 1
fi

if [ ${#PASSWORD} -lt 6 ]; then
    echo "❌ Password must be at least 6 characters!"
    exit 1
fi

if [ -z "$EMAIL" ] || [ -z "$NAME" ]; then
    echo "❌ Email and Name cannot be empty!"
    exit 1
fi

echo ""
echo "📤 Creating user..."
echo ""

# Make API request
RESPONSE=$(curl -s -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"$NAME\",
    \"role\": \"admin\"
  }")

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ User created successfully!"
    echo ""
    echo "🎉 Your account details:"
    echo "   Email: $EMAIL"
    echo "   Name: $NAME"
    echo "   Role: admin"
    echo ""
    echo "🔐 Now you can login:"
    echo "   1. Go to http://localhost:3001"
    echo "   2. Click 'Sign In'"
    echo "   3. Enter your email and password"
    echo "   4. Click 'Sign In'"
    echo ""
    echo "✨ You're all set! Happy managing! 🚀"
else
    echo "❌ Failed to create user"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
fi
