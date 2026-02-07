// Enhanced Chat Management Page with Better UI and Module Integration

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, Button, Grid, Spinner } from '@/components/ui';
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

export default function ChatManagement() {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [providerStats, setProviderStats] = useState<ProviderStats[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Admin layout handles authentication - just load data directly
    loadChatData();
  }, []);

  const loadChatData = async () => {
    try {
      setLoading(true);
      
      // Load real data from database
      await Promise.all([
        loadChatStats(),
        loadProviderStats(),
        loadRecentSessions()
      ]);

    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSessions = async () => {
    try {
      const { data: recentSessions, error } = await supabase
        .from('chat_threads')
        .select('id, user_id, created_at, status')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading recent sessions:', error);
        setSessions([]);
        return;
      }

      // Get message count for each session
      const sessionsWithCounts = await Promise.all(
        (recentSessions || []).map(async (session) => {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('thread_id', session.id);

          return {
            ...session,
            message_count: count || 0
          };
        })
      );

      setSessions(sessionsWithCounts);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
      setSessions([]);
    }
  };

  const loadChatStats = async () => {
    try {
      // Get total sessions
      const { count: totalSessions } = await supabase
        .from('chat_threads')
        .select('*', { count: 'exact', head: true });

      // Get active sessions (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: activeSessions } = await supabase
        .from('chat_threads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('updated_at', fiveMinutesAgo);

      // Get completed sessions this week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: completedSessions } = await supabase
        .from('chat_threads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', weekAgo);

      // Get total messages today
      const today = new Date().toISOString().split('T')[0];
      const { count: totalMessages } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Get average session duration
      const { data: sessions } = await supabase
        .from('chat_threads')
        .select('created_at, updated_at')
        .eq('status', 'completed')
        .gte('updated_at', weekAgo);

      const avgDuration = sessions?.length ? 
        sessions.reduce((acc, session) => {
          const duration = new Date(session.updated_at).getTime() - new Date(session.created_at).getTime();
          return acc + duration;
        }, 0) / sessions.length / (1000 * 60) : 0; // Convert to minutes

      // Get active providers
      const { count: activeProviders } = await supabase
        .from('chat_llm_providers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setStats({
        total_sessions: totalSessions || 0,
        active_sessions: activeSessions || 0,
        completed_sessions: completedSessions || 0,
        total_messages: totalMessages || 0,
        avg_session_duration: Math.round(avgDuration),
        active_providers: activeProviders || 0
      });

    } catch (error) {
      console.error('Error loading chat stats:', error);
      // Fallback to zero values
      setStats({
        total_sessions: 0,
        active_sessions: 0,
        completed_sessions: 0,
        total_messages: 0,
        avg_session_duration: 0,
        active_providers: 0
      });
    }
  };

  const loadProviderStats = async () => {
    try {
      const { data: providers } = await supabase
        .from('chat_llm_providers')
        .select('*')
        .eq('is_active', true);

      if (!providers) {
        setProviderStats([]);
        return;
      }

      const providerStatsPromises = providers.map(async (provider) => {
        // Get request count for this provider
        const { count: totalRequests } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('provider_id', provider.id);

        // Calculate success rate (simplified - messages without errors)
        const { count: successfulRequests } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('provider_id', provider.id)
          .is('error', null);

        const successRate = totalRequests && successfulRequests ? (successfulRequests / totalRequests) * 100 : 0;

        // Get average response time (simplified calculation)
        const { data: recentMessages } = await supabase
          .from('chat_messages')
          .select('created_at')
          .eq('provider_id', provider.id)
          .order('created_at', { ascending: false })
          .limit(100);

        const avgResponseTime = recentMessages?.length ? 
          recentMessages.reduce((acc, msg, index) => {
            if (index === 0) return acc;
            const timeDiff = new Date(msg.created_at).getTime() - new Date(recentMessages[index - 1].created_at).getTime();
            return acc + timeDiff;
          }, 0) / (recentMessages.length - 1) : 1000;

        return {
          provider_id: provider.id,
          provider_name: provider.name,
          total_requests: totalRequests || 0,
          avg_response_time: Math.round(avgResponseTime),
          success_rate: Math.round(successRate * 10) / 10,
          is_active: provider.is_active
        };
      });

      const stats = await Promise.all(providerStatsPromises);
      setProviderStats(stats);

    } catch (error) {
      console.error('Error loading provider stats:', error);
      setProviderStats([]);
    }
  };

  const handleSessionAction = async (sessionId: string, action: 'view' | 'end') => {
    try {
      if (action === 'view') {
        // Navigate to session details (you can create this page)
        router.push(`/admin/chat/session/${sessionId}`);
      } else if (action === 'end') {
        // End the session
        const { error } = await supabase
          .from('chat_threads')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (error) {
          console.error('Error ending session:', error);
          return;
        }

        // Reload sessions
        await loadRecentSessions();
      }
    } catch (error) {
      console.error(`Error ${action}ing session:`, error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading chat management...</p>
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
              <CardContent className="text-center p-6">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl text-white">💬</span>
                </div>
                <div className="text-4xl font-bold text-blue-700 mb-2">{stats?.total_sessions || 0}</div>
                <div className="text-lg text-gray-700 font-medium">Total Sessions</div>
                <div className="text-sm text-gray-500 mt-1">All time</div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="text-center p-6">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl text-white">🟢</span>
                </div>
                <div className="text-4xl font-bold text-green-700 mb-2">{stats?.active_sessions || 0}</div>
                <div className="text-lg text-gray-700 font-medium">Active Sessions</div>
                <div className="text-sm text-gray-500 mt-1">Currently online</div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="text-center p-6">
                <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl text-white">✅</span>
                </div>
                <div className="text-4xl font-bold text-purple-700 mb-2">{stats?.completed_sessions || 0}</div>
                <div className="text-lg text-gray-700 font-medium">Completed</div>
                <div className="text-sm text-gray-500 mt-1">This week</div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="text-center p-6">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl text-white">📨</span>
                </div>
                <div className="text-4xl font-bold text-orange-700 mb-2">{stats?.total_messages || 0}</div>
                <div className="text-lg text-gray-700 font-medium">Messages Sent</div>
                <div className="text-sm text-gray-500 mt-1">Today</div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <CardContent className="text-center p-6">
                <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl text-white">⏱️</span>
                </div>
                <div className="text-4xl font-bold text-pink-700 mb-2">{stats?.avg_session_duration || 0}</div>
                <div className="text-lg text-gray-700 font-medium">Avg Duration</div>
                <div className="text-sm text-gray-500 mt-1">Minutes</div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="text-center p-6">
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl text-white">🤖</span>
                </div>
                <div className="text-4xl font-bold text-red-700 mb-2">{stats?.active_providers || 0}</div>
                <div className="text-lg text-gray-700 font-medium">AI Providers</div>
                <div className="text-sm text-gray-500 mt-1">Active</div>
              </CardContent>
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
              <CardContent className="text-center p-8">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-3xl text-white">🔌</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">API Integration</h3>
                <p className="text-gray-600 mb-6">Configure OpenAI, Anthropic, and Grok providers with API keys and routing rules</p>
                <Link href="/admin/api-configuration">
                  <Button variant="primary" className="w-full py-3 text-lg">
                    Configure APIs
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="text-center p-8">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-3xl text-white">🎭</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Stage Machine</h3>
                <p className="text-gray-600 mb-6">Configure and monitor DDSA stages: greeting, intent, enrichment, plan, feedback, and more</p>
                <Link href="/admin/ddsa/flow">
                  <Button variant="primary" className="w-full py-3 text-lg">
                    Configure Stages
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="text-center p-8">
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
              </CardContent>
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
            <CardContent className="p-8">
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
            </CardContent>
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
            <CardContent className="p-8">
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
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="px-4 py-2"
                          onClick={() => handleSessionAction(session.id, 'view')}
                        >
                          👁️ View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="px-4 py-2 bg-red-600 text-white hover:bg-red-700"
                          onClick={() => handleSessionAction(session.id, 'end')}
                        >
                          🛑 End
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}