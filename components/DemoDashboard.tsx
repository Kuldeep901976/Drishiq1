'use client';


import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';

import { supabase } from '../lib/supabase';

interface DemoCategory {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  features: any;
}

interface DemoInvitation {
  id: string;
  invitation_id: string;
  stakeholder_type: string;
  company_name?: string;
  title?: string;
  purpose?: string;
  session_duration_minutes: number;
  scheduled_at?: string;
  status: string;
  created_at: string;
  demo_categories?: DemoCategory;
  invitations?: {
    email: string;
    created_at: string;
  };
}

interface DemoAnalytics {
  totalInvitations: number;
  scheduledDemos: number;
  completedDemos: number;
  conversionRate: number;
  avgDuration: number;
  avgEngagement: number;
  avgSatisfaction: number;
  followUpsRequired: number;
  stakeholderBreakdown: any;
}

export default function DemoDashboard() {
  const { user, session } = useAuth();
  const [invitations, setInvitations] = useState<DemoInvitation[]>([]);
  const [categories, setCategories] = useState<DemoCategory[]>([]);
  const [analytics, setAnalytics] = useState<DemoAnalytics | null>(null);
  const [conversionFunnel, setConversionFunnel] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<DemoInvitation | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    stakeholderType: '',
    companyName: '',
    title: '',
    purpose: '',
    demoCategoryId: '',
    sessionDuration: 30,
    maxParticipants: 1
  });

  const [scheduleData, setScheduleData] = useState({
    scheduledAt: '',
    meetingId: '',
    adminNotes: ''
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [stakeholderFilter, setStakeholderFilter] = useState<string>('');

  useEffect(() => {
    if (user && session) {
      fetchDashboardData();
    }
  }, [user, session, statusFilter, stakeholderFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.access_token) return;

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (stakeholderFilter) params.append('stakeholder_type', stakeholderFilter);

      const response = await fetch(`/api/demo/dashboard?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }

      setInvitations(result.data.invitations);
      setCategories(result.data.categories);
      setAnalytics(result.data.analytics);
      setConversionFunnel(result.data.conversionFunnel);
      setPerformanceMetrics(result.data.performanceMetrics);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const createDemoInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.access_token) return;

    try {
      setActionLoading('creating');
      setError(null);

      const response = await fetch('/api/demo/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create demo invitation');
      }

      // Reset form
      setFormData({
        email: '',
        stakeholderType: '',
        companyName: '',
        title: '',
        purpose: '',
        demoCategoryId: '',
        sessionDuration: 30,
        maxParticipants: 1
      });
      setShowCreateModal(false);

      // Refresh data
      await fetchDashboardData();
    } catch (error) {
      console.error('Error creating demo invitation:', error);
      setError(error instanceof Error ? error.message : 'Failed to create demo invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const scheduleDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.access_token || !selectedInvitation) return;

    try {
      setActionLoading('scheduling');
      setError(null);

      const response = await fetch(`/api/demo/${selectedInvitation.id}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(scheduleData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to schedule demo');
      }

      // Reset form
      setScheduleData({
        scheduledAt: '',
        meetingId: '',
        adminNotes: ''
      });
      setSelectedInvitation(null);
      setShowScheduleModal(false);

      // Refresh data
      await fetchDashboardData();
    } catch (error) {
      console.error('Error scheduling demo:', error);
      setError(error instanceof Error ? error.message : 'Failed to schedule demo');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStakeholderColor = (type: string): string => {
    switch (type) {
      case 'investor': return 'bg-green-100 text-green-800';
      case 'partner': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-purple-100 text-purple-800';
      case 'media': return 'bg-pink-100 text-pink-800';
      case 'analyst': return 'bg-indigo-100 text-indigo-800';
      case 'advisor': return 'bg-yellow-100 text-yellow-800';
      case 'board_member': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Demo Dashboard
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage stakeholder demo invitations and track performance
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={actionLoading !== null}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Create Demo Invitation
            </button>
          </div>
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

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Invitations</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.totalInvitations}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed Demos</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.completedDemos}</dd>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.conversionRate.toFixed(1)}%</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Duration</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.avgDuration.toFixed(0)}m</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Stakeholder Filter</label>
              <select
                value={stakeholderFilter}
                onChange={(e) => setStakeholderFilter(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Stakeholders</option>
                <option value="investor">Investor</option>
                <option value="partner">Partner</option>
                <option value="customer">Customer</option>
                <option value="media">Media</option>
                <option value="analyst">Analyst</option>
                <option value="advisor">Advisor</option>
                <option value="board_member">Board Member</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('');
                  setStakeholderFilter('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Invitations Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Demo Invitations
          </h3>
          
          {invitations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stakeholder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invitation.invitations?.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invitation.title || 'No title'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invitation.company_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStakeholderColor(invitation.stakeholder_type)}`}>
                          {invitation.stakeholder_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invitation.demo_categories?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                          {invitation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invitation.scheduled_at ? new Date(invitation.scheduled_at).toLocaleString() : 'Not scheduled'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {invitation.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedInvitation(invitation);
                              setShowScheduleModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                          >
                            Schedule
                          </button>
                        )}
                        <button className="text-indigo-600 hover:text-indigo-900">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No demo invitations found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Conversion Funnel */}
      {conversionFunnel.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Conversion Funnel by Category
            </h3>
            
            <div className="space-y-4">
              {conversionFunnel.map((funnel, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{funnel.category}</h4>
                    <span className="text-sm font-medium text-green-600">
                      {funnel.completion_rate}% completion rate
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Invitations:</span>
                      <div className="font-medium">{funnel.total_invitations}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Scheduled:</span>
                      <div className="font-medium">{funnel.scheduled}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Confirmed:</span>
                      <div className="font-medium">{funnel.confirmed}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Completed:</span>
                      <div className="font-medium">{funnel.completed}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Cancelled:</span>
                      <div className="font-medium">{funnel.cancelled}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">No Shows:</span>
                      <div className="font-medium">{funnel.no_shows}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Demo Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={createDemoInvitation}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Create Demo Invitation
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Stakeholder Type *
                          </label>
                          <select
                            value={formData.stakeholderType}
                            onChange={(e) => setFormData({...formData, stakeholderType: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select stakeholder type...</option>
                            <option value="investor">Investor</option>
                            <option value="partner">Partner</option>
                            <option value="customer">Customer</option>
                            <option value="media">Media</option>
                            <option value="analyst">Analyst</option>
                            <option value="advisor">Advisor</option>
                            <option value="board_member">Board Member</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Demo Category
                          </label>
                          <select
                            value={formData.demoCategoryId}
                            onChange={(e) => setFormData({...formData, demoCategoryId: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select category...</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name} ({category.duration_minutes} min)
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Purpose
                          </label>
                          <textarea
                            value={formData.purpose}
                            onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Purpose of the demo..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={actionLoading !== null}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {actionLoading === 'creating' ? 'Creating...' : 'Create Invitation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Demo Modal */}
      {showScheduleModal && selectedInvitation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowScheduleModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={scheduleDemo}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Schedule Demo
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {selectedInvitation.invitations?.email} - {selectedInvitation.company_name}
                      </p>
                      
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Scheduled Date & Time *
                          </label>
                          <input
                            type="datetime-local"
                            value={scheduleData.scheduledAt}
                            onChange={(e) => setScheduleData({...scheduleData, scheduledAt: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Meeting ID
                          </label>
                          <input
                            type="text"
                            value={scheduleData.meetingId}
                            onChange={(e) => setScheduleData({...scheduleData, meetingId: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Zoom/Teams meeting ID"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Admin Notes
                          </label>
                          <textarea
                            value={scheduleData.adminNotes}
                            onChange={(e) => setScheduleData({...scheduleData, adminNotes: e.target.value})}
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Internal notes..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={actionLoading !== null}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {actionLoading === 'scheduling' ? 'Scheduling...' : 'Schedule Demo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
