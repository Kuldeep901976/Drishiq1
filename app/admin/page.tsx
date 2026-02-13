'use client';

import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { useSuperAdminAuth } from '@/hooks/useSuperAdminAuth';

interface DashboardStats {
  totalUsers: number;
  totalBlogs: number;
  totalTestimonials: number;
  totalGuestStories: number;
  totalRequests: number;
  totalCredits: number;
  totalPricing: number;
  totalSupport: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useSuperAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBlogs: 0,
    totalTestimonials: 0,
    totalGuestStories: 0,
    totalRequests: 0,
    totalCredits: 0,
    totalPricing: 0,
    totalSupport: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const countsResponse = await fetch('/api/admin/counts', { headers });
      const countsData = await countsResponse.json();
      
      if (countsData.success && countsData.counts) {
        setStats({
          totalUsers: countsData.counts.users || 0,
          totalBlogs: countsData.counts.blogs || 0,
          totalTestimonials: countsData.counts.testimonials || 0,
          totalGuestStories: countsData.counts.guestStories || 0,
          totalRequests: countsData.counts.requests || 0,
          totalCredits: 500, // Keep hardcoded for now, can be updated later
          totalPricing: 8, // Keep hardcoded for now, can be updated later
          totalSupport: 23 // Keep hardcoded for now, can be updated later
        });
      } else {
        throw new Error('Failed to fetch counts');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to 0 on error
      setStats({
        totalUsers: 0,
        totalBlogs: 0,
        totalTestimonials: 0,
        totalGuestStories: 0,
        totalRequests: 0,
        totalCredits: 500,
        totalPricing: 8,
        totalSupport: 23
      });
    } finally {
      setLoading(false);
    }
  };

  const managementSections = [
    {
      id: 'blog',
      title: 'Blog Management',
      description: 'Manage blog posts, categories, and content',
      icon: '📝',
      color: 'blue',
      href: '/admin/blog-management',
      count: stats.totalBlogs
    },
    {
      id: 'seo-dashboard',
      title: 'SEO Dashboard',
      description: 'Real-time SEO analytics, content performance, and recommendations',
      icon: '📊',
      color: 'emerald',
      href: '/admin/seo-dashboard',
      count: 'NEW',
      isNew: true
    },
    {
      id: 'testimonials',
      title: 'Testimonials',
      description: 'Manage user testimonials and reviews',
      icon: '💬',
      color: 'green',
      href: '/admin/invitations/testimonials',
      count: stats.totalTestimonials
    },
    {
      id: 'guest-stories',
      title: 'Guest Stories',
      description: 'Review and approve guest story submissions',
      icon: '📖',
      color: 'orange',
      href: '/admin/guest-stories',
      count: stats.totalGuestStories || 0
    },
    {
      id: 'credits',
      title: 'Credit Management',
      description: 'Manage credit allocations and usage',
      icon: '💰',
      color: 'purple',
      href: '/admin/credits',
      count: stats.totalCredits
    },
    {
      id: 'pricing',
      title: 'Pricing Management',
      description: 'Manage pricing plans and packages',
      icon: '💳',
      color: 'yellow',
      href: '/admin/pricing',
      count: stats.totalPricing
    },
    {
      id: 'coupons',
      title: 'Coupon Management',
      description: 'Create and manage discount coupons',
      icon: '🎫',
      color: 'emerald',
      href: '/admin/coupons',
      count: 0
    },
    {
      id: 'affiliates',
      title: 'Affiliate Management',
      description: 'Manage affiliates, track earnings, and payouts',
      icon: '🤝',
      color: 'blue',
      href: '/admin/affiliates',
      count: 0
    },
    {
      id: 'advertisements',
      title: 'Advertisement Management',
      description: 'Manage ad campaigns, placements, and advertisers',
      icon: '📢',
      color: 'orange',
      href: '/admin/ads',
      count: 0
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: '👥',
      color: 'indigo',
      href: '/admin/users',
      count: stats.totalUsers
    },
    {
      id: 'support',
      title: 'Support Management',
      description: 'Manage support requests and tickets',
      icon: '🎧',
      color: 'red',
      href: '/admin/support',
      count: stats.totalSupport
    },
    {
      id: 'requests',
      title: 'Request Management',
      description: 'Manage trial access and sponsor support requests',
      icon: '📋',
      color: 'emerald',
      href: '/admin/requests',
      count: stats.totalRequests || 0
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View platform analytics and insights',
      icon: '📊',
      color: 'teal',
      href: '/admin/analytics',
      count: 0
    },
    {
      id: 'chat',
      title: 'Chat Management',
      description: 'Monitor chat sessions, threads, and conversations',
      icon: '💬',
      color: 'indigo',
      href: '/admin/chat',
      count: 0
    },
    {
      id: 'system-health',
      title: 'System Health',
      description: 'Monitor system performance, status, and health metrics',
      icon: '🏥',
      color: 'red',
      href: '/admin/system-health',
      count: 0
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200',
      green: 'bg-green-100 text-green-600 border-green-200 hover:bg-green-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200 hover:bg-purple-200',
      yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200 hover:bg-yellow-200',
      indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200 hover:bg-indigo-200',
      pink: 'bg-pink-100 text-pink-600 border-pink-200 hover:bg-pink-200',
      red: 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200',
      teal: 'bg-teal-100 text-teal-600 border-teal-200 hover:bg-teal-200',
      emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200 hover:bg-emerald-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const handleNavigation = (href: string) => {
    console.log('🔗 [Admin Dashboard] Navigation clicked:', href);
    
    // Verify authentication before navigating
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('admin_session_token') 
      : null;
    const expires = typeof window !== 'undefined' 
      ? localStorage.getItem('admin_session_expires') 
      : null;

    console.log('🔐 [Admin Dashboard] Auth check:', { 
      hasToken: !!token, 
      hasExpires: !!expires,
      expiresValid: expires ? new Date(expires) > new Date() : false
    });

    if (!token || !expires || new Date(expires) <= new Date()) {
      console.log('⚠️ [Admin Dashboard] No valid session, redirecting to sign-in');
      // Redirect to sign-in with returnTo parameter
      const returnTo = `?returnTo=${encodeURIComponent(href)}`;
      router.push(`/admin/super-admin-signin${returnTo}`);
      return;
    }

    console.log('✅ [Admin Dashboard] Session valid, navigating to:', href);
    router.push(href);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" style={{ pointerEvents: 'auto' }}>
      
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24" style={{ pointerEvents: 'auto' }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your DrishiQ platform</p>
        </div>

        {/* Management Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {managementSections.map((section) => (
            <div
              key={section.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ [Admin Dashboard] Card clicked:', section.id, section.href);
                handleNavigation(section.href);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNavigation(section.href);
                }
              }}
              role="button"
              tabIndex={0}
              className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 relative ${getColorClasses(section.color)}`}
              style={{ pointerEvents: 'auto' }}
            >
              {(section as any).isNew && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  NEW
                </span>
              )}
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">{section.icon}</div>
                <div className="text-2xl font-bold">
                  {section.count !== null ? section.count : '—'}
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
              <p className="text-sm opacity-75">{section.description}</p>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalBlogs}</div>
              <div className="text-sm text-gray-600">Blog Posts</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalCredits}</div>
              <div className="text-sm text-gray-600">Credits</div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 