import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * GET /api/community/suggestions
 * Fetch all community suggestions (for admin)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('community_suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch suggestions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      suggestions: data || [],
    });
  } catch (error: any) {
    console.error('Error in GET /api/community/suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/suggestions
 * Submit a community suggestion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      category,
      title,
      description,
      priority,
      impact,
      additionalDetails,
      contactEmail,
      allowContact,
      submitterName,
      submitterType = 'guest',
    } = body;

    // Validate required fields
    if (!category || !title || !description || !priority || !impact) {
      return NextResponse.json(
        { error: 'Missing required fields: category, title, description, priority, impact' },
        { status: 400 }
      );
    }

    // Create service client (bypasses RLS)
    const supabase = createServiceClient();

    const submissionData: any = {
      category,
      title,
      description,
      priority,
      impact,
      additional_details: additionalDetails || null,
      contact_email: contactEmail || null,
      allow_contact: allowContact || false,
      submitter_name: submitterName || null,
      submitter_type: submitterType || 'guest',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('📤 Submitting to community_suggestions via API:', submissionData);

    const { data, error } = await supabase
      .from('community_suggestions')
      .insert(submissionData)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to submit suggestion', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Suggestion submitted successfully'
    });
  } catch (error: any) {
    console.error('Error in POST /api/community/suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}





