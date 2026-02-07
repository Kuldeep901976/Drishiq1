"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

export default function UserDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Check if user is authenticated
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user:', userError);
          router.push('/signin');
          return;
        }
        
        if (!currentUser) {
          router.push('/signin');
          return;
        }

        setUser(currentUser);

        // Fetch user profile from database with all relevant fields
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('first_name, last_name, email, phone, gender, date_of_birth, city, country, location, profile_image, avatar_selection, preferred_language, time_of_birth, place_of_birth, place_of_birth_city, place_of_birth_state, place_of_birth_country, astro_opt_in, is_profile_complete, profile_completion_score, credits, created_at, last_sign_in')
          .eq('id', currentUser.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          // If profile doesn't exist, user needs to complete profile
          if (profileError.code === 'PGRST116') {
            setProfileComplete(false);
            setLoading(false);
            return;
          }
          throw profileError;
        }

        if (profile) {
          setUserProfile(profile);
          
          // Check if profile is complete
          // Use is_profile_complete flag if available, otherwise check for essential fields
          const isComplete = profile.is_profile_complete ?? !!(profile.first_name && profile.email);
          setProfileComplete(isComplete);
        } else {
          setProfileComplete(false);
        }
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setProfileComplete(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto mb-4"></div>
          <p className="text-gray-500 text-base sm:text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate user's display name
  const displayName = userProfile?.first_name 
    ? `${userProfile.first_name}${userProfile.last_name ? ' ' + userProfile.last_name : ''}`
    : user?.email?.split('@')[0] || 'User';

  // Calculate age if date of birth is available
  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const userAge = userProfile?.date_of_birth ? calculateAge(userProfile.date_of_birth) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-5 flex items-center justify-center relative">
      {/* Home Button - Top Left */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-600 hover:bg-green-700 text-white border-none rounded-full cursor-pointer shadow-lg transition-all z-10 hover:scale-110"
        title="Go to Home"
      >
        <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>

      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 text-center border border-gray-200">
        {/* Header with Logo - Centered horizontally */}
        <div className="mb-6 sm:mb-8 flex justify-center relative">
          <div className="invitation-logo">
            <Image
              src="/assets/logo/Logo.png"
              alt="DrishiQ" 
              width={200} 
              height={40} 
              className="invitation-logo-img"
            />
            <div className="invitation-logo-text">
              See Through the Challenge
            </div>
          </div>
          {/* Profile Settings Button - Top Right */}
          <button
            onClick={() => router.push("/user/profile/settings")}
            className="absolute top-0 right-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-[#0B4422] hover:bg-[#0a3a1e] text-white border-none rounded-xl cursor-pointer text-sm sm:text-base font-semibold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all"
            title="Profile Settings"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Profile Settings</span>
            <span className="sm:hidden">Settings</span>
          </button>
        </div>

        {/* Success Message */}
        <div className="mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
            <svg width="32" height="32" className="sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0B4422] mb-4">
            Welcome to Your Dashboard
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-500 leading-relaxed mb-4">
            Hello {displayName}! {userAge ? `You're ${userAge} years old. ` : ''}Welcome to your personalized DrishiQ dashboard.
          </p>
          {userProfile && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                {userProfile.email && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-semibold">Email</p>
                    <p className="text-sm sm:text-base text-[#0B4422] break-words">{userProfile.email}</p>
                  </div>
                )}
                {userProfile.city && userProfile.country && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-semibold">Location</p>
                    <p className="text-sm sm:text-base text-[#0B4422]">{userProfile.city}, {userProfile.country}</p>
                  </div>
                )}
                {userProfile.profile_completion_score !== null && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-semibold">Profile Completion</p>
                    <p className="text-sm sm:text-base text-[#0B4422]">{userProfile.profile_completion_score}%</p>
                  </div>
                )}
                {userProfile.credits !== null && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1 font-semibold">Credits</p>
                    <p className="text-sm sm:text-base text-[#0B4422]">{userProfile.credits || 0}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {!profileComplete && (
            <div className="bg-yellow-50 border border-yellow-500 rounded-xl p-4 mt-4 text-left">
              <p className="text-sm sm:text-base text-yellow-800 font-medium">
                <strong>Next Step:</strong> Complete your profile to unlock full access to DrishiQ features including chat, community, and personalized content.
              </p>
            </div>
          )}
        </div>

        {/* Dashboard Content */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#0B4422',
            marginBottom: '24px'
          }}>
            What's Next?
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {/* Profile Card */}
            <div style={{
              padding: '24px',
              border: '2px solid #e5e7eb',
              borderRadius: '16px',
              backgroundColor: '#f9fafb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#0B4422';
              e.currentTarget.style.backgroundColor = '#f0f9ff';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(11, 68, 34, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={() => router.push("/user/profile/settings")}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#0B4422',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'white' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#0B4422',
                marginBottom: '8px'
              }}>
                Complete Your Profile
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
                Add more details to personalize your experience
              </p>
            </div>

            {/* Blog Card */}
            <div style={{
              padding: '24px',
              border: '2px solid #e5e7eb',
              borderRadius: '16px',
              backgroundColor: '#f9fafb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#0B4422';
              e.currentTarget.style.backgroundColor = '#f0f9ff';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(11, 68, 34, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={() => router.push("/blog")}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#0B4422',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'white' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#0B4422',
                marginBottom: '8px'
              }}>
                Explore Our Blog
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
                Discover insights and stories from our community
              </p>
            </div>

            {/* Community Card */}
            <div style={{
              padding: '24px',
              border: '2px solid #e5e7eb',
              borderRadius: '16px',
              backgroundColor: '#f9fafb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#0B4422';
              e.currentTarget.style.backgroundColor = '#f0f9ff';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(11, 68, 34, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={() => router.push("/community")}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#0B4422',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'white' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#0B4422',
                marginBottom: '8px'
              }}>
                Join Community
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
                Connect with like-minded individuals
              </p>
            </div>

            {/* Chat Card */}
            <div style={{
              padding: '24px',
              border: '2px solid #e5e7eb',
              borderRadius: '16px',
              backgroundColor: '#f9fafb',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#0B4422';
              e.currentTarget.style.backgroundColor = '#f0f9ff';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(11, 68, 34, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={() => window.location.href = 'http://localhost:3001'}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#0B4422',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'white' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#0B4422',
                marginBottom: '8px'
              }}>
                Start Chatting
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
                Begin your conversation with DrishiQ
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            fontStyle: 'italic'
          }}>
            Click on any card above to get started, or explore more below
          </p>
        </div>

        {/* Main Chat Access Button */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {profileComplete ? (
            <>
              <button
                onClick={() => router.push("/user/chat")}
                style={{
                  background: 'linear-gradient(135deg, #0B4422 0%, #0a3a1e 100%)',
                  color: 'white',
                  padding: '20px 32px',
                  borderRadius: '16px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 25px rgba(11, 68, 34, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  margin: '0 auto'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(11, 68, 34, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(11, 68, 34, 0.3)';
                }}
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Start Your Chat Journey
              </button>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginTop: '12px',
                fontStyle: 'italic'
              }}>
                Ready to see through your challenges? Begin your conversation now.
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/user/profile")}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  padding: '20px 32px',
                  borderRadius: '16px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  margin: '0 auto'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(245, 158, 11, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.3)';
                }}
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Complete Your Profile First
              </button>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginTop: '12px',
                fontStyle: 'italic'
              }}>
                Complete your profile to unlock chat access and other features.
              </p>
            </>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}
