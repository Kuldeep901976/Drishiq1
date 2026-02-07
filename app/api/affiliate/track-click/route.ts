// app/api/affiliate/track-click/route.ts
// Track affiliate clicks and set proper cookies

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { 
  createAffiliateCookie, 
  getAffiliateCookieName,
  getDeviceFingerprint,
  extractUTMParams
} from '@/lib/affiliate-utils';
import { rateLimit } from '@/lib/redis';

/**
 * POST /api/affiliate/track-click
 * Track an affiliate click and set attribution cookie
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refCode, path, query, referer } = body;
    
    if (!refCode) {
      return NextResponse.json(
        { error: 'Ref code is required' },
        { status: 400 }
      );
    }
    
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }
    
    // Get affiliate by ref code
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, ref_code, status, cookie_duration_days')
      .eq('ref_code', refCode)
      .eq('status', 'active')
      .single();
    
    if (affiliateError || !affiliate) {
      console.warn(`Affiliate not found or inactive: ${refCode}`);
      return NextResponse.json(
        { error: 'Invalid affiliate code' },
        { status: 404 }
      );
    }
    
    // Get request metadata
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    const headers = new Headers(req.headers);
    const deviceFingerprint = getDeviceFingerprint(headers);
    
    // Extract UTM parameters
    const url = new URL(req.url);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }
    const utmParams = extractUTMParams(url);
    
    // Rate limiting: max 50 clicks per IP per hour
    const rateLimitKey = `click:${ip}`;
    const rateLimitResult = await rateLimit(rateLimitKey, 50, 3600); // 50 clicks per hour
    
    if (!rateLimitResult.allowed) {
      // Silently ignore - don't return error to user
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json({
        success: false,
        message: 'Rate limit exceeded'
      }, { status: 429 });
    }
    
    // Additional fraud check: database query for suspicious patterns
    const { data: recentClicks } = await supabase
      .from('affiliate_clicks')
      .select('id')
      .eq('ip', ip)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .limit(100);
    
    const isFraudulent = (recentClicks?.length || 0) >= 100 || !rateLimitResult.allowed;
    
    // Log the click
    const { data: click, error: clickError } = await supabase
      .from('affiliate_clicks')
      .insert({
        affiliate_id: affiliate.id,
        ref_code: refCode,
        ip: ip,
        user_agent: userAgent,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        utm_content: utmParams.utm_content,
        utm_term: utmParams.utm_term,
        utm_params: utmParams,
        landing_path: path || '/',
        referrer: referer,
        device_fingerprint: deviceFingerprint,
        is_fraudulent: isFraudulent,
        fraud_reason: isFraudulent ? 'Rate limit exceeded' : null
      })
      .select()
      .single();
    
    if (clickError) {
      console.error('Error logging affiliate click:', clickError);
      // Don't fail the request if logging fails
    }
    
    // Create response with proper affiliate cookie
    const response = NextResponse.json({
      success: true,
      affiliateId: affiliate.id,
      refCode: affiliate.ref_code
    });
    
    // Set proper affiliate cookie with full details
    const cookieDuration = affiliate.cookie_duration_days || 30;
    const cookieData = createAffiliateCookie(
      affiliate.ref_code,
      affiliate.id,
      cookieDuration
    );
    
    response.cookies.set(getAffiliateCookieName(), JSON.stringify(cookieData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieDuration * 24 * 60 * 60, // Convert days to seconds
      path: '/'
    });
    
    return response;
    
  } catch (error: any) {
    console.error('Error in track-click:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

