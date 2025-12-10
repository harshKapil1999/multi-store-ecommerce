#!/usr/bin/env node

/**
 * User Setup Script
 * Creates your first admin user for the dashboard
 * 
 * Usage: node setup-user.js
 */

const axios = require('axios');
const readline = require('readline');

const API_URL = process.env.API_URL || 'http://localhost:4000/api';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🚀 Admin Dashboard - User Setup\n');
  console.log('='.repeat(40));
  console.log();

  try {
    // Check if backend is running
    console.log('⏳ Checking if backend is running...');
    try {
      await axios.get(`${API_URL}/health`);
    } catch {
      // Health check endpoint might not exist, try register endpoint
      try {
        await axios.post(`${API_URL}/users/login`, {}, { validateStatus: () => true });
      } catch {
        throw new Error('Backend is not running on ' + API_URL);
      }
    }
    console.log('✅ Backend is running\n');

    // Get user input
    console.log('📝 Enter your details:\n');

    const email = await question('Email (e.g., harsh@example.com): ');
    const name = await question('Full Name (e.g., Harsh Kapil): ');
    const password = await question('Password (min 6 characters): ');
    const confirmPassword = await question('Confirm Password: ');

    console.log();

    // Validate inputs
    if (!email || !name || !password) {
      console.error('❌ Email, name, and password are required!');
      process.exit(1);
    }

    if (password !== confirmPassword) {
      console.error('❌ Passwords do not match!');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters!');
      process.exit(1);
    }

    if (!email.includes('@')) {
      console.error('❌ Invalid email format!');
      process.exit(1);
    }

    console.log('📤 Creating user...\n');

    // Create user
    const response = await axios.post(`${API_URL}/users/register`, {
      email,
      name,
      password,
      role: 'admin',
    });

    if (response.data.success) {
      const user = response.data.data.user;

      console.log('✅ User created successfully!\n');
      console.log('🎉 Your account details:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log();
      console.log('🔐 Now you can login:');
      console.log('   1. Go to http://localhost:3001');
      console.log('   2. Click "Sign In"');
      console.log(`   3. Enter ${email} and your password`);
      console.log('   4. Click "Sign In"');
      console.log();
      console.log('✨ You\'re all set! Happy managing! 🚀\n');
    } else {
      console.error('❌ Failed to create user');
      console.error(response.data.message || 'Unknown error');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', error.response.data);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
