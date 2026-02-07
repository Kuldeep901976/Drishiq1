'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  order_id: string;
  transaction_type: string;
  plan_level: string;
  amount: number;
  currency: string;
  status: string;
  pricing_tier: string;
  payment_provider: string;
  recipient_name?: string;
  recipient_email?: string;
  gift_message?: string;
  credits_allocated: number;
  subscription_duration?: number;
  expires_at?: string | null;
  purpose: string;
  created_at: string;
  updated_at: string;
}

export default function UserPaymentsPage() {
  // temporary i18n shim — replace with your real i18n hook (e.g., useTranslations) later
  const t = (k: string) => k;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    'all' | 'support' | 'gift' | 'subscription' | 'credits' | 'early_access' | 'free_trial'
  >('all');

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        console.error('Auth error:', authErr);
        setError('Authentication error. Please log in.');
        return;
      }

      const user = authData?.user;
      if (!user) {
        setError('Please log in to view your transactions');
        return;
      }

      const { data, error: fetchErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) {
        console.error('Error fetching transactions:', fetchErr);
        throw fetchErr;
      }

      // data may be null; normalize
      setTransactions((data as Transaction[] | null) ?? []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === 'all') return true;
    return transaction.transaction_type === filter;
  });

  const formatAmount = (amount: number | undefined | null, currency?: string) => {
    const amt = Number(amount ?? 0);
    if (amt <= 0) return 'Free';
    const symbol = (currency ?? 'INR') === 'INR' ? '₹' : '$';
    // assume amount stored in cents/paise -> divide by 100
    return `${symbol}${(amt / 100).toFixed(2)}`;
  };

  const getStatusColor = (status?: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTransactionIcon = (transaction_type?: string) => {
    switch ((transaction_type ?? '').toLowerCase()) {
      case 'support':
        return '💚';
      case 'gift':
        return '🎁';
      case 'subscription':
        return '🔄';
      case 'credits':
        return '⭐';
      case 'early_access':
        return '🚀';
      case 'free_trial':
        return '🆓';
      case 'custom':
        return '⚙️';
      case 'premium':
        return '👑';
      default:
        return '💳';
    }
  };

  const getTransactionLabel = (transaction_type?: string) => {
    switch ((transaction_type ?? '').toLowerCase()) {
      case 'support':
        return 'Support Payment';
      case 'gift':
        return 'Gift Payment';
      case 'subscription':
        return 'Subscription';
      case 'credits':
        return 'Credit Purchase';
      case 'early_access':
        return 'Early Access';
      case 'free_trial':
        return 'Free Trial';
      case 'custom':
        return 'Custom Payment';
      case 'premium':
        return 'Premium Plan';
      default:
        return 'Transaction';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('user.loading_payments')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('common.error')}</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchTransactions}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('user.my_transactions')}</h1>
          <p className="text-gray-600 mt-2">
            View all your transaction history including payments, gifts, subscriptions, and more
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'all', label: 'All Transactions' },
              { key: 'support', label: 'Support' },
              { key: 'gift', label: 'Gifts' },
              { key: 'subscription', label: 'Subscriptions' },
              { key: 'credits', label: 'Credits' },
              { key: 'early_access', label: 'Early Access' },
              { key: 'free_trial', label: 'Free Trials' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('user.no_transactions')}</h3>
            <p className="text-gray-600">
              {filter === 'all' ? "You haven't made any transactions yet." : `You haven't made any ${filter} transactions yet.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => {
              const planLevel = (transaction.plan_level ?? '').toString();
              const orderId = transaction.order_id ?? '—';
              const statusLabel = (transaction.status ?? 'unknown').toString();
              const currency = transaction.currency ?? 'INR';
              const pricingTier = (transaction.pricing_tier ?? 'standard').toString();

              return (
                <div key={transaction.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getTransactionIcon(transaction.transaction_type)}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{getTransactionLabel(transaction.transaction_type)}</h3>
                        <p className="text-sm text-gray-600">
                          {planLevel ? planLevel.charAt(0).toUpperCase() + planLevel.slice(1) : '—'} • Order #{orderId}
                        </p>
                        {transaction.transaction_type === 'gift' && transaction.recipient_name && (
                          <p className="text-sm text-purple-600 mt-1">Gift for {transaction.recipient_name}</p>
                        )}
                        {pricingTier === 'free' && <p className="text-sm text-green-600 mt-1">Free Transaction</p>}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {formatAmount(transaction.amount, currency)}
                      </div>
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(statusLabel)}`}>
                        {statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}
                      </div>
                      {transaction.credits_allocated > 0 && <div className="text-sm text-blue-600 mt-1">+{transaction.credits_allocated} credits</div>}
                      {transaction.subscription_duration && <div className="text-sm text-green-600 mt-1">{transaction.subscription_duration} months</div>}
                    </div>
                  </div>

                  {/* Gift Message */}
                  {transaction.gift_message && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-800">
                        <span className="font-medium">Gift Message:</span> {transaction.gift_message}
                      </p>
                    </div>
                  )}

                  {/* Transaction Details */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Payment Method:</span>
                        <p className="capitalize">{(transaction.payment_provider ?? 'Free').toString()}</p>
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>
                        <p>{transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : '—'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Pricing Tier:</span>
                        <p className="capitalize">{pricingTier.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="font-medium">Last Updated:</span>
                        <p>{transaction.updated_at ? new Date(transaction.updated_at).toLocaleDateString() : '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {transactions.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
              <div className="text-sm text-gray-600">Total Transactions</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{transactions.filter((t) => t.status === 'completed').length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{transactions.reduce((sum, t) => sum + (t.credits_allocated || 0), 0)}</div>
              <div className="text-sm text-gray-600">Credits Earned</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">
                {formatAmount(transactions.reduce((sum, t) => sum + (t.amount || 0), 0), transactions[0]?.currency || 'INR')}
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
