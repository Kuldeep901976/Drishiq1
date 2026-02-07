'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import SessionDashboard from '@/components/SessionDashboard';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface SessionTemplate {
  id: string;
  name: string;
  type: string;
  duration_minutes: number;
  credit_cost: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface UserSession {
  id: string;
  user_id: string;
  title: string;
  session_type: string;
  status: string;
  duration_minutes: number;
  actual_duration_minutes?: number;
  credits_deducted: number;
  credits_refunded: number;
  net_credits: number;
  created_at: string;
  users?: {
    email: string;
    name?: string;
  };
}

interface DailyStats {
  session_date: string;
  session_type: string;
  session_count: number;
  completed_count: number;
  total_credits_used: number;
  avg_duration: number;
}

function SessionsContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'user';
  const isAdmin = mode === 'admin';

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSessionType, setSelectedSessionType] = useState<string>('all');

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    } else {
      loadUserData();
    }
  }, [isAdmin]);

  const loadUserData = async () => {
    // Load user session data
    setLoading(false);
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      setUser(session.user);

      // Load session templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('session_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      // Load user sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_sessions')
        .select(`
          *,
          users:user_id (
            email,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Load daily stats
      const { data: statsData, error: statsError } = await supabase
        .from('daily_session_stats')
        .select('*')
        .order('session_date', { ascending: false });

      if (statsError) throw statsError;
      setDailyStats(statsData || []);

    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Management</h1>
            <p className="text-gray-600">Manage session templates and monitor user sessions</p>
          </div>

          {/* Admin-specific content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Session Templates */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {templates.map((template) => (
                      <div key={template.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{template.name}</h3>
                            <p className="text-sm text-gray-600">{template.description}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{template.type}</Badge>
                              <Badge variant="outline">{template.duration_minutes} min</Badge>
                              <Badge variant="outline">{template.credit_cost} credits</Badge>
                            </div>
                          </div>
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* User Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sessions.slice(0, 10).map((session) => (
                      <div key={session.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{session.title}</h3>
                            <p className="text-sm text-gray-600">
                              {session.users?.email} • {session.session_type}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{session.status}</Badge>
                              <Badge variant="outline">{session.duration_minutes} min</Badge>
                              <Badge variant="outline">{session.net_credits} credits</Badge>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Templates</p>
                      <p className="text-2xl font-bold">{templates.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Sessions</p>
                      <p className="text-2xl font-bold">{sessions.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Templates</p>
                      <p className="text-2xl font-bold">
                        {templates.filter(t => t.is_active).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User view - use the existing SessionDashboard component
  return (
    <div className="min-h-screen bg-gray-50">
      <SessionDashboard />
    </div>
  );
}

export default function UnifiedSessionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    }>
      <SessionsContent />
    </Suspense>
  );
}
















