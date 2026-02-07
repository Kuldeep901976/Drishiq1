'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from './GoogleAnalytics';
import AnalyticsDashboard from './AnalyticsDashboard';
import UserManagement from './UserManagement';
import ContentManagement from './ContentManagement';
import SystemHealth from './SystemHealth';

interface AdminDashboardProps {
  userRole?: 'admin' | 'moderator' | 'analyst';
}

export default function AdminDashboard({ userRole = 'admin' }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [isLoading, setIsLoading] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Track admin dashboard access
    trackEvent('admin_dashboard_accessed', {
      user_role: userRole,
      active_tab: activeTab
    });

    // Load user permissions based on role
    loadUserPermissions();
  }, [userRole, activeTab]);

  const loadUserPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    trackEvent('admin_tab_changed', {
      from_tab: activeTab,
      to_tab: tab,
      user_role: userRole
    });
  };

  const canAccess = (permission: string) => {
    return userPermissions.includes(permission) || userRole === 'admin';
  };

  const tabs = [
    {
      id: 'analytics',
      label: '📊 Analytics Dashboard',
      icon: '📊',
      permission: 'view_analytics',
      component: AnalyticsDashboard
    },
    {
      id: 'users',
      label: '👥 User Management',
      icon: '👥',
      permission: 'manage_users',
      component: UserManagement
    },
    {
      id: 'content',
      label: '📝 Content Management',
      icon: '📝',
      permission: 'manage_content',
      component: ContentManagement
    },
    {
      id: 'health',
      label: '🏥 System Health',
      icon: '🏥',
      permission: 'view_system_health',
      component: SystemHealth
    }
  ];

  const filteredTabs = tabs.filter(tab => canAccess(tab.permission));

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || AnalyticsDashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                {userRole}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🏠 Dashboard
              </button>
              <button
                onClick={() => router.push('/user/main')}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                ← Back to App
              </button>
              <button
                onClick={() => router.push('/admin/settings')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {filteredTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <ActiveComponent userRole={userRole} />
          </div>
        )}
      </div>

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-6 right-6">
        <div className="relative group">
          <button
            onClick={() => setActiveTab('analytics')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            title="Quick Analytics View"
          >
            📊
          </button>
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
              Quick Analytics
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




