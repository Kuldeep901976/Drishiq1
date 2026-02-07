'use client';

import React, { useState, useEffect } from 'react';
import { trackEvent } from './GoogleAnalytics';

interface SystemHealthProps {
  userRole: string;
}

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

export default function SystemHealth({ userRole }: SystemHealthProps) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy',
    email: 'healthy',
    payment: 'healthy'
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    responseTime: 0,
    uptime: 0,
    errorRate: 0,
    activeConnections: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  // Load health data once on mount - no polling
  // User can manually refresh using the button
  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/system-health');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data.status);
        setPerformanceMetrics(data.performance);
        setLastChecked(new Date());
        
        trackEvent('system_health_checked', {
          admin_role: userRole,
          status: data.status
        });
      }
    } catch (error) {
      console.error('Failed to check system health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-600 bg-emerald-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getUptimeString = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
          <p className="text-gray-600 mt-1">Monitor system performance and status</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <div className="text-sm text-gray-500">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
          <button
            onClick={checkSystemHealth}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isLoading ? '🔄 Checking...' : '🔄 Check Health'}
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-3xl mb-2">🗄️</div>
          <div className="text-sm font-medium text-gray-600 mb-2">Database</div>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(systemStatus.database)}`}>
            <span className="mr-1">{getStatusIcon(systemStatus.database)}</span>
            {systemStatus.database.charAt(0).toUpperCase() + systemStatus.database.slice(1)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-3xl mb-2">🔌</div>
          <div className="text-sm font-medium text-gray-600 mb-2">API</div>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(systemStatus.api)}`}>
            <span className="mr-1">{getStatusIcon(systemStatus.api)}</span>
            {systemStatus.api.charAt(0).toUpperCase() + systemStatus.api.slice(1)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-3xl mb-2">💾</div>
          <div className="text-sm font-medium text-gray-600 mb-2">Storage</div>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(systemStatus.storage)}`}>
            <span className="mr-1">{getStatusIcon(systemStatus.storage)}</span>
            {systemStatus.storage.charAt(0).toUpperCase() + systemStatus.storage.slice(1)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-3xl mb-2">📧</div>
          <div className="text-sm font-medium text-gray-600 mb-2">Email</div>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(systemStatus.email)}`}>
            <span className="mr-1">{getStatusIcon(systemStatus.email)}</span>
            {systemStatus.email.charAt(0).toUpperCase() + systemStatus.email.slice(1)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-3xl mb-2">💳</div>
          <div className="text-sm font-medium text-gray-600 mb-2">Payment</div>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(systemStatus.payment)}`}>
            <span className="mr-1">{getStatusIcon(systemStatus.payment)}</span>
            {systemStatus.payment.charAt(0).toUpperCase() + systemStatus.payment.slice(1)}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-semibold text-gray-900">
                {performanceMetrics.responseTime}ms
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  performanceMetrics.responseTime < 100 ? 'bg-emerald-500' :
                  performanceMetrics.responseTime < 300 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((performanceMetrics.responseTime / 500) * 100, 100)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-semibold text-gray-900">
                {getUptimeString(performanceMetrics.uptime)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(performanceMetrics.uptime / 86400) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="text-sm font-semibold text-gray-900">
                {performanceMetrics.errorRate.toFixed(2)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  performanceMetrics.errorRate < 1 ? 'bg-emerald-500' :
                  performanceMetrics.errorRate < 5 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(performanceMetrics.errorRate * 10, 100)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Connections</span>
              <span className="text-sm font-semibold text-gray-900">
                {performanceMetrics.activeConnections}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  performanceMetrics.activeConnections < 100 ? 'bg-emerald-500' :
                  performanceMetrics.activeConnections < 500 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((performanceMetrics.activeConnections / 1000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
          <div className="space-y-3">
            {Object.entries(systemStatus).map(([service, status]) => (
              status !== 'healthy' && (
                <div key={service} className={`p-3 rounded-lg ${
                  status === 'error' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center">
                    <span className="mr-2">{getStatusIcon(status)}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {service.charAt(0).toUpperCase() + service.slice(1)} Service
                      </div>
                      <div className="text-sm text-gray-600">
                        {status === 'error' ? 'Service is down' : 'Service experiencing issues'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
            
            {Object.values(systemStatus).every(status => status === 'healthy') && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <div className="text-sm font-medium text-emerald-800">
                    All systems operational
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.open('/admin/logs', '_blank')}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            📋 View Logs
          </button>
          <button
            onClick={() => window.open('/admin/backup', '_blank')}
            className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            💾 Backup System
          </button>
          <button
            onClick={() => window.open('/admin/maintenance', '_blank')}
            className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            🔧 Maintenance Mode
          </button>
        </div>
      </div>

      {/* System Information */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-2">Environment</div>
            <div className="text-sm font-medium text-gray-900">{process.env.NODE_ENV || 'development'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Version</div>
            <div className="text-sm font-medium text-gray-900">1.0.0</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Last Deployment</div>
            <div className="text-sm font-medium text-gray-900">
              {new Date().toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Server Region</div>
            <div className="text-sm font-medium text-gray-900">Asia Pacific (Mumbai)</div>
          </div>
        </div>
      </div>
    </div>
  );
}















