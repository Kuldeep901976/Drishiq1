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
import Footer from '@/components/Footer';

interface DashboardStats {
  total_support_credits: number;
  allocated_credits: number;
  used_credits: number;
  needy_individuals: number;
  pending_requests: number;
  pending_suggestions: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
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
      // Check for localStorage admin session first
      const adminSession = localStorage.getItem('admin_session');
      if (adminSession && adminSession.trim()) {
        try {
          const adminUser = JSON.parse(adminSession);
          setUser(adminUser);
          setIsAdmin(true);
        } catch (e) {
          console.error('Failed to parse admin_session from localStorage:', e);
          // Clear invalid data
          try {
            localStorage.removeItem('admin_session');
          } catch (clearErr) {
            // Ignore storage errors
          }
        }
        loadDashboardData();
        setAuthLoading(false);
        return;
      }

      // Fallback to Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // No user session, redirect to login
        router.push('/admin/login');
        return;
      }

      setUser(session.user);

      // Check if user is admin
      const response = await fetch('/api/admin/check-access');
      if (response.ok) {
        const { isAdmin: adminStatus } = await response.json();
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          // User is not admin, redirect to home
          router.push('/');
          return;
        }
        
        // User is authenticated and is admin, load dashboard data
        loadDashboardData();
      } else {
        // Error checking admin status, redirect to home
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      router.push('/admin/login');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load overview stats
      const overviewResponse = await fetch('/api/admin/dashboard?action=overview');
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        if (overviewData.success) {
          const data = overviewData.data;
          setStats({
            total_support_credits: data.needySupport.totalSupportCredits,
            allocated_credits: data.needySupport.totalSupportCredits,
            used_credits: data.needySupport.usedSupportCredits,
            needy_individuals: data.needySupport.totalNeedy,
            pending_requests: data.needySupport.pendingRequests,
            pending_suggestions: data.communitySuggestions?.pending || 0
          });
        }
      }

      // Load recent activity
      const activityResponse = await fetch('/api/admin/dashboard?action=recent-activity');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        if (activityData.success) {
          setRecentActivity(activityData.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0B4422] animate-pulse"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access the admin dashboard.</p>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/admin/login')}
              className="w-full px-6 py-3 rounded-xl bg-[#0B4422] text-white hover:bg-[#0B4422]/90 transition-colors"
            >
              🔐 Admin Login
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-700">
              <strong>Admin Access:</strong> Use <code className="bg-blue-100 px-1 rounded">admin@drishiq.com</code> to access the admin dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <Container>
          <Section>
            <LoadingSpinner />
          </Section>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Container>
      <Section>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0B4422] mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage all aspects of the DrishiQ platform</p>
                {user && (
                  <p className="text-sm text-gray-500 mt-2">
              Welcome, {user.email}
                  </p>
                )}
        </div>

        {/* Stats Overview */}
        <Grid cols={4} className="drishiq-mb-lg">
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats?.needy_individuals || 0}</div>
              <div className="text-sm text-gray-500">Needy Individuals</div>
              <div className="text-xs text-gray-400">{stats?.pending_requests || 0} requests</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.total_support_credits || 0}</div>
              <div className="text-sm text-gray-500">Support Credits</div>
              <div className="text-xs text-gray-400">{stats?.used_credits || 0} used</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-500">Total Users</div>
              <div className="text-xs text-gray-400">0 active</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats?.pending_suggestions || 0}</div>
              <div className="text-sm text-gray-500">Community Suggestions</div>
              <div className="text-xs text-gray-400">pending review</div>
            </CardBody>
          </Card>
        </Grid>

        {/* Main Admin Management */}
        <Grid cols={5} className="drishiq-mb-lg">
          <Card>
            <CardBody className="text-center">
              <div className="w-16 h-16 bg-[#0B4422] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏠🏠</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-sm text-gray-600 mb-4">Main admin dashboard overview</p>
              <Link href="/admin/dashboard">
                <Button variant="primary" className="w-full">
                  Go to Dashboard
                </Button>
            </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📧📧</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Invitation Management</h3>
              <p className="text-sm text-gray-600 mb-4">Review and approve early access requests</p>
              <Link href="/admin/invitations">
                <Button variant="primary" className="w-full">
                  Manage Invitations
                </Button>
                </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝📝</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Blog Management</h3>
              <p className="text-sm text-gray-600 mb-4">Review, approve, and manage blog posts</p>
              <Link href="/admin/blog-management">
                <Button variant="primary" className="w-full">
                  Manage Blog
                </Button>
                </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐⭐</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Testimonial Management</h3>
              <p className="text-sm text-gray-600 mb-4">Review and approve testimonial submissions</p>
              <Link href="/admin/invitations/testimonials">
                <Button variant="primary" className="w-full">
                  Manage Testimonials
                </Button>
                </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Invites</h3>
              <p className="text-sm text-gray-600 mb-4">Invite team members and employees</p>
              <Link href="/admin/invite-employee">
                <Button variant="primary" className="w-full">
                  Invite Employee
                </Button>
                </Link>
            </CardBody>
          </Card>
        </Grid>

        {/* Chat and System Management */}
        <Grid cols={2} className="drishiq-mb-lg">
          <Card>
            <CardBody className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat Management</h3>
              <p className="text-sm text-gray-600 mb-4">Monitor chat sessions, threads, and conversations</p>
              <Link href="/admin/chat">
                <Button variant="primary" className="w-full">
                  Manage Chat
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🪙</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Credit Management</h3>
              <p className="text-sm text-gray-600 mb-4">Manage user credits and token allocation</p>
              <Link href="/admin/credits">
                <Button variant="primary" className="w-full">
                  Manage Credits
                </Button>
              </Link>
            </CardBody>
          </Card>
        </Grid>

        {/* Additional Management Options */}
        <Grid cols={5} className="drishiq-mb-lg">
          <Card>
            <CardBody className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">📊</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Trial Invitations</h4>
              <Link href="/admin/invitations/trial">
                <Button variant="secondary" size="sm" className="w-full">
                  Manage
                </Button>
                </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">📁</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Category Invitations</h4>
              <Link href="/admin/invitations/category">
                <Button variant="secondary" size="sm" className="w-full">
                  Manage
                </Button>
                </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">📤</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Bulk Uploaded</h4>
              <Link href="/admin/invitations/bulk-uploaded">
                <Button variant="secondary" size="sm" className="w-full">
                  Review
                </Button>
                </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">✅</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Accept Invitation</h4>
              <Link href="/admin/accept-invitation">
                <Button variant="secondary" size="sm" className="w-full">
                  Accept
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">💳</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Payments</h4>
              <Link href="/admin/payments">
                <Button variant="secondary" size="sm" className="w-full">
                  Manage
                </Button>
              </Link>
            </CardBody>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
                {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.status === 'pending' ? 'bg-yellow-400' :
                          activity.status === 'approved' ? 'bg-green-400' :
                          activity.status === 'rejected' ? 'bg-red-400' :
                          'bg-gray-400'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()} • {activity.type}
                          </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
                )}
            </div>
          </CardBody>
        </Card>
      </Section>
    </Container>
      <Footer />
    </>
  );
} 