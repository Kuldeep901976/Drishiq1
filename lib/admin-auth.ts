// lib/admin-auth.ts
// Admin authentication utilities for Supabase

import { NextRequest } from 'next/server';
import { createServiceClient } from './supabase';
import { cookies } from 'next/headers';

/**
 * Check if current user is super admin
 * ONLY super admin can access admin module
 * Use this in API routes and server components
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return false;
    
    const cookieStore = cookies();
    const { data: { user } } = await supabase.auth.getUser(
      cookieStore.get('sb-access-token')?.value || ''
    );
    
    if (!user) return false;
    
    // Check user role in database - ONLY super_admin is allowed
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    return userData?.role === 'super_admin';
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

/**
 * Get current admin user ID
 */
export async function getAdminUserId(): Promise<string | null> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return null;
    
    const cookieStore = cookies();
    const { data: { user } } = await supabase.auth.getUser(
      cookieStore.get('sb-access-token')?.value || ''
    );
    
    return user?.id || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if current user is admin (alias for isAdmin for backward compatibility)
 */
export async function checkAdminAuth(): Promise<boolean> {
  return isAdmin();
}

/**
 * Check admin access from a NextRequest
 * Returns an object with isAdmin boolean
 */
export async function checkAdminAccess(req: NextRequest): Promise<{ isAdmin: boolean }> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return { isAdmin: false };
    
    // Get token from cookie or Authorization header
    const token = req.cookies.get('sb-access-token')?.value || 
                  req.cookies.get('token')?.value ||
                  req.headers.get('authorization')?.replace(/^Bearer\s+/, '');
    
    if (!token) {
      return { isAdmin: false };
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { isAdmin: false };
    }
    
    // Check user role in database - ONLY super_admin is allowed
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    return { isAdmin: userData?.role === 'super_admin' };
  } catch (error) {
    console.error('Error checking admin access:', error);
    return { isAdmin: false };
  }
}

