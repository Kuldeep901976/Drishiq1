'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CreditTokenManagerProps {
  userId?: string;
  userEmail?: string;
}

interface Transaction {
  id: string;
  amount_contributed: number;
  credit_tokens: number;
  support_level: string;
  created_at: string;
  status: string;
}

interface CreditTokenData {
  total_tokens: number;
  tokens_used: number;
  tokens_remaining: number;
  recent_transactions: Transaction[];
}

export default function CreditTokenManager({ userId, userEmail }: CreditTokenManagerProps) {
  const [tokenData, setTokenData] = useState<CreditTokenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId || userEmail) {
      fetchTokenData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userEmail]);

  const fetchTokenData = async () => {
    try {
      setLoading(true);

      // Select relevant fields including `id` and order so "recent" is meaningful
      const { data: creditsRaw, error } = await supabase
        .from('credits')
        .select('id, credit_tokens, tokens_used, amount_contributed, support_level, created_at, status')
        .eq(userId ? 'user_id' : 'email', userId || userEmail)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching token data:', error);
        setTokenData({
          total_tokens: 0,
          tokens_used: 0,
          tokens_remaining: 0,
          recent_transactions: []
        });
        return;
      }

      const credits = Array.isArray(creditsRaw) ? creditsRaw : [];

      const totalTokens = credits.reduce((sum, credit) => sum + Number(credit.credit_tokens ?? 0), 0);
      const tokensUsed = credits.reduce((sum, credit) => sum + Number(credit.tokens_used ?? 0), 0);
      const tokensRemaining = totalTokens - tokensUsed;

      const recent_transactions: Transaction[] = credits.slice(0, 5).map((c: any) => ({
        id: String(c.id ?? `${c.created_at ?? Date.now()}`),
        amount_contributed: Number(c.amount_contributed ?? 0),
        credit_tokens: Number(c.credit_tokens ?? 0),
        support_level: String(c.support_level ?? 'support'),
        created_at: String(c.created_at ?? new Date().toISOString()),
        status: String(c.status ?? 'unknown'),
      }));

      setTokenData({
        total_tokens: totalTokens,
        tokens_used: tokensUsed,
        tokens_remaining: tokensRemaining,
        recent_transactions,
      });
    } catch (err) {
      console.error('Error fetching token data:', err);
      setTokenData({
        total_tokens: 0,
        tokens_used: 0,
        tokens_remaining: 0,
        recent_transactions: []
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Use tokens: finds the most recent completed credit record for this user/email,
   * increments its tokens_used by tokensToUse, then refreshes token data.
   *
   * Note: If you require a truly atomic DB increment (concurrent-safe), implement
   * a DB-side function / RPC and call that (preferred). This implementation is
   * read -> write and may race in high-concurrency scenarios.
   */
  const useToken = async (tokensToUse: number, purpose: string) => {
    try {
      if (!userId && !userEmail) {
        return { success: false, error: 'No user identifier provided' };
      }

      // Fetch latest completed credit row
      const { data: latest, error: fetchErr } = await supabase
        .from('credits')
        .select('id, tokens_used')
        .eq(userId ? 'user_id' : 'email', userId || userEmail)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchErr) {
        console.error('Error fetching latest credit row:', fetchErr);
        return { success: false, error: (fetchErr as any).message ?? 'Fetch error' };
      }

      if (!latest || !latest.id) {
        return { success: false, error: 'No eligible credit row found to deduct tokens from.' };
      }

      const currentUsed = Number(latest.tokens_used ?? 0);
      const newUsed = currentUsed + Number(tokensToUse);

      const { error: updateErr } = await supabase
        .from('credits')
        .update({ tokens_used: newUsed })
        .eq('id', latest.id);

      if (updateErr) {
        console.error('Error updating tokens_used:', updateErr);
        return { success: false, error: (updateErr as any).message ?? 'Update error' };
      }

      // Optionally record a usage audit row — if you have a usage table, insert here.
      // await supabase.from('token_usage_audit').insert({ credit_id: latest.id, used: tokensToUse, purpose });

      // Refresh token data
      await fetchTokenData();

      return { success: true };
    } catch (err) {
      console.error('Error using tokens:', err);
      const anyErr = err as any;
      return { success: false, error: anyErr?.message ?? String(anyErr) };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
        <div className="text-gray-500">No credit tokens found</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[#0B4422]">Credit Tokens</h3>
        <div className="text-2xl">🪙</div>
      </div>

      {/* Token Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600">{tokenData.total_tokens}</div>
          <div className="text-sm text-gray-600">Total Earned</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{tokenData.tokens_used}</div>
          <div className="text-sm text-gray-600">Used</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{tokenData.tokens_remaining}</div>
          <div className="text-sm text-gray-600">Available</div>
        </div>
      </div>

      {/* Recent Transactions */}
      {tokenData.recent_transactions.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Recent Transactions</h4>
          <div className="space-y-2">
            {tokenData.recent_transactions.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{transaction.support_level}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600">+{transaction.credit_tokens} tokens</div>
                  <div className="text-xs text-gray-500">
                    ${transaction.amount_contributed}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token Usage Info */}
      <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg">
        <div className="text-sm text-gray-700">
          <strong>How to use tokens:</strong> Each token can be redeemed for one session or service. 
          Tokens don't expire and can be used anytime.
        </div>
      </div>
    </div>
  );
}
