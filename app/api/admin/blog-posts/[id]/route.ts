import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { withAuth } from '@/lib/auth-middleware';

/**
 * PATCH /api/admin/blog-posts/[id]
 * Update a blog post (status, admin_notes, is_featured, etc.) for super admin.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const supabase = createServiceClient();

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        ...(body.updated_by && { updated_by: body.updated_by })
      };

      if (body.status !== undefined) {
        updateData.status = body.status;
        if (body.status === 'approved') {
          updateData.approval_date = new Date().toISOString();
        }
        if (body.status === 'published') {
          updateData.publish_date = new Date().toISOString();
        }
      }
      if (body.admin_notes !== undefined) updateData.admin_notes = body.admin_notes;
      if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;

      const { data, error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating blog post:', error);
        return NextResponse.json(
          { error: 'Failed to update post', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, post: data });
    } catch (err: any) {
      console.error('PATCH /api/admin/blog-posts/[id] error:', err);
      return NextResponse.json(
        { error: err.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }, { requireAdmin: true });
}

/**
 * DELETE /api/admin/blog-posts/[id]
 * Delete a blog post for super admin.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req) => {
    try {
      const { id } = await params;
      const supabase = createServiceClient();

      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting blog post:', error);
        return NextResponse.json(
          { error: 'Failed to delete post', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (err: any) {
      console.error('DELETE /api/admin/blog-posts/[id] error:', err);
      return NextResponse.json(
        { error: err.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }, { requireAdmin: true });
}
