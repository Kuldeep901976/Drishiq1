/**
 * Admin API: Onboarding Analytics
 * Provides analytics data for onboarding chat sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { checkAdminAccess } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess(req);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'overview';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const threadId = searchParams.get('threadId');

    const supabase = createServiceClient();

    switch (action) {
      case 'overview': {
        // Get summary statistics
        const query = supabase
          .from('onboarding_concierge_data')
          .select('*', { count: 'exact' });

        if (startDate) {
          query.gte('created_at', startDate);
        }
        if (endDate) {
          query.lte('created_at', endDate + 'T23:59:59');
        }

        const { data: sessions, error, count } = await query;

        if (error) throw error;

        // Calculate aggregates
        const totalSessions = count || 0;
        const totalTokensIn = sessions?.reduce((sum, s) => sum + (s.total_tokens_in || 0), 0) || 0;
        const totalTokensOut = sessions?.reduce((sum, s) => sum + (s.total_tokens_out || 0), 0) || 0;
        const totalCost = sessions?.reduce((sum, s) => sum + (parseFloat(s.total_cost_usd || '0') || 0), 0) || 0;
        const totalRequests = sessions?.reduce((sum, s) => sum + (s.request_count || 0), 0) || 0;
        
        // Count unique IPs
        const uniqueIPs = new Set(sessions?.map(s => s.ip_address || s.first_ip_address).filter(Boolean)).size;
        
        // Count completed sessions (transferred to main chat)
        const completedSessions = sessions?.filter(s => s.transferred_to_main_chat_at).length || 0;

        // Average stages completed
        const avgStagesCompleted = sessions?.length 
          ? sessions.reduce((sum, s) => sum + ((s.completed_stages as any[])?.length || 0), 0) / sessions.length 
          : 0;

        return NextResponse.json({
          success: true,
          data: {
            totalSessions,
            totalTokensIn,
            totalTokensOut,
            totalTokens: totalTokensIn + totalTokensOut,
            totalCost,
            totalRequests,
            uniqueIPs,
            completedSessions,
            completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
            avgStagesCompleted: Math.round(avgStagesCompleted * 10) / 10,
            avgTokensPerSession: totalSessions > 0 ? Math.round((totalTokensIn + totalTokensOut) / totalSessions) : 0,
            avgCostPerSession: totalSessions > 0 ? totalCost / totalSessions : 0
          }
        });
      }

      case 'sessions': {
        // Get detailed session list
        const query = supabase
          .from('onboarding_concierge_data')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (startDate) {
          query.gte('created_at', startDate);
        }
        if (endDate) {
          query.lte('created_at', endDate + 'T23:59:59');
        }
        if (threadId) {
          query.eq('thread_id', threadId);
        }

        const { data: sessions, error } = await query;

        if (error) throw error;

        // Format sessions with computed fields
        const formattedSessions = sessions?.map(session => ({
          threadId: session.thread_id,
          userId: session.user_id,
          ipAddress: session.ip_address || session.first_ip_address,
          firstIPAddress: session.first_ip_address,
          userAgent: session.user_agent,
          currentStage: session.current_stage,
          completedStages: (session.completed_stages as any[]) || [],
          stagesCompleted: (session.completed_stages as any[])?.length || 0,
          totalTokensIn: session.total_tokens_in || 0,
          totalTokensOut: session.total_tokens_out || 0,
          totalTokens: (session.total_tokens_in || 0) + (session.total_tokens_out || 0),
          totalCost: parseFloat(session.total_cost_usd || '0') || 0,
          modelsUsed: (session.models_used as any[]) || [],
          requestCount: session.request_count || 0,
          language: session.dds_state?.userProfile?.language || 'en',
          country: session.country,
          city: session.city,
          createdAt: session.created_at,
          lastAccessedAt: session.last_accessed_at,
          completedAt: session.completed_at,
          transferredToMainChat: !!session.transferred_to_main_chat_at,
          transferredAt: session.transferred_to_main_chat_at
        })) || [];

        return NextResponse.json({
          success: true,
          data: formattedSessions
        });
      }

      case 'by-stage': {
        // Get analytics grouped by stage
        const { data: analytics, error } = await supabase
          .from('onboarding_analytics')
          .select('stage_id, tokens_in, tokens_out, cost_usd, model')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const stageStats: Record<string, any> = {};

        analytics?.forEach(record => {
          const stage = record.stage_id || 'unknown';
          if (!stageStats[stage]) {
            stageStats[stage] = {
              stageId: stage,
              totalTokensIn: 0,
              totalTokensOut: 0,
              totalCost: 0,
              requestCount: 0,
              models: new Set<string>()
            };
          }
          stageStats[stage].totalTokensIn += record.tokens_in || 0;
          stageStats[stage].totalTokensOut += record.tokens_out || 0;
          stageStats[stage].totalCost += parseFloat(record.cost_usd || '0') || 0;
          stageStats[stage].requestCount += 1;
          if (record.model) {
            stageStats[stage].models.add(record.model);
          }
        });

        const formatted = Object.values(stageStats).map((stat: any) => ({
          ...stat,
          models: Array.from(stat.models),
          totalTokens: stat.totalTokensIn + stat.totalTokensOut
        }));

        return NextResponse.json({
          success: true,
          data: formatted
        });
      }

      case 'by-model': {
        // Get analytics grouped by model
        const { data: analytics, error } = await supabase
          .from('onboarding_analytics')
          .select('model, tokens_in, tokens_out, cost_usd')
          .not('model', 'is', null);

        if (error) throw error;

        const modelStats: Record<string, any> = {};

        analytics?.forEach(record => {
          const model = record.model || 'unknown';
          if (!modelStats[model]) {
            modelStats[model] = {
              model,
              totalTokensIn: 0,
              totalTokensOut: 0,
              totalCost: 0,
              requestCount: 0
            };
          }
          modelStats[model].totalTokensIn += record.tokens_in || 0;
          modelStats[model].totalTokensOut += record.tokens_out || 0;
          modelStats[model].totalCost += parseFloat(record.cost_usd || '0') || 0;
          modelStats[model].requestCount += 1;
        });

        const formatted = Object.values(modelStats).map((stat: any) => ({
          ...stat,
          totalTokens: stat.totalTokensIn + stat.totalTokensOut
        }));

        return NextResponse.json({
          success: true,
          data: formatted
        });
      }

      case 'by-ip': {
        // Get analytics grouped by IP address
        const query = supabase
          .from('onboarding_concierge_data')
          .select('ip_address, first_ip_address, thread_id, total_tokens_in, total_tokens_out, total_cost_usd, request_count');

        if (startDate) {
          query.gte('created_at', startDate);
        }
        if (endDate) {
          query.lte('created_at', endDate + 'T23:59:59');
        }

        const { data: sessions, error } = await query;

        if (error) throw error;

        const ipStats: Record<string, any> = {};

        sessions?.forEach(session => {
          const ip = session.ip_address || session.first_ip_address;
          if (!ip) return;

          if (!ipStats[ip]) {
            ipStats[ip] = {
              ipAddress: ip,
              sessionCount: 0,
              totalTokensIn: 0,
              totalTokensOut: 0,
              totalCost: 0,
              totalRequests: 0
            };
          }
          ipStats[ip].sessionCount += 1;
          ipStats[ip].totalTokensIn += session.total_tokens_in || 0;
          ipStats[ip].totalTokensOut += session.total_tokens_out || 0;
          ipStats[ip].totalCost += parseFloat(session.total_cost_usd || '0') || 0;
          ipStats[ip].totalRequests += session.request_count || 0;
        });

        const formatted = Object.values(ipStats).map((stat: any) => ({
          ...stat,
          totalTokens: stat.totalTokensIn + stat.totalTokensOut
        }));

        return NextResponse.json({
          success: true,
          data: formatted
        });
      }

      case 'time-series': {
        // Get time series data
        const query = supabase
          .from('onboarding_concierge_data')
          .select('created_at, total_tokens_in, total_tokens_out, total_cost_usd, request_count')
          .order('created_at', { ascending: true });

        if (startDate) {
          query.gte('created_at', startDate);
        }
        if (endDate) {
          query.lte('created_at', endDate + 'T23:59:59');
        }

        const { data: sessions, error } = await query;

        if (error) throw error;

        // Group by date
        const dailyStats: Record<string, any> = {};

        sessions?.forEach(session => {
          const date = new Date(session.created_at).toISOString().split('T')[0];
          if (!dailyStats[date]) {
            dailyStats[date] = {
              date,
              sessionCount: 0,
              totalTokensIn: 0,
              totalTokensOut: 0,
              totalCost: 0,
              totalRequests: 0
            };
          }
          dailyStats[date].sessionCount += 1;
          dailyStats[date].totalTokensIn += session.total_tokens_in || 0;
          dailyStats[date].totalTokensOut += session.total_tokens_out || 0;
          dailyStats[date].totalCost += parseFloat(session.total_cost_usd || '0') || 0;
          dailyStats[date].totalRequests += session.request_count || 0;
        });

        const formatted = Object.values(dailyStats).map((stat: any) => ({
          ...stat,
          totalTokens: stat.totalTokensIn + stat.totalTokensOut
        }));

        return NextResponse.json({
          success: true,
          data: formatted
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('❌ [Onboarding Analytics API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


