/**
 * User Management API
 * Handles user deactivation and deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { action, userId, reason } = await req.json();

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'Action and userId are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify the user making the request is the same user or an admin
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser || (currentUser.id !== userId && currentUser.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (action === 'deactivate') {
      // Deactivate user - set is_active to false
      const { error } = await supabase
        .from('users')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivation_reason: reason || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error deactivating user:', error);
        return NextResponse.json(
          { error: 'Failed to deactivate user', details: error.message },
          { status: 500 }
        );
      }

      // Sign out the user if they deactivated themselves
      if (currentUser.id === userId) {
        await supabase.auth.signOut();
      }

      return NextResponse.json({
        success: true,
        message: 'User deactivated successfully'
      });
    }

    if (action === 'activate') {
      // Reactivate user - set is_active to true
      const { error } = await supabase
        .from('users')
        .update({
          is_active: true,
          deactivated_at: null,
          deactivation_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error activating user:', error);
        return NextResponse.json(
          { error: 'Failed to activate user', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'User activated successfully'
      });
    }

    if (action === 'delete') {
      // Soft delete - mark as deleted but keep data
      const { error } = await supabase
        .from('users')
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
          deletion_reason: reason || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
          { error: 'Failed to delete user', details: error.message },
          { status: 500 }
        );
      }

      // Sign out the user if they deleted themselves
      if (currentUser.id === userId) {
        await supabase.auth.signOut();
      }

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "deactivate", "activate", or "delete"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in user management:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

