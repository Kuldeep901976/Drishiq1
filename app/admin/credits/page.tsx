'use client';

import {
    Button,
    Card,
    CardBody,
    Container,
    Grid,
    LoadingSpinner,
    Section
} from '@/components/ui/DrishiqUI';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface CreditStats {
  total_credits: number;
  credits_earned: number;
  credits_spent: number;
  credits_available: number;
  total_transactions: number;
  active_users: number;
}

interface CreditTransaction {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  source_type: string;
  description: string;
  created_at: string;
}

interface CreditType {
  id: string;
  type_code: string;
  type_name: string;
  description: string;
  base_credits: number;
  is_active: boolean;
}

export default function CreditsManagement() {
  const [stats, setStats] = useState<CreditStats | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [creditTypes, setCreditTypes] = useState<CreditType[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/admin/login');
        return;
      }

      setUser(session.user);

      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('user_type, is_active')
        .eq('id', session.user.id)
        .single();

      if (userData?.user_type === 'admin' && userData?.is_active) {
        setIsAdmin(true);
        loadCreditsData();
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/admin/login');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadCreditsData = async () => {
    try {
      setLoading(true);
      
      // Load credits stats
      const statsResponse = await fetch('/api/admin/credits?action=stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      // Load recent transactions
      const transactionsResponse = await fetch('/api/admin/credits?action=transactions');
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        if (transactionsData.success) {
          setTransactions(transactionsData.data);
        }
      }

      // Load credit types
      const typesResponse = await fetch('/api/admin/credits?action=types');
      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        if (typesData.success) {
          setCreditTypes(typesData.data);
        }
      }
    } catch (error) {
      console.error('Error loading credits data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantCredits = async (userId: string, amount: number, description: string) => {
    try {
      const response = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'grant',
          user_id: userId,
          amount: amount,
          description: description
        }),
      });

      if (response.ok) {
        loadCreditsData(); // Reload data
        alert('Credits granted successfully!');
      } else {
        alert('Failed to grant credits');
      }
    } catch (error) {
      console.error('Error granting credits:', error);
      alert('Error granting credits');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gray-50">
        <Container className="py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#0B4422] mb-2">Credits Management</h1>
                <p className="text-gray-600">Manage user credits and transactions</p>
              </div>
              <Link href="/admin/dashboard">
                <Button variant="secondary">
                  ← Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <Grid cols={4} className="drishiq-mb-lg">
            <Card>
              <CardBody className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.total_credits || 0}</div>
                <div className="text-sm text-gray-500">Total Credits</div>
                <div className="text-xs text-gray-400">in system</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.credits_earned || 0}</div>
                <div className="text-sm text-gray-500">Credits Earned</div>
                <div className="text-xs text-gray-400">all time</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats?.credits_spent || 0}</div>
                <div className="text-sm text-gray-500">Credits Spent</div>
                <div className="text-xs text-gray-400">all time</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats?.total_transactions || 0}</div>
                <div className="text-sm text-gray-500">Total Transactions</div>
                <div className="text-xs text-gray-400">all time</div>
              </CardBody>
            </Card>
          </Grid>

          {/* Credit Types */}
          <Section className="drishiq-mb-lg">
            <h2 className="text-2xl font-bold text-[#0B4422] mb-6">Credit Types</h2>
            <Grid cols={3}>
              {creditTypes.map((type) => (
                <Card key={type.id}>
                  <CardBody>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{type.type_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        type.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                    <div className="text-lg font-bold text-[#0B4422]">{type.base_credits} credits</div>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          </Section>

          {/* Recent Transactions */}
          <Section>
            <h2 className="text-2xl font-bold text-[#0B4422] mb-6">Recent Transactions</h2>
            <Card>
              <CardBody>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Balance</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Source</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{transaction.user_name}</div>
                              <div className="text-sm text-gray-500">{transaction.user_email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              transaction.transaction_type === 'earned' ? 'bg-green-100 text-green-800' :
                              transaction.transaction_type === 'spent' ? 'bg-red-100 text-red-800' :
                              transaction.transaction_type === 'refunded' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.transaction_type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${
                              transaction.transaction_type === 'earned' ? 'text-green-600' :
                              transaction.transaction_type === 'spent' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {transaction.transaction_type === 'earned' ? '+' : '-'}{transaction.amount}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {transaction.balance_after}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {transaction.source_type}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </Section>
        </Container>
      </div>

      <Footer />
    </>
  );
}
