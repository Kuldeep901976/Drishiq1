import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withAuth, createSecureErrorResponse } from '@/lib/auth-middleware';

// GET /api/admin/credits?action=stats|transactions|types
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const action = searchParams.get('action');

      switch (action) {
        case 'stats':
          return await getCreditStats();
        case 'transactions':
          return await getRecentTransactions();
        case 'types':
          return await getCreditTypes();
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

    } catch (error) {
      console.error('Admin credits API error:', error);
      return createSecureErrorResponse('Admin credits operation failed');
    }
  }, {
    requireAdmin: true,
    rateLimit: { maxRequests: 20, windowMs: 60000 } // 20 requests per minute
  });
}

// POST /api/admin/credits (for granting credits)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, user_id, amount, description } = body;

    // Get authenticated user
    const authResponse = await supabase.auth.getUser();
    if (!authResponse.data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate admin access
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type, is_active')
      .eq('id', authResponse.data.user.id)
      .single();

    if (userError || userData?.user_type !== 'admin' || !userData?.is_active) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (action === 'grant') {
      return await grantCredits(user_id, amount, description, authResponse.data.user.id);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Admin credits POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getCreditStats() {
  try {
    // Get total credits in system
    const { data: creditsData, error: creditsError } = await supabase
      .from('credits')
      .select('credit_tokens, tokens_used, amount_contributed, created_at');

    if (creditsError) {
      throw creditsError;
    }

    // Calculate stats
    const totalCredits = creditsData?.reduce((sum, c) => sum + Number(c.credit_tokens || 0), 0) || 0;
    const creditsEarned = totalCredits;
    const creditsSpent = creditsData?.reduce((sum, c) => sum + Number(c.tokens_used || 0), 0) || 0;
    const creditsAvailable = totalCredits - creditsSpent;
    const totalTransactions = creditsData?.length || 0;

    // Get active users count
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      data: {
        total_credits: totalCredits,
        credits_earned: creditsEarned,
        credits_spent: creditsSpent,
        credits_available: creditsAvailable,
        total_transactions: totalTransactions,
        active_users: activeUsers || 0
      }
    });

  } catch (error) {
    console.error('Error fetching credit stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

async function getRecentTransactions() {
  try {
    const { data: transactions, error } = await supabase
      .from('credits')
      .select(`
        id,
        user_id,
        credit_tokens,
        tokens_used,
        amount_contributed,
        payment_status,
        support_level,
        created_at,
        users!inner (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    // Transform data to match expected format
    const formattedTransactions = transactions?.map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      user_name: (t.users as any)?.name || 'Unknown',
      user_email: (t.users as any)?.email || '',
      transaction_type: 'earned', // Credit is always earned
      amount: Number(t.credit_tokens || 0),
      balance_after: Number((t.credit_tokens || 0) - (t.tokens_used || 0)),
      source_type: t.support_level || 'standard',
      description: `Credit purchase - ${t.support_level}`,
      created_at: t.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedTransactions
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

async function getCreditTypes() {
  try {
    // Get unique credit types from support levels
    const { data: supportLevels, error } = await supabase
      .from('credits')
      .select('support_level, amount_contributed')
      .not('support_level', 'is', null);

    if (error) {
      throw error;
    }

    // Calculate unique types with base credits
    const creditTypes = Array.from(new Set(supportLevels?.map(s => s.support_level)))
      .map(level => {
        const levels = supportLevels?.filter(s => s.support_level === level);
        const avgAmount = levels?.reduce((sum, s) => sum + Number(s.amount_contributed || 0), 0) / (levels?.length || 1);
        
        return {
          id: `type_${level}`,
          type_code: level,
          type_name: level.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          description: `${level} support level credit`,
          base_credits: Math.round((avgAmount || 1000) / 1000), // Rough estimate
          is_active: true
        };
      });

    return NextResponse.json({
      success: true,
      data: creditTypes
    });

  } catch (error) {
    console.error('Error fetching credit types:', error);
    return NextResponse.json({ error: 'Failed to fetch credit types' }, { status: 500 });
  }
}

async function grantCredits(userId: string, amount: number, description: string, grantedBy: string) {
  try {
    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Insert credit record
    const { data: creditRecord, error: creditError } = await supabase
      .from('credits')
      .insert({
        user_id: userId,
        email: user.email,
        credit_tokens: amount,
        tokens_used: 0,
        amount_contributed: 0, // Admin granted, no payment
        payment_status: 'completed',
        support_level: 'admin_granted',
        status: 'funded',
        funded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (creditError) {
      throw creditError;
    }

    // Log the admin action
    await supabase
      .from('access_control_logs')
      .insert({
        user_id: userId,
        performed_by: grantedBy,
        action: 'credits_granted',
        reason: description || 'Admin credit grant'
      });

    return NextResponse.json({
      success: true,
      data: {
        credit_record_id: creditRecord.id,
        amount_granted: amount,
        user_name: user.name
      },
      message: `Successfully granted ${amount} credits to ${user.name}`
    });

  } catch (error) {
    console.error('Error granting credits:', error);
    return NextResponse.json({ error: 'Failed to grant credits' }, { status: 500 });
  }
}
