'use client';


import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';

import { supabase } from '../lib/supabase';

interface AffiliateProgram {
  id: string;
  name: string;
  description?: string;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  fixed_amount?: number;
  cookie_duration: number;
  minimum_payout: number;
  is_active: boolean;
  terms_url?: string;
}

interface Affiliate {
  id: string;
  user_id: string;
  program_id: string;
  affiliate_code: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  commission_rate?: number;
  total_referrals: number;
  total_earnings: number;
  paid_earnings: number;
  pending_earnings: number;
  approved_at?: string;
  created_at: string;
  affiliate_programs: AffiliateProgram;
  stats?: {
    totalCommissions: number;
    pendingCommissions: number;
    paidCommissions: number;
    conversionRate: number;
  };
}

interface Commission {
  id: string;
  commission_amount: number;
  commission_currency: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  created_at: string;
  affiliate: {
    affiliate_code: string;
  };
  referral: {
    referral_code: string;
    referee: {
      email: string;
    };
  };
}

export default function AffiliateDashboard() {
  const { user, session } = useAuth();
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<any>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch affiliate programs
      const programsResponse = await fetch('/api/affiliate/programs');
      const programsData = await programsResponse.json();
      
      if (programsData.success) {
        setPrograms(programsData.data);
      }

      if (user && session) {
        // Fetch user's affiliate dashboard data
        const dashboardResponse = await fetch('/api/affiliate/dashboard', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        const dashboardData = await dashboardResponse.json();
        
        if (dashboardData.success) {
          setAffiliates(dashboardData.data.affiliateStats || []);
          setCommissions(dashboardData.data.recentCommissions || []);
        }
      }
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
      setError('Failed to load affiliate data');
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyForProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.access_token || !selectedProgram) return;

    try {
      setApplying(true);
      setError(null);

      const response = await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          programId: selectedProgram,
          paymentMethod,
          paymentDetails
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to apply for affiliate program');
      }

      // Reset form
      setSelectedProgram('');
      setPaymentMethod('');
      setPaymentDetails({});
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error applying for affiliate program:', error);
      setError(error instanceof Error ? error.message : 'Failed to apply for affiliate program');
    } finally {
      setApplying(false);
    }
  };

  const copyAffiliateLink = (code: string) => {
    const url = `${window.location.origin}?aff=${code}`;
    navigator.clipboard.writeText(url);
  };

  const totalEarnings = affiliates.reduce((sum, affiliate) => sum + affiliate.total_earnings, 0);
  const totalPendingEarnings = affiliates.reduce((sum, affiliate) => sum + affiliate.pending_earnings, 0);
  const totalPaidEarnings = affiliates.reduce((sum, affiliate) => sum + affiliate.paid_earnings, 0);
  const activeAccounts = affiliates.filter(a => a.status === 'approved').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Affiliate Dashboard
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage your affiliate accounts and track your earnings
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
                  <dd className="text-lg font-medium text-gray-900">${totalEarnings.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">${totalPendingEarnings.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Paid Out</dt>
                  <dd className="text-lg font-medium text-gray-900">${totalPaidEarnings.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Accounts</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeAccounts}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply for Program */}
      {programs.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Apply for Affiliate Program
            </h3>
            
            <form onSubmit={applyForProgram} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select Program
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a program...</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name} - {program.commission_rate * 100}% commission
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose payment method...</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={applying || !selectedProgram || !paymentMethod}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {applying ? 'Applying...' : 'Apply for Program'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Active Affiliate Accounts */}
      {affiliates.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Your Affiliate Accounts
            </h3>
            
            <div className="space-y-4">
              {affiliates.map((affiliate) => (
                <div key={affiliate.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">
                        {affiliate.affiliate_programs.name}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        affiliate.status === 'approved' ? 'bg-green-100 text-green-800' :
                        affiliate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        affiliate.status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {affiliate.status}
                      </span>
                    </div>
                    
                    {affiliate.status === 'approved' && (
                      <button
                        onClick={() => copyAffiliateLink(affiliate.affiliate_code)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Copy Link
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Code:</span>
                      <div className="font-mono">{affiliate.affiliate_code}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Referrals:</span>
                      <div className="font-medium">{affiliate.total_referrals}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Earnings:</span>
                      <div className="font-medium">${affiliate.total_earnings.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Pending:</span>
                      <div className="font-medium">${affiliate.pending_earnings.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  {affiliate.stats && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Commissions:</span>
                        <div className="font-medium">{affiliate.stats.totalCommissions}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Conversion Rate:</span>
                        <div className="font-medium">{affiliate.stats.conversionRate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Pending Commissions:</span>
                        <div className="font-medium">{affiliate.stats.pendingCommissions}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Paid Commissions:</span>
                        <div className="font-medium">{affiliate.stats.paidCommissions}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Commissions */}
      {commissions.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Commissions
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referral
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commissions.map((commission) => (
                    <tr key={commission.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${commission.commission_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {commission.referral?.referee?.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          commission.status === 'approved' ? 'bg-green-100 text-green-800' :
                          commission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          commission.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {commission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Available Programs */}
      {programs.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Available Programs
            </h3>
            
            <div className="grid gap-4">
              {programs.map((program) => (
                <div key={program.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{program.name}</h4>
                    <span className="text-sm font-medium text-green-600">
                      {program.commission_rate * 100}% commission
                    </span>
                  </div>
                  
                  {program.description && (
                    <p className="text-sm text-gray-600 mb-2">{program.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Cookie Duration:</span>
                      <div className="font-medium">{program.cookie_duration} days</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Min Payout:</span>
                      <div className="font-medium">${program.minimum_payout}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <div className="font-medium">{program.commission_type}</div>
                    </div>
                  </div>
                  
                  {program.terms_url && (
                    <div className="mt-2">
                      <a
                        href={program.terms_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Terms & Conditions
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
