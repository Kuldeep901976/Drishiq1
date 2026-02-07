'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  max_users: number;
  max_admins: number;
}

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  permissions: string[];
  last_login_at: string;
}

interface CompanyUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  joined_at: string;
  last_login_at: string;
}

export default function EnterpriseAdminDashboard({ params }: { params: { id: string } }) {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'admins' | 'credits' | 'settings'>('overview');
  const [creditTransactions, setCreditTransactions] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);

  useEffect(() => {
    loadCompanyData();
  }, [params.id]);

  const loadCompanyData = async () => {
    try {
      // Load company information
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', params.id)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Load admin users
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', params.id)
        .eq('user_type', 'admin');

      if (adminError) throw adminError;
      setAdmins(adminData || []);

      // Load company users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', params.id)
        .eq('user_type', 'employee');

      if (userError) throw userError;
      const userList = userData || [];
      setUsers(userList);

      // Load credit transactions for company employees
      await loadCreditData(userList);

    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCreditData = async (userList: CompanyUser[] = []) => {
    try {
      // Load credit transactions (mock for now - will be replaced with actual query)
      // TODO: Replace with actual credit_transactions table query
      const mockTransactions = [
        {
          id: '1',
          employee_email: userList[0]?.email || 'employee@example.com',
          employee_name: userList[0] ? `${userList[0].first_name} ${userList[0].last_name}` : 'Employee 1',
          type: 'deduction',
          credits: -1,
          description: 'Chat session usage',
          created_at: new Date().toISOString(),
          status: 'completed'
        }
      ];
      setCreditTransactions(mockTransactions);

      // Load usage stats
      setUsageStats({
        totalCreditsAllocated: 1000,
        totalCreditsUsed: 245,
        totalCreditsRemaining: 755,
        activeUsers: userList.length,
        averageUsagePerUser: Math.round(245 / Math.max(userList.length, 1))
      });
    } catch (error) {
      console.error('Error loading credit data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422]"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h1>
          <p className="text-gray-600">The requested company could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#0B4422]">{company.name}</h1>
                <p className="text-gray-600">Enterprise Admin Dashboard</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Company ID: {company.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'users', label: `Users (${users.length})` },
              { id: 'admins', label: `Admins (${admins.length})` },
              { id: 'credits', label: 'Credit Management' },
              { id: 'settings', label: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-[#0B4422] text-[#0B4422]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">U</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">A</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Admins</dt>
                      <dd className="text-lg font-medium text-gray-900">{admins.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">L</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">User Limit</dt>
                      <dd className="text-lg font-medium text-gray-900">{company.max_users}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Company Users</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage users in your organization</p>
            </div>
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Admin Users</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage admin users in your organization</p>
            </div>
            <ul className="divide-y divide-gray-200">
              {admins.map((admin) => (
                <li key={admin.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {admin.first_name?.[0]}{admin.last_name?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {admin.first_name} {admin.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {admin.role}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'credits' && (
          <div className="space-y-6">
            {/* Credit Stats */}
            {usageStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                          <span className="text-white font-bold text-xs">💰</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Allocated</dt>
                          <dd className="text-lg font-medium text-gray-900">{usageStats.totalCreditsAllocated}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                          <span className="text-white font-bold text-xs">📉</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Used</dt>
                          <dd className="text-lg font-medium text-gray-900">{usageStats.totalCreditsUsed}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <span className="text-white font-bold text-xs">💵</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Remaining</dt>
                          <dd className="text-lg font-medium text-gray-900">{usageStats.totalCreditsRemaining}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                          <span className="text-white font-bold text-xs">📊</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Avg per User</dt>
                          <dd className="text-lg font-medium text-gray-900">{usageStats.averageUsagePerUser}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Credit Transactions */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Credit Transactions</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Monitor credit usage for all employees</p>
                  </div>
                  <button
                    onClick={() => {
                      // TODO: Implement allocate credits functionality
                      alert('Allocate credits feature coming soon');
                    }}
                    className="px-4 py-2 bg-[#0B4422] text-white rounded-lg hover:bg-[#0a3a1a] transition-colors text-sm"
                  >
                    Allocate Credits
                  </button>
                </div>
              </div>

              {creditTransactions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-gray-400 text-6xl mb-4">💰</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-500">Credit transactions will appear here once employees start using credits.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credits
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {creditTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{transaction.employee_name}</div>
                            <div className="text-sm text-gray-500">{transaction.employee_email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              transaction.type === 'allocation' 
                                ? 'bg-green-100 text-green-800'
                                : transaction.type === 'deduction'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.credits > 0 ? '+' : ''}{transaction.credits}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              transaction.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                // TODO: Implement notify functionality
                                alert(`Notify ${transaction.employee_name} about credit usage`);
                              }}
                              className="text-[#0B4422] hover:text-[#0a3a1a]"
                            >
                              Notify
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Usage Tracking */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Usage Tracking</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Track credit usage by employee</p>
              </div>
              <div className="px-4 py-5 sm:px-6">
                <div className="text-sm text-gray-500 mb-4">
                  Detailed usage tracking and analytics will be available here.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                        <button
                          onClick={() => {
                            alert(`View detailed usage for ${user.first_name}`);
                          }}
                          className="text-xs text-[#0B4422] hover:text-[#0a3a1a]"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {users.length > 5 && (
                  <div className="mt-4 text-sm text-gray-500 text-center">
                    + {users.length - 5} more employees
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Company Settings</h3>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <div className="mt-1 text-sm text-gray-900">{company.name}</div>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Company Slug</label>
                  <div className="mt-1 text-sm text-gray-900">{company.slug}</div>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Max Users</label>
                  <div className="mt-1 text-sm text-gray-900">{company.max_users}</div>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Max Admins</label>
                  <div className="mt-1 text-sm text-gray-900">{company.max_admins}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
