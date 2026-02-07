// app/api/admin/system-health/route.ts
/**
 * System Health Endpoint
 * Returns comprehensive system health status for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { withAdminAuth } from '@/app/api/middleware/admin-auth';

interface SystemStatus {
  database: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  email: 'healthy' | 'warning' | 'error';
  payment: 'healthy' | 'warning' | 'error';
}

interface PerformanceMetrics {
  responseTime: number;
  uptime: number;
  errorRate: number;
  activeConnections: number;
}

async function checkDatabase(): Promise<'healthy' | 'warning' | 'error'> {
  try {
    const supabase = createServiceClient();
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.error('Database check error:', error);
      return 'error';
    }
    
    if (responseTime > 1000) {
      return 'warning';
    }
    
    return 'healthy';
  } catch (error) {
    console.error('Database check failed:', error);
    return 'error';
  }
}

async function checkStorage(): Promise<'healthy' | 'warning' | 'error'> {
  try {
    // Check if storage bucket is accessible
    const supabase = createServiceClient();
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return 'error';
    }
    
    return 'healthy';
  } catch (error) {
    return 'warning';
  }
}

async function checkEmail(): Promise<'healthy' | 'warning' | 'error'> {
  // Email service check - for now assume healthy if env vars are set
  const hasEmailConfig = !!(
    process.env.SMTP_HOST ||
    process.env.RESEND_API_KEY ||
    process.env.SENDGRID_API_KEY
  );
  
  return hasEmailConfig ? 'healthy' : 'warning';
}

async function checkPayment(): Promise<'healthy' | 'warning' | 'error'> {
  // Payment service check - for now assume healthy if env vars are set
  const hasPaymentConfig = !!(
    process.env.STRIPE_SECRET_KEY ||
    process.env.RAZORPAY_KEY_ID
  );
  
  return hasPaymentConfig ? 'healthy' : 'warning';
}

async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  try {
    const supabase = createServiceClient();
    
    // Get recent API response times from chat_usage_accounting or similar
    const { data: usageData } = await supabase
      .from('chat_usage_accounting')
      .select('processing_time_ms, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    
    // Calculate average response time
    const avgResponseTime = usageData && usageData.length > 0
      ? Math.round(
          usageData.reduce((sum, item) => sum + (item.processing_time_ms || 0), 0) / usageData.length
        )
      : 0;
    
    // Get error rate from recent requests (simplified - would need error tracking table)
    const errorRate = 0; // Placeholder - would calculate from error logs
    
    // Get active connections (simplified - would need connection tracking)
    const { data: activeThreads } = await supabase
      .from('chat_threads')
      .select('id')
      .eq('status', 'active')
      .limit(1000);
    
    const activeConnections = activeThreads?.length || 0;
    
    // Calculate uptime (simplified - would track from server start)
    const uptime = Math.floor(process.uptime() || 0);
    
    return {
      responseTime: avgResponseTime,
      uptime,
      errorRate,
      activeConnections
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return {
      responseTime: 0,
      uptime: 0,
      errorRate: 0,
      activeConnections: 0
    };
  }
}

async function systemHealthHandler(request: NextRequest) {
  try {
    // Run all health checks in parallel
    const [databaseStatus, storageStatus, emailStatus, paymentStatus, performance] = await Promise.all([
      checkDatabase(),
      checkStorage(),
      checkEmail(),
      checkPayment(),
      getPerformanceMetrics()
    ]);
    
    // API is healthy if we can respond
    const apiStatus: 'healthy' | 'warning' | 'error' = 'healthy';
    
    const status: SystemStatus = {
      database: databaseStatus,
      api: apiStatus,
      storage: storageStatus,
      email: emailStatus,
      payment: paymentStatus
    };
    
    return NextResponse.json({
      status,
      performance,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('System health check failed:', error);
    
    return NextResponse.json({
      status: {
        database: 'error',
        api: 'error',
        storage: 'error',
        email: 'error',
        payment: 'error'
      },
      performance: {
        responseTime: 0,
        uptime: 0,
        errorRate: 100,
        activeConnections: 0
      },
      timestamp: new Date().toISOString(),
      error: error.message
    }, {
      status: 503
    });
  }
}

export const GET = withAdminAuth(systemHealthHandler);


