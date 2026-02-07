import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * POST /api/testimonials-stories/submit
 * Submit a guest story (bypasses RLS using service role)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      email,
      phone,
      country_code,
      phone_number,
      profession,
      phone_verified,
      content,
      preferred_language,
      category,
      image_url,
      status = 'pending',
      is_approved = false,
      is_published = false,
      consent_given = true,
    } = body;

    // Validate required fields
    if (!name || !email || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, content' },
        { status: 400 }
      );
    }

    // Create service client (bypasses RLS)
    const supabase = createServiceClient();

    const submissionData: any = {
      name,
      email,
      phone: phone || null,
      country_code: country_code || null,
      phone_number: phone_number || null,
      profession: profession || null,
      phone_verified: phone_verified || false,
      content,
      preferred_language: preferred_language || null,
      category: category || null,
      image_url: image_url || null,
      status,
      is_approved,
      is_published,
      consent_given,
      submission_type: 'story', // Add submission_type to avoid null constraint error
    };

    console.log('📤 Submitting to testimonials_stories via API:', submissionData);

    const { data, error } = await supabase
      .from('testimonials_stories')
      .insert(submissionData)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to submit story', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Story submitted successfully'
    });
  } catch (error: any) {
    console.error('Error in POST /api/testimonials-stories/submit:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

