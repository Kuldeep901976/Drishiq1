// Enhanced Chat Management Page with Better UI and Module Integration

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent as CardBody, CardHeader, Button, Grid, Spinner as LoadingSpinner } from '@/components/ui';
import Link from 'next/link';

interface ChatStats {
  total_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  total_messages: number;
  avg_session_duration: number;
  active_providers: number;
}

interface ProviderStats {
  provider_id: string;
  provider_name: string;
  total_requests: number;
  avg_response_time: number;
  success_rate: number;
  is_active: boolean;
}

interface ChatSession {
  id: string;
  user_id: string;
  created_at: string;
  status: string;
  message_count: number;
}

export default function EnhancedChatManagement() {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [providerStats, setProviderStats] = useState<ProviderStats[]>([]);
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
        loadChatData();
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

  const loadChatData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      setStats({
        total_sessions: 1247,
        active_sessions: 23,
        completed_sessions: 89,
        total_messages: 15420,
        avg_session_duration: 12,
        active_providers: 3
      });

      setProviderStats([
        {
          provider_id: 'openai-1',
          provider_name: 'OpenAI GPT-4',
          total_requests: 8542,
          avg_response_time: 1200,
          success_rate: 98.5,
          is_active: true
        },
        {
          provider_id: 'anthropic-1',
          provider_name: 'Anthropic Claude',
          total_requests: 3241,
          avg_response_time: 1500,
          success_rate: 97.2,
          is_active: true
        },
        {
          provider_id: 'grok-1',
          provider_name: 'Grok AI',
          total_requests: 2637,
          avg_response_time: 800,
          success_rate: 96.8,
          is_active: true
        }
      ]);

      setSessions([
        {
          id: 'session-001',
          user_id: 'user-123',
          created_at: new Date().toISOString(),
          status: 'active',
          message_count: 15
        },
        {
          id: 'session-002',
          user_id: 'user-456',
          created_at: new Date(Date.now() - 300000).toISOString(),
          status: 'active',
          message_count: 8
        }
      ]);

    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading chat management...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access chat management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <div className="bg-white shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-4 text-5xl">💬</span>
                Chat Management
              </h1>
              <p className="text-xl text-gray-600">Monitor and manage chat sessions, threads, and conversations</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-green-50 px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">System Online</span>
              </div>
              <button 
                onClick={loadChatData}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🔄 Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Chat Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Chat Statistics
          </h2>
          <Grid columns={4} className="gap-6">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardBody className="text-center p-6">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl text-white">💬</span>
                </div>
                <div className="text-4xl font-bold text-blue-700 mb-2">{stats?.total_sessions || 0}</div>
                <div className="text-lg text-gray-700 font-medium">Total Sessions</div>
                <div className="text-sm text-gray-500 mt-1">All time</div>
              </CardBody>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardBody className="text-center p-6">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl text-white">🟢</span>
                </div>
                <div className="text-4xl font-bold text-green-700 mb-2">{stats?.active_sessions || 0}</div>
                <div className="text-lg text-gray-700 font-medium">Active Sessions</div>
                <div className="text-sm text-gray-500 mt-1">Currently online</div>
              </CardBody>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardBody className="text-center p-6">
                <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl text-white">✅</span>
                </div>
                <div className="text-4xl font-bold text-purple-700 mb-2">{stats?.completed_sessions || 0}</div>
                <div className="text-lg text-gray-700 font-medium">Completed</div>
                <div className="text-sm text-gray-500 mt-1">This week</div>
              </CardBody>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardBody className="text-center p-6">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl text-white">📨</span>
                </div>
                <div className="text-4xl font-bold text-orange-700 mb-2">{stats?.total_messages || 0}</div>
                <div className="text-lg text-gray-700 font-medium">Messages Sent</div>
                <div className="text-sm text-gray-500 mt-1">Today</div>
              </CardBody>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <CardBody className="text-center p-6">
                <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl text-white">⏱️</span>
                </div>
                <div className="text-4xl font-bold text-pink-700 mb-2">{stats?.avg_session_duration || 0}</div>
                <div className="text-lg text-gray-700 font-medium">Avg Duration</div>
                <div className="text-sm text-gray-500 mt-1">Minutes</div>
              </CardBody>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardBody className="text-center p-6">
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl text-white">🤖</span>
                </div>
                <div className="text-4xl font-bold text-red-700 mb-2">{stats?.active_providers || 0}</div>
                <div className="text-lg text-gray-700 font-medium">AI Providers</div>
                <div className="text-sm text-gray-500 mt-1">Active</div>
              </CardBody>
            </Card>
          </Grid>
        </div>

        {/* Chat Management Modules */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">🔧</span>
            Chat Management Modules
          </h2>
          <Grid columns={3} className="gap-6">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardBody className="text-center p-8">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-3xl text-white">🔌</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">API Integration</h3>
                <p className="text-gray-600 mb-6">Configure OpenAI, Anthropic, and Grok providers with API keys and routing rules</p>
                <Link href="/admin">
                  <Button variant="primary" className="w-full py-3 text-lg">
                    Configure APIs
                  </Button>
                </Link>
              </CardBody>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardBody className="text-center p-8">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-3xl text-white">🎭</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Stage Machine</h3>
                <p className="text-gray-600 mb-6">Manage conversation flow through DISCOVER → MIRROR → OPTIONS → PLAN → HANDOFF</p>
                <Link href="/admin/orchestrator">
                  <Button variant="primary" className="w-full py-3 text-lg">
                    Manage Stages
                  </Button>
                </Link>
              </CardBody>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardBody className="text-center p-8">
                <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-3xl text-white">🛡️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Safety Policies</h3>
                <p className="text-gray-600 mb-6">Configure content safety, age-appropriate filtering, and validation rules</p>
                <Link href="/admin/policies">
                  <Button variant="primary" className="w-full py-3 text-lg">
                    Manage Policies
                  </Button>
                </Link>
              </CardBody>
            </Card>
          </Grid>
        </div>

        {/* Provider Performance */}
        <div className="mb-8">
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                <span className="mr-3">📊</span>
                Provider Performance
              </h2>
            </CardHeader>
            <CardBody className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {providerStats.map((provider) => (
                  <div key={provider.provider_id} className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{provider.provider_name}</h3>
                      <div className={`w-4 h-4 rounded-full ${provider.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Requests:</span>
                        <span className="font-bold text-blue-600">{provider.total_requests.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-bold text-green-600">{provider.success_rate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg Response:</span>
                        <span className="font-bold text-purple-600">{provider.avg_response_time}ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Recent Chat Sessions */}
        <div className="mb-8">
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                <span className="mr-3">⚡</span>
                Recent Chat Sessions
              </h2>
            </CardHeader>
            <CardBody className="p-8">
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Session {session.id}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>👤 User: {session.user_id}</span>
                          <span>📅 Started: {new Date(session.created_at).toLocaleString()}</span>
                          <span>💬 Messages: {session.message_count}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <Button size="sm" variant="secondary" className="px-4 py-2">
                          👁️ View
                        </Button>
                        <Button size="sm" variant="secondary" className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white">
                          🛑 End
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}






