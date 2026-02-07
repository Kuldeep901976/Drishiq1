/**
 * Runtime API: Click Tracking & Redirect
 * Handles click tracking and redirects to destination URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const line_item_id = searchParams.get('line_item_id');
    const creative_id = searchParams.get('creative_id');
    const anon_id = searchParams.get('anon_id') || request.cookies.get('anon_id')?.value;
    const user_id = searchParams.get('user_id') || undefined;

    if (!line_item_id || !creative_id) {
      return NextResponse.json(
        { error: 'line_item_id and creative_id required' },
        { status: 400 }
      );
    }

    const supabase = createClient(request);

    // Get creative click URL
    const { data: creative, error: creativeError } = await supabase
      .from('creatives')
      .select('click_url_template')
      .eq('id', creative_id)
      .single();

    if (creativeError || !creative) {
      return NextResponse.json(
        { error: 'Creative not found' },
        { status: 404 }
      );
    }

    // Record click event (async - don't wait)
    if (anon_id) {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 null;
      const userAgent = request.headers.get('user-agent') || null;
      const referrer = request.headers.get('referer') || null;

      supabase
        .from('ad_events')
        .insert({
          event_type: 'click',
          creative_id,
          line_item_id,
          user_id: user_id || null,
          anon_id,
          ip: ip ? ip.split(',')[0].trim() : null,
          user_agent: userAgent,
          referrer,
        })
        .then(() => {
          // Event recorded
        })
        .catch((err) => {
          console.error('Click event recording error:', err);
        });
    }

    // Get destination URL
    let destinationUrl = creative.click_url_template || '#';

    // Replace template variables if any
    destinationUrl = destinationUrl
      .replace('{creative_id}', creative_id)
      .replace('{line_item_id}', line_item_id)
      .replace('{anon_id}', anon_id || '')
      .replace('{user_id}', user_id || '');

    // Redirect to destination
    return NextResponse.redirect(destinationUrl, { status: 302 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

