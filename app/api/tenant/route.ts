// app/api/tenant/route.ts
// Tenant management API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getTenantId, ensureTenant, getTenantInfo, getUserTenantRole } from '@/lib/tenant/context';

/**
 * GET /api/tenant
 * Get current user's tenant information
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from header or auth
    const userId = request.headers.get('x-user-id') || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    // Get or create tenant
    const tenantId = await ensureTenant(userId);
    
    // Get tenant info
    const tenantInfo = await getTenantInfo(tenantId);
    const userRole = await getUserTenantRole(userId, tenantId);

    return NextResponse.json({
      tenant_id: tenantId,
      tenant: tenantInfo,
      role: userRole,
    });
  } catch (error: any) {
    console.error('Error getting tenant:', error);
    return NextResponse.json(
      { error: 'Failed to get tenant', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tenant
 * Create or update tenant membership
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, organizationId, role = 'member' } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // If organizationId provided, add user to that organization
    if (organizationId) {
      const { data, error } = await supabase
        .from('user_tenants')
        .upsert({
          user_id: userId,
          tenant_id: organizationId,
          role,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        tenant_id: data.tenant_id,
        role: data.role,
      });
    }

    // Otherwise, create personal tenant
    const tenantId = await ensureTenant(userId);
    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
    });
  } catch (error: any) {
    console.error('Error managing tenant:', error);
    return NextResponse.json(
      { error: 'Failed to manage tenant', details: error.message },
      { status: 500 }
    );
  }
}









