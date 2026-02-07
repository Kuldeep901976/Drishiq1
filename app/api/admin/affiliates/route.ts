// app/api/admin/affiliates/route.ts
// Admin API for affiliate CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { withAuth } from '@/lib/auth-middleware';

/**
 * POST /api/admin/affiliates
 * Create a new affiliate
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
      const { name, email, ref_code, payout_rate, payout_type, cookie_duration_days } = body;
      
      // Validate required fields
      if (!name || !ref_code || payout_rate === undefined) {
        return NextResponse.json(
          { error: 'Missing required fields: name, ref_code, payout_rate' },
          { status: 400 }
        );
      }
      
      // Check if ref_code already exists
      const { data: existing } = await supabase
        .from('affiliates')
        .select('id')
        .eq('ref_code', ref_code)
        .single();
      
      if (existing) {
        return NextResponse.json(
          { error: 'Ref code already exists' },
          { status: 409 }
        );
      }
      
      // Create affiliate
      const { data: affiliate, error: createError } = await supabase
      .from('affiliates')
      .insert({
        name,
        email,
        ref_code,
        payout_rate: parseFloat(payout_rate),
        payout_type: payout_type || 'percentage',
        cookie_duration_days: cookie_duration_days || 30,
        created_by: user.id
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating affiliate:', createError);
      return NextResponse.json(
        { error: 'Failed to create affiliate', details: createError.message },
        { status: 500 }
      );
    }
    
    // Log audit
    await supabase
      .from('affiliate_audit_log')
      .insert({
        affiliate_id: affiliate.id,
        action: 'create',
        entity_type: 'affiliate',
        entity_id: affiliate.id,
        admin_user_id: user.id,
        changes: { created: affiliate },
        ip_address: request.headers.get('x-forwarded-for') || '',
        user_agent: request.headers.get('user-agent') || ''
      });
    
      return NextResponse.json({
        success: true,
        data: affiliate
      });
      
    } catch (error: any) {
      console.error('Error in POST /api/admin/affiliates:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: error.message },
        { status: 500 }
      );
    }
  }, {
    requireAdmin: true
  });
}

/**
 * GET /api/admin/affiliates
 * List all affiliates with optional filters
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
    
      let query = supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,ref_code.ilike.%${search}%`);
      }
      
      const { data: affiliates, error } = await query;
      
      if (error) {
        console.error('Error fetching affiliates:', error);
        return NextResponse.json(
          { error: 'Failed to fetch affiliates', details: error.message },
          { status: 500 }
        );
      }
      
      // Optional: skip per-affiliate stats for faster list load (detail page has full stats)
      const withStats = searchParams.get('withStats') !== 'false';
      const defaultStats = {
        total_clicks: 0,
        total_conversions: 0,
        total_earnings: 0,
        pending_earnings: 0,
        paid_earnings: 0,
        conversion_rate: 0
      };
      
      if (!withStats || !affiliates?.length) {
        const data = (affiliates || []).map((a) => ({ ...a, stats: defaultStats }));
        return NextResponse.json({ success: true, data });
      }
      
      const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const toDate = new Date().toISOString();
      const ids = affiliates.map((a) => a.id);
      
      // Prefer batch RPC (one query) - run database/affiliate-stats-batch.sql in Supabase if needed
      const { data: batchStats, error: batchError } = await supabase.rpc('get_affiliate_stats_batch', {
        p_affiliate_ids: ids,
        p_from_date: fromDate,
        p_to_date: toDate
      });
      
      if (!batchError && Array.isArray(batchStats) && batchStats.length > 0) {
        const statsById = new Map(
          batchStats.map((row: { affiliate_id: string } & typeof defaultStats) => [
            row.affiliate_id,
            {
              total_clicks: Number(row.total_clicks ?? 0),
              total_conversions: Number(row.total_conversions ?? 0),
              total_earnings: Number(row.total_earnings ?? 0),
              pending_earnings: Number(row.pending_earnings ?? 0),
              paid_earnings: Number(row.paid_earnings ?? 0),
              conversion_rate: Number(row.conversion_rate ?? 0)
            }
          ])
        );
        const data = affiliates.map((a) => ({
          ...a,
          stats: statsById.get(a.id) ?? defaultStats
        }));
        return NextResponse.json({ success: true, data });
      }
      
      // Fallback: chunked single RPCs (N+1 mitigation when batch RPC not yet deployed)
      const CONCURRENCY = 10;
      const affiliatesWithStats = [];
      for (let i = 0; i < affiliates.length; i += CONCURRENCY) {
        const chunk = affiliates.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          chunk.map(async (affiliate) => {
            const { data: stats } = await supabase.rpc('get_affiliate_stats', {
              p_affiliate_id: affiliate.id,
              p_from_date: fromDate,
              p_to_date: toDate
            });
            return {
              ...affiliate,
              stats: stats?.[0] || defaultStats
            };
          })
        );
        affiliatesWithStats.push(...results);
      }
      
      return NextResponse.json({
        success: true,
        data: affiliatesWithStats
      });
      
    } catch (error: any) {
      console.error('Error in GET /api/admin/affiliates:', error);
      return NextResponse.json(
        { error: 'Internal server error', message: error.message },
        { status: 500 }
      );
    }
  }, {
    requireAdmin: true
  });
}

