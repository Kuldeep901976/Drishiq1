// app/api/admin/testimonials/route.ts
// Admin API for testimonials management

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { withAuth } from '@/lib/auth-middleware';

/**
 * GET /api/admin/testimonials
 * List all testimonials with optional filters
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (request, user) => {
    try {
      const supabase = createServiceClient();
      if (!supabase) {
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 503 }
        );
      }

      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = (page - 1) * limit;

      let query = supabase
        .from('testimonials')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Filter by status
      if (status && status !== 'all') {
        if (status === 'pending') {
          query = query.eq('is_approved', false).is('is_published', null);
        } else if (status === 'approved') {
          query = query.eq('is_approved', true);
        } else if (status === 'published') {
          query = query.eq('is_published', true);
        } else if (status === 'rejected') {
          query = query.eq('is_approved', false).eq('status', 'rejected');
        }
      }

      // Search filter
      if (search) {
        query = query.or(`content.ilike.%${search}%,user_name.ilike.%${search}%`);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: testimonials, error, count } = await query;

      if (error) {
        console.error('Error fetching testimonials:', error);
        return NextResponse.json(
          { error: 'Failed to fetch testimonials', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: testimonials || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (error: any) {
      console.error('Error in GET /api/admin/testimonials:', error);
      return NextResponse.json(
        { error: 'Internal server error', details: error.message },
        { status: 500 }
      );
    }
  }, { requireAdmin: true });
}

/**
 * POST /api/admin/testimonials
 * Update testimonial status (approve, reject, publish)
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (request, user) => {
    try {
      const supabase = createServiceClient();
      if (!supabase) {
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 503 }
        );
      }

      const body = await request.json();
      const { action, testimonialId, adminNotes } = body;

      if (!action || !testimonialId) {
        return NextResponse.json(
          { error: 'Missing required fields: action, testimonialId' },
          { status: 400 }
        );
      }

      // Get current testimonial
      const { data: testimonial, error: fetchError } = await supabase
        .from('testimonials')
        .select('*')
        .eq('id', testimonialId)
        .single();

      if (fetchError || !testimonial) {
        return NextResponse.json(
          { error: 'Testimonial not found' },
          { status: 404 }
        );
      }

      let updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      switch (action) {
        case 'approve':
          updateData.is_approved = true;
          updateData.status = 'approved';
          break;
        case 'reject':
          updateData.is_approved = false;
          updateData.status = 'rejected';
          break;
        case 'publish':
          updateData.is_published = true;
          updateData.published_at = new Date().toISOString();
          break;
        case 'unpublish':
          updateData.is_published = false;
          updateData.published_at = null;
          break;
        default:
          return NextResponse.json(
            { error: `Invalid action: ${action}. Must be: approve, reject, publish, or unpublish` },
            { status: 400 }
          );
      }

      const { data: updated, error: updateError } = await supabase
        .from('testimonials')
        .update(updateData)
        .eq('id', testimonialId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating testimonial:', updateError);
        return NextResponse.json(
          { error: 'Failed to update testimonial', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Testimonial ${action}d successfully`,
        data: updated
      });
    } catch (error: any) {
      console.error('Error in POST /api/admin/testimonials:', error);
      return NextResponse.json(
        { error: 'Internal server error', details: error.message },
        { status: 500 }
      );
    }
  }, { requireAdmin: true });
}


