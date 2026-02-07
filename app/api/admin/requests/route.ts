import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// GET - Fetch requests with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const requestType = searchParams.get('request_type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    const supabase = createServiceClient();
    let query = supabase
      .from('requests')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (requestType) {
      query = query.eq('request_type', requestType);
    }
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch requests', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('Error in GET /api/admin/requests:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update request status (individual or bulk)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestIds, status, notes, reviewedBy } = body;

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json(
        { error: 'Request IDs are required' },
        { status: 400 }
      );
    }

    if (!status || !['pending', 'reviewing', 'approved', 'rejected', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === 'approved' || status === 'rejected') {
      updateData.reviewed_at = new Date().toISOString();
      if (reviewedBy) {
        updateData.reviewed_by = reviewedBy;
      }
    }

    const { data, error } = await supabase
      .from('requests')
      .update(updateData)
      .in('id', requestIds)
      .select();

    if (error) {
      console.error('Error updating requests:', error);
      return NextResponse.json(
        { error: 'Failed to update requests', details: error.message },
        { status: 500 }
      );
    }

    // Log activities for each updated request
    if (data && data.length > 0) {
      const activityType = status === 'approved' ? 'request_approved' : 
                          status === 'rejected' ? 'request_rejected' : 
                          'request_updated';
      
      const activities = data.map((req: any) => ({
        user_id: null, // Request doesn't have user_id yet, will be set when invitation is sent
        activity_type: activityType,
        activity_category: 'request_management',
        actor_type: 'admin',
        actor_id: reviewedBy || null,
        target_type: 'request',
        target_id: req.id,
        title: `Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        description: `Request ${req.request_type} for ${req.email} was ${status}${notes ? `: ${notes}` : ''}`,
        request_id: req.id,
        status: 'completed',
        metadata: {
          request_type: req.request_type,
          previous_status: req.status,
          new_status: status,
          notes: notes || null
        }
      }));

      // Insert activities (ignore errors if table doesn't exist yet)
      try {
        await supabase
          .from('user_activities')
          .insert(activities);
      } catch (err: any) {
        console.warn('Could not log activities (table may not exist yet):', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${data?.length || 0} request(s)`,
      data
    });

  } catch (error: any) {
    console.error('Error in PATCH /api/admin/requests:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

