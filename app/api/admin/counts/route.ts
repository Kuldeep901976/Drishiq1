import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * GET /api/admin/counts
 * Get counts for all admin dashboard sections
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch all counts in parallel
    const [
      blogCount,
      testimonialCount,
      guestStoryCount,
      userCount,
      requestCount
    ] = await Promise.all([
      // Blog posts count
      supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .then(({ count, error }) => {
          if (error) {
            console.error('Error fetching blog count:', error);
            return 0;
          }
          return count || 0;
        }),
      
      // Testimonials count (from testimonials table)
      supabase
        .from('testimonials')
        .select('*', { count: 'exact', head: true })
        .then(({ count, error }) => {
          if (error) {
            console.error('Error fetching testimonial count:', error);
            return 0;
          }
          return count || 0;
        }),
      
      // Guest stories count (from testimonials_stories with submission_type='story' or NULL)
      supabase
        .from('testimonials_stories')
        .select('*', { count: 'exact', head: true })
        .or('submission_type.eq.story,submission_type.is.null')
        .then(({ count, error }) => {
          if (error) {
            console.error('Error fetching guest story count:', error);
            // Fallback: get all from testimonials_stories
            return supabase
              .from('testimonials_stories')
              .select('*', { count: 'exact', head: true })
              .then(({ count: gCount }) => gCount || 0);
          }
          return count || 0;
        }),
      
      // Users count
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .then(({ count, error }) => {
          if (error) {
            console.error('Error fetching user count:', error);
            return 0;
          }
          return count || 0;
        }),
      
      // Requests count
      supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .then(({ count, error }) => {
          if (error) {
            console.error('Error fetching request count:', error);
            return 0;
          }
          return count || 0;
        })
    ]);

    return NextResponse.json({
      success: true,
      counts: {
        blogs: blogCount,
        testimonials: testimonialCount,
        guestStories: guestStoryCount,
        users: userCount,
        requests: requestCount
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/counts:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message,
        counts: {
          blogs: 0,
          testimonials: 0,
          guestStories: 0,
          users: 0,
          requests: 0
        }
      },
      { status: 500 }
    );
  }
}

