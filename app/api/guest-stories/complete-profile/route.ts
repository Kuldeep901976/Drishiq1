import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// POST - Complete profile for approved guest story
// This is called when user completes profile after clicking magic link
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();
    const { userId, guestStoryId } = body;

    if (!userId || !guestStoryId) {
      return NextResponse.json(
        { error: 'userId and guestStoryId are required' },
        { status: 400 }
      );
    }

    // Get guest story
    const { data: guestStory, error: storyError } = await supabase
      .from('testimonials_stories')
      .select('approved_story_id, email')
      .eq('id', guestStoryId)
      .single();

    if (storyError || !guestStory) {
      return NextResponse.json(
        { error: 'Guest story not found' },
        { status: 404 }
      );
    }

    // Get user from users table (base table) - verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found in users table' },
        { status: 404 }
      );
    }

    // Verify email matches
    if (user.email !== guestStory.email) {
      return NextResponse.json(
        { error: 'Email mismatch' },
        { status: 400 }
      );
    }

    // IMPORTANT: Use users.id (userId) consistently across all tables
    // Link testimonial to user using users.id
    if (guestStory.approved_story_id) {
      const { error: updateError } = await supabase
        .from('testimonials')
        .update({ user_id: userId }) // users.id - same ID used in all tables
        .eq('id', guestStory.approved_story_id);

      if (updateError) {
        console.error('Error linking testimonial:', updateError);
        return NextResponse.json(
          { error: 'Failed to link testimonial', details: updateError.message },
          { status: 500 }
        );
      }
    }

    // Grant trial credits (1 credit) using users.id
    // This will update: transactions, user_credits_balance, and users.credits tables
    // All using the same users.id
    try {
      const { data: transactionData, error: creditError } = await supabase.rpc('add_credits_to_user', {
        p_user_id: userId, // users.id - same ID across transactions, user_credits_balance, users tables
        p_credits: 1,
        p_transaction_type: 'granted',
        p_description: `Trial access credit granted from approved testimonials_stories entry (ID: ${guestStoryId})`
      });

      if (creditError) {
        console.error('Error adding credits:', creditError);
        // Continue even if credit addition fails
      } else {
        console.log('✅ Granted 1 trial credit to user');
      }
    } catch (creditErr: any) {
      console.error('Error in credit grant:', creditErr);
      // Continue even if credit addition fails
    }

    return NextResponse.json({
      success: true,
      message: 'Profile completion processed successfully',
      testimonialLinked: !!guestStory.approved_story_id
    });
  } catch (error: any) {
    console.error('Error in POST /api/guest-stories/complete-profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

