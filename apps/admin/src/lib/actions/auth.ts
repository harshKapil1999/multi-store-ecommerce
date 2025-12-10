'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import axios from 'axios';
import { createSession, deleteSession } from '@/lib/session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface LoginResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
  error?: string;
}

export async function loginAction(email: string, password: string): Promise<LoginResult> {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/login`, {
      email,
      password,
    });

    const { token, user } = response.data.data;

    // Create session with httpOnly cookie
    await createSession(user._id || user.id, user.email, user.role);

    // Revalidate the dashboard layout to pick up new session
    revalidatePath('/dashboard', 'layout');

    return {
      success: true,
      user: {
        id: user._id || user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Login failed',
    };
  }
}

export async function logoutAction() {
  await deleteSession();
  revalidatePath('/dashboard', 'layout');
  redirect('/login');
}
