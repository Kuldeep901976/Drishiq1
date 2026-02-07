'use client';

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

const AVATAR_OPTIONS = [
  '/assets/avatar/users/girlcasual.png',
  '/assets/avatar/users/girlmarigeparty.png',
  '/assets/avatar/users/girlfunparty.png',
  '/assets/avatar/users/girlparty.png',
  '/assets/avatar/users/girlsport.png',
  '/assets/avatar/users/girltrad.png',
  '/assets/avatar/users/gorlparty.png',
  '/assets/avatar/users/girlschool.png',
  '/assets/avatar/users/girlcollege.png',
  '/assets/avatar/users/girlbusinesscurly.png',
  '/assets/avatar/users/girlcurly.png',
  '/assets/avatar/users/girlshorthair.png',
  '/assets/avatar/users/womensari.png',
  '/assets/avatar/users/girlsari.png',
  '/assets/avatar/users/Girl profile.png',
  '/assets/avatar/users/avatar shirt.png',
  '/assets/avatar/users/avatar confide.png',
  '/assets/avatar/users/avatar sweater directing.png',
  '/assets/avatar/users/avatar support dlogo.png',
  '/assets/avatar/users/avatar think drishiq logo.png',
  '/assets/avatar/users/avatar businessman.png',
  '/assets/avatar/users/avatar techie with drishiqlogo.png',
  '/assets/avatar/users/avatar techie.png',
  '/assets/avatar/users/avatar casual.png',
  '/assets/avatar/users/drishiQ avatar.png'
];

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  location: string | null;
  profile_image: string | null;
  avatar_selection: string | null;
  date_of_birth: string | null;
  gender: string | null;
  preferred_language: string;
  profile_completion_score: number | null;
  credits: number | null;
  bio: string | null;
  occupation: string | null;
  display_name: string | null;
  created_at: string;
  last_sign_in: string | null;
  is_profile_complete: boolean | null;
}

interface ChatThread {
  id: string;
  domain_of_life: string;
  stage: string;
  status: string;
  solution_summary: string | null;
  solution_status: string | null;
  report_pdf_url: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chats' | 'solutions' | 'reports' | 'schedule' | 'progress'>('overview');
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUserActive, setIsUserActive] = useState<boolean | null>(null);
  const imageOptionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!slug) {
        setError('Invalid user identifier');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get current authenticated user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setCurrentUser(authUser);

        // Try to fetch user by ID (UUID) or username
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        
        let query = supabase
          .from('users')
          .select('id, first_name, last_name, email, phone, city, country, location, profile_image, avatar_selection, date_of_birth, gender, preferred_language, profile_completion_score, credits, created_at, last_sign_in, bio, occupation, display_name, is_profile_complete, is_active')
          .limit(1);

        if (isUUID) {
          query = query.eq('id', slug);
        } else {
          query = query.or(`username.eq.${slug},email.eq.${slug}`);
        }

        const { data: profile, error: profileError } = await query.single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            setError('User not found');
          } else {
            setError('Failed to load user profile');
            console.error('Profile fetch error:', profileError);
          }
          setLoading(false);
          return;
        }

        if (profile) {
          const isOwnProfile = authUser?.id === profile.id;
          setIsUserActive(profile.is_active !== false);
          
          // Check if user is deactivated/deleted and restrict access
          if (profile.is_active === false && !isOwnProfile) {
            setError('This user account is currently inactive. Data access is restricted.');
            setLoading(false);
            return;
          }
          
          setUserProfile(profile as UserProfile);

          // Fetch chat threads for this user
          const { data: threads, error: threadsError } = await supabase
            .from('chat_threads')
            .select('id, domain_of_life, stage, status, created_at, updated_at')
            .eq('user_id', profile.id)
            .order('updated_at', { ascending: false })
            .limit(20);

          if (!threadsError && threads) {
            const threadsWithCounts = await Promise.all(
              threads.map(async (thread) => {
                const { count } = await supabase
                  .from('chat_messages')
                  .select('*', { count: 'exact', head: true })
                  .eq('thread_id', thread.id);
                
                return {
                  ...thread,
                  message_count: count || 0
                };
              })
            );
            setChatThreads(threadsWithCounts as ChatThread[]);
          }
        }
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [slug]);

  // Close image options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (imageOptionsRef.current && !imageOptionsRef.current.contains(event.target as Node)) {
        setShowImageOptions(false);
      }
    };

    if (showImageOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showImageOptions]);

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

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f0f9f4 0%, #ffffff 50%, #f0fdf4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '100px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0B4422] border-t-transparent mx-auto mb-4"></div>
          <p style={{ color: '#6b7280', fontSize: '18px', fontWeight: '500' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f0f9f4 0%, #ffffff 50%, #f0fdf4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        paddingTop: '120px'
      }}>
        <div style={{ 
          textAlign: 'center',
          backgroundColor: 'white',
          padding: '48px',
          borderRadius: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>😕</div>
          <h1 style={{ fontSize: '28px', color: '#0B4422', marginBottom: '12px', fontWeight: '700' }}>User Not Found</h1>
          <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '16px' }}>{error || 'The user profile you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '14px 28px',
              backgroundColor: '#0B4422',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#083318';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0B4422';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const displayName = userProfile.first_name 
    ? `${userProfile.first_name}${userProfile.last_name ? ' ' + userProfile.last_name : ''}`
    : userProfile.display_name || userProfile.email?.split('@')[0] || 'User';
  
  const userAge = userProfile.date_of_birth ? calculateAge(userProfile.date_of_birth) : null;
  const completedThreads = chatThreads.filter(t => t.status === 'completed' || t.solution_status === 'completed').length;
  const activeThreads = chatThreads.filter(t => t.status === 'active').length;
  const isOwnProfile = currentUser?.id === userProfile.id;

  // Function to break down credits into icons (greedy algorithm)
  const getCreditIcons = (credits: number) => {
    const icons: { value: number; path: string; count: number }[] = [];
    let remaining = credits;
    
    // Available icon denominations (in descending order)
    const denominations = [
      { value: 20, path: '/assets/other-Icons/20-icon.jpg' },
      { value: 10, path: '/assets/other-Icons/10-icon.jpg' },
      { value: 5, path: '/assets/other-Icons/5-icon.jpg' }, // Note: Using 5-icon for values 3-5
      { value: 2, path: '/assets/other-Icons/2-icon.jpg' },
      { value: 1, path: '/assets/other-Icons/1-icon.jpg' }
    ];

    for (const denom of denominations) {
      const count = Math.floor(remaining / denom.value);
      if (count > 0) {
        icons.push({ ...denom, count });
        remaining = remaining % denom.value;
      }
    }

    return icons;
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser?.id}-${Math.random()}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !isOwnProfile) return;

    try {
      setUploading(true);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setSelectedImage(file);

      const imageUrl = await uploadImage(file);

      const { error } = await supabase
        .from('users')
        .update({
          profile_image: imageUrl,
          avatar_selection: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      setUserProfile(prev => prev ? {
        ...prev,
        profile_image: imageUrl,
        avatar_selection: null
      } : null);

      setShowImageOptions(false);
      setSelectedImage(null);
      setImagePreview('');
    } catch (err: any) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarSelection = async (avatarPath: string) => {
    if (!currentUser || !isOwnProfile) return;

    try {
      setUploading(true);

      const { error } = await supabase
        .from('users')
        .update({
          avatar_selection: avatarPath,
          profile_image: avatarPath,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      setUserProfile(prev => prev ? {
        ...prev,
        avatar_selection: avatarPath,
        profile_image: avatarPath
      } : null);

      setShowImageOptions(false);
      setSelectedImage(null);
      setImagePreview('');
    } catch (err: any) {
      console.error('Error selecting avatar:', err);
      alert('Failed to update avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 pt-24 sm:pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Hero Profile Section */}
        <div className="bg-gradient-to-r from-[#0B4422] to-[#166534] rounded-3xl p-6 sm:p-8 lg:p-12 mb-8 shadow-2xl relative overflow-visible w-full">
          {/* Decorative background elements */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(40px)'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            filter: 'blur(30px)'
          }}></div>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center relative z-10 w-full overflow-visible flex-wrap">
            {/* Profile Image */}
            <div className="relative flex-shrink-0 w-auto order-1 sm:order-1">
              <button
                onClick={() => isOwnProfile && setShowImageOptions(!showImageOptions)}
                disabled={!isOwnProfile || uploading}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  cursor: isOwnProfile ? 'pointer' : 'default',
                  position: 'relative',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  if (isOwnProfile) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                title={isOwnProfile ? 'Click to change profile image' : ''}
              >
                {isOwnProfile && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                    pointerEvents: 'none'
                  }}
                  className="group-hover:bg-black/40"
                  >
                    <svg 
                      width="40" 
                      height="40" 
                      fill="none" 
                      stroke="white" 
                      viewBox="0 0 24 24"
                      style={{
                        opacity: 0,
                        transition: 'opacity 0.3s'
                      }}
                      className="group-hover:opacity-100"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                    </svg>
                  </div>
                )}
                {userProfile.profile_image ? (
                  <Image 
                    src={userProfile.profile_image} 
                    alt={displayName}
                    width={120}
                    height={120}
                    style={{ objectFit: 'cover' }}
                  />
                ) : userProfile.avatar_selection ? (
                  <Image 
                    src={userProfile.avatar_selection} 
                    alt={displayName}
                    width={120}
                    height={120}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <span className="text-4xl sm:text-5xl text-white">👤</span>
                )}
              </button>

              {/* Image Options Popup */}
              {showImageOptions && isOwnProfile && (
                <div
                  ref={imageOptionsRef}
                  className="absolute top-36 sm:top-40 left-1/2 -translate-x-1/2 w-[90vw] sm:w-[360px] bg-white border-2 border-[#0B4422] rounded-2xl shadow-2xl p-4 sm:p-6 z-[1000]"
                >
                  <button
                    onClick={() => setShowImageOptions(false)}
                    className="absolute top-3 right-3 bg-none border-none text-2xl cursor-pointer text-gray-500 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-gray-100 hover:text-gray-700"
                  >
                    ×
                  </button>

                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2.5">
                        Upload your own image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="w-full text-sm p-2.5 border-2 border-gray-200 rounded-lg transition-all focus:border-[#0B4422] focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        JPG, PNG, GIF (max 5MB)
                      </p>
                    </div>

                    {imagePreview && (
                      <div className="flex items-center gap-4 justify-center">
                        <Image
                          src={imagePreview}
                          alt="Profile preview"
                          width={70}
                          height={70}
                          className="rounded-full object-cover border-2 border-[#0B4422]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview('');
                          }}
                          className="text-xs text-red-600 bg-none border-none cursor-pointer underline font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    <div className="border-t-2 border-gray-200 pt-4">
                      <p className="text-sm text-gray-500 text-center mb-4 font-medium">OR</p>
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-3">
                        Choose from our avatars
                      </label>
                      <div className="grid grid-cols-4 gap-2.5 max-h-[180px] overflow-y-auto p-1.5">
                        {AVATAR_OPTIONS.map((avatar, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleAvatarSelection(avatar)}
                            disabled={uploading}
                            className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 rounded-xl border-2 p-1 bg-white transition-all flex-shrink-0 ${
                              userProfile.avatar_selection === avatar
                                ? 'border-[#0B4422] border-3'
                                : 'border-gray-200 hover:border-[#0B4422] hover:scale-110 hover:shadow-md'
                            } ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <Image
                              src={avatar}
                              alt={`Avatar ${index + 1}`}
                              width={64}
                              height={64}
                              className="rounded-lg object-cover w-full h-full"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-white flex flex-col justify-center text-center sm:text-left w-full order-2 sm:order-2">
              <div className="w-full overflow-visible px-0 sm:px-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-white leading-tight break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {displayName}
                </h1>
                {userProfile.bio && (
                  <p className="text-base sm:text-lg text-white/90 mb-4 leading-relaxed break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {userProfile.bio}
                  </p>
                )}
                <div className="flex gap-4 sm:gap-6 flex-wrap items-center mt-4">
                  {userProfile.city && userProfile.country && (
                    <div className="flex items-center gap-2 text-sm sm:text-base text-white/90 shrink-0">
                      <span>📍</span>
                      <span className="whitespace-nowrap">{userProfile.city}, {userProfile.country}</span>
                    </div>
                  )}
                  {userAge && (
                    <div className="flex items-center gap-2 text-sm sm:text-base text-white/90 whitespace-nowrap shrink-0">
                      <span>🎂</span>
                      <span>{userAge} years old</span>
                    </div>
                  )}
                  {userProfile.occupation && (
                    <div className="flex items-center gap-2 text-sm sm:text-base text-white/90 shrink-0">
                      <span>💼</span>
                      <span className="break-words">{userProfile.occupation}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats & Settings */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-center sm:justify-start mt-4 sm:mt-0 w-full overflow-visible order-3 flex-wrap">
              {/* Complete Percentage Box */}
              {userProfile.profile_completion_score !== null && (
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg text-center w-full sm:w-32 h-20 sm:h-24 flex flex-col justify-center items-center flex-shrink-0">
                  <div className="text-[10px] text-gray-500 font-semibold mb-1.5 uppercase tracking-wide whitespace-nowrap">
                    Complete
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#0B4422] leading-none">
                    {userProfile.profile_completion_score}%
                  </div>
                </div>
              )}

              {/* Credits Box */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg text-center w-full sm:w-auto sm:min-w-[180px] overflow-visible flex-shrink-0">
                <div className="text-[10px] text-gray-500 font-semibold mb-2.5 uppercase tracking-wide whitespace-nowrap">
                  Credits
                </div>
                {userProfile.credits && userProfile.credits > 0 ? (
                  <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 justify-center sm:justify-start items-center min-h-[60px] sm:min-h-24 w-full sm:w-auto overflow-visible">
                    {getCreditIcons(userProfile.credits).map((icon, idx) => (
                      Array.from({ length: icon.count }).map((_, i) => (
                        <Image
                          key={`${icon.value}-${idx}-${i}`}
                          src={icon.path}
                          alt={`${icon.value} credit`}
                          width={64}
                          height={64}
                          className="object-contain flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16"
                        />
                      ))
                    ))}
                  </div>
                ) : (
                  <div className="text-lg sm:text-xl font-semibold text-gray-400 min-h-[60px] sm:min-h-24 flex items-center justify-center">0</div>
                )}
              </div>

              {isOwnProfile && (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-shrink-0">
                  <button
                    onClick={() => router.push('/apps/mode-selection')}
                    className="w-full sm:w-32 h-20 sm:h-24 p-4 sm:p-6 bg-white/95 hover:bg-white text-[#0B4422] border-2 border-white/50 hover:border-white/80 rounded-2xl cursor-pointer text-sm font-semibold flex flex-col items-center justify-center gap-1.5 transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-xl flex-shrink-0"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-[10px] text-[#0B4422] font-semibold uppercase tracking-wide whitespace-nowrap">Start Chat</span>
                  </button>
                  <button
                    onClick={() => router.push('/user/profile/settings')}
                    className="w-full sm:w-32 h-20 sm:h-24 p-4 sm:p-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-white/30 hover:border-white/50 rounded-2xl cursor-pointer text-sm font-semibold flex flex-col items-center justify-center gap-1.5 transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-xl flex-shrink-0"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[10px] text-white/90 font-semibold uppercase tracking-wide whitespace-nowrap">Settings</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-1 mb-8 bg-white p-2 rounded-2xl shadow-md overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-2">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'chats', label: `Chats`, count: chatThreads.length, icon: '💬' },
            { id: 'solutions', label: `Solutions`, count: completedThreads, icon: '✅' },
            { id: 'reports', label: 'Reports', icon: '📄' },
            { id: 'schedule', label: 'Schedule', icon: '📅' },
            { id: 'progress', label: 'Progress', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 sm:px-6 py-3.5 border-none rounded-xl cursor-pointer text-sm sm:text-base font-medium whitespace-nowrap transition-all flex items-center gap-2 relative ${
                activeTab === tab.id
                  ? 'bg-[#0B4422] text-white font-semibold'
                  : 'bg-transparent text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-xl text-xs font-semibold ml-1 ${
                  activeTab === tab.id
                    ? 'bg-white/30 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-lg min-h-[500px]">
          {activeTab === 'overview' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0B4422]">
                  Profile Overview
                </h2>
                {isOwnProfile && (
                  <button
                    onClick={() => router.push('/apps/mode-selection')}
                    className="px-6 sm:px-7 py-3.5 bg-[#0B4422] hover:bg-[#083318] text-white border-none rounded-xl cursor-pointer text-sm sm:text-base font-semibold flex items-center gap-2.5 transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg w-full sm:w-auto justify-center"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Start Chat</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_2.2fr] gap-6 lg:gap-8 items-start w-full">
                {/* Left Column - Profile Information */}
                <div className="sticky top-24 lg:top-28 w-full">
                  <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl sm:rounded-3xl border-2 border-gray-200 shadow-md w-full">
                    <h3 className="text-lg sm:text-xl font-bold text-[#0B4422] mb-4 sm:mb-5 flex items-center gap-2">
                      <span>👤</span>
                      Profile Information
                    </h3>
                    <div className="flex flex-col gap-3 sm:gap-4">
                      {[
                        { label: 'Email', value: userProfile.email || 'Not provided', icon: '📧' },
                        { label: 'Phone', value: userProfile.phone || 'Not provided', icon: '📱' },
                        { label: 'Gender', value: userProfile.gender ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1) : 'Not provided', icon: '⚧️' },
                        { label: 'Language', value: userProfile.preferred_language || 'en', icon: '🌐' },
                        { label: 'Member Since', value: new Date(userProfile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), icon: '📅' },
                        { label: 'Last Sign In', value: userProfile.last_sign_in ? new Date(userProfile.last_sign_in).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Never', icon: '🕐' }
                      ].map((item, index) => (
                        <div 
                          key={index}
                          className="p-3 sm:p-4 bg-white rounded-xl border border-gray-200 transition-all hover:border-[#0B4422] hover:bg-green-50"
                        >
                          <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
                            <span className="text-base sm:text-lg">{item.icon}</span>
                            <div className="text-xs sm:text-sm text-gray-600 font-semibold uppercase tracking-wide">{item.label}</div>
                          </div>
                          <div className="text-sm sm:text-base font-semibold text-[#0B4422] ml-6 sm:ml-8 break-words">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Conversation Related Boxes */}
                <div className="w-full overflow-visible">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full overflow-visible">
                    {/* Reports Box */}
                    <div
                      className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-500 cursor-pointer transition-all min-h-[180px] sm:min-h-[200px] hover:border-blue-600 hover:-translate-y-1 hover:shadow-lg"
                      onClick={() => setActiveTab('reports')}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl sm:text-3xl">📄</div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#0B4422]">Reports</h3>
                      </div>
                      <div className="text-3xl sm:text-4xl font-bold text-blue-500 mb-2">
                        {chatThreads.filter(t => t.report_pdf_url).length}
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 mb-4">
                        Available reports from completed conversations
                      </p>
                      {chatThreads.filter(t => t.report_pdf_url).length > 0 && (
                        <div className="text-xs sm:text-sm text-blue-500 font-semibold">
                          View All →
                        </div>
                      )}
                    </div>

                    {/* Solutions Box */}
                    <div
                      className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-white rounded-2xl border-2 border-green-500 cursor-pointer transition-all min-h-[180px] sm:min-h-[200px] hover:border-green-600 hover:-translate-y-1 hover:shadow-lg"
                      onClick={() => setActiveTab('solutions')}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl sm:text-3xl">✅</div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#0B4422]">Solutions</h3>
                      </div>
                      <div className="text-3xl sm:text-4xl font-bold text-green-500 mb-2">
                        {completedThreads}
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 mb-4">
                        Completed solutions from your conversations
                      </p>
                      {completedThreads > 0 && (
                        <div className="text-xs sm:text-sm text-green-500 font-semibold">
                          View All →
                        </div>
                      )}
                    </div>

                    {/* Schedule Box */}
                    <div
                      className="p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-white rounded-2xl border-2 border-yellow-500 cursor-pointer transition-all min-h-[180px] sm:min-h-[200px] hover:border-yellow-600 hover:-translate-y-1 hover:shadow-lg"
                      onClick={() => setActiveTab('schedule')}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl sm:text-3xl">📅</div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#0B4422]">Schedule</h3>
                      </div>
                      <div className="text-3xl sm:text-4xl font-bold text-yellow-500 mb-2">
                        {chatThreads.length}
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 mb-4">
                        Scheduled sessions and reminders
                      </p>
                      <div className="text-xs sm:text-sm text-yellow-500 font-semibold">
                        View All →
                      </div>
                    </div>

                    {/* Progress Box */}
                    <div
                      className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-white rounded-2xl border-2 border-purple-500 cursor-pointer transition-all min-h-[180px] sm:min-h-[200px] hover:border-purple-600 hover:-translate-y-1 hover:shadow-lg"
                      onClick={() => setActiveTab('progress')}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl sm:text-3xl">📈</div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#0B4422]">Progress</h3>
                      </div>
                      <div className="text-3xl sm:text-4xl font-bold text-purple-500 mb-2">
                        {activeThreads}
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 mb-4">
                        Active conversations in progress
                      </p>
                      {activeThreads > 0 && (
                        <div className="text-xs sm:text-sm text-purple-500 font-semibold">
                          View All →
                        </div>
                      )}
                    </div>

                    {/* Refined Schedule Box */}
                    <div
                      className="p-4 sm:p-6 bg-gradient-to-br from-pink-50 to-white rounded-2xl border-2 border-pink-500 cursor-pointer transition-all min-h-[180px] sm:min-h-[200px] hover:border-pink-600 hover:-translate-y-1 hover:shadow-lg col-span-1 sm:col-span-2"
                      onClick={() => setActiveTab('schedule')}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl sm:text-3xl">✨</div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#0B4422]">Refined Schedule</h3>
                      </div>
                      <div className="text-3xl sm:text-4xl font-bold text-pink-500 mb-2">
                        {chatThreads.filter(t => t.status === 'completed').length}
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 mb-4">
                        Optimized and refined schedules from completed sessions
                      </p>
                      <div className="text-xs sm:text-sm text-pink-500 font-semibold">
                        View All →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chats' && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0B4422] mb-6 sm:mb-8">
                Chat Threads
              </h2>
              {chatThreads.length === 0 ? (
                <div className="text-center py-12 sm:py-16 px-5 text-gray-500">
                  <div className="text-5xl sm:text-6xl mb-4">💬</div>
                  <p className="text-lg sm:text-xl mb-2 font-semibold text-gray-700">No chat threads yet</p>
                  <p className="text-sm sm:text-base">Start a conversation to see your chats here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {chatThreads.map(thread => (
                    <div
                      key={thread.id}
                      className="p-4 sm:p-6 border-2 border-gray-200 rounded-2xl cursor-pointer transition-all bg-gradient-to-br from-white to-gray-50 hover:border-[#0B4422] hover:bg-green-50 hover:-translate-y-1 hover:shadow-lg"
                      onClick={() => router.push(`/apps/chat?thread=${thread.id}`)}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-bold text-[#0B4422] mb-2">
                            {thread.domain_of_life.charAt(0).toUpperCase() + thread.domain_of_life.slice(1).replace('-', ' ')}
                          </h3>
                          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <span>📊</span>
                              <span>{thread.stage}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span>💬</span>
                              <span>{thread.message_count || 0} messages</span>
                            </span>
                          </div>
                        </div>
                        <span className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${
                          thread.status === 'active' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {thread.status}
                        </span>
                      </div>
                      {thread.solution_summary && (
                        <p className="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">
                          {thread.solution_summary.length > 120 ? `${thread.solution_summary.substring(0, 120)}...` : thread.solution_summary}
                        </p>
                      )}
                      <div className="text-xs sm:text-sm text-gray-400 mt-4 flex items-center gap-1">
                        <span>🕐</span>
                        <span>Updated {new Date(thread.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'solutions' && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0B4422] mb-6 sm:mb-8">
                Solutions
              </h2>
              {completedThreads === 0 ? (
                <div className="text-center py-12 sm:py-16 px-5 text-gray-500">
                  <div className="text-5xl sm:text-6xl mb-4">✅</div>
                  <p className="text-lg sm:text-xl mb-2 font-semibold text-gray-700">No solutions yet</p>
                  <p className="text-sm sm:text-base">Complete a chat session to generate solutions</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {chatThreads
                    .filter(t => t.status === 'completed' || t.solution_status === 'completed')
                    .map(thread => (
                      <div
                        key={thread.id}
                        className="p-6 sm:p-7 border-2 border-green-500 rounded-2xl bg-gradient-to-br from-green-50 to-white shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-4">
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0B4422]">
                            {thread.domain_of_life.charAt(0).toUpperCase() + thread.domain_of_life.slice(1).replace('-', ' ')} Solution
                          </h3>
                          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-green-500 text-white whitespace-nowrap">
                            Completed
                          </span>
                        </div>
                        {thread.solution_summary && (
                          <p className="text-sm sm:text-base text-gray-700 mb-5 leading-relaxed">
                            {thread.solution_summary}
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3 mt-5">
                          <button
                            onClick={() => router.push(`/apps/chat?thread=${thread.id}`)}
                            className="flex-1 px-6 py-3 bg-[#0B4422] hover:bg-[#083318] text-white border-none rounded-xl cursor-pointer text-sm sm:text-base font-semibold transition-all hover:-translate-y-0.5"
                          >
                            View Details
                          </button>
                          {thread.report_pdf_url && (
                            <a
                              href={thread.report_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-6 py-3 bg-white hover:bg-green-50 text-[#0B4422] border-2 border-[#0B4422] rounded-xl cursor-pointer text-sm sm:text-base font-semibold no-underline inline-flex items-center gap-2 transition-all hover:-translate-y-0.5"
                            >
                              <span>📥</span>
                              <span>Download</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0B4422] mb-6 sm:mb-8">
                Reports & Analytics
              </h2>
              <div className="text-center py-16 sm:py-20 px-5 text-gray-500">
                <div className="text-6xl sm:text-7xl lg:text-8xl mb-6">📊</div>
                <p className="text-lg sm:text-xl lg:text-2xl mb-3 font-semibold text-gray-700">Reports feature coming soon</p>
                <p className="text-sm sm:text-base">View detailed analytics and reports about your chat sessions</p>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0B4422', marginBottom: '32px' }}>
                Schedule & Reminders
              </h2>
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280' }}>
                <div style={{ fontSize: '80px', marginBottom: '24px' }}>📅</div>
                <p style={{ fontSize: '22px', marginBottom: '12px', fontWeight: '600', color: '#374151' }}>Schedule feature coming soon</p>
                <p style={{ fontSize: '16px' }}>Manage your sessions, reminders, and follow-ups</p>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0B4422', marginBottom: '32px' }}>
                Progress Tracker
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                {[
                  { label: 'Total Chats', value: chatThreads.length, icon: '💬', color: '#3b82f6', bg: '#eff6ff' },
                  { label: 'Completed', value: completedThreads, icon: '✅', color: '#10b981', bg: '#f0fdf4' },
                  { label: 'Active', value: activeThreads, icon: '🔄', color: '#f59e0b', bg: '#fffbeb' },
                  { label: 'Profile Complete', value: `${userProfile.profile_completion_score || 0}%`, icon: '📊', color: '#8b5cf6', bg: '#faf5ff' }
                ].map((stat, index) => (
                  <div 
                    key={index}
                    style={{ 
                      padding: '28px', 
                      background: 'linear-gradient(135deg, #ffffff 0%, ' + stat.bg + ' 100%)',
                      borderRadius: '20px',
                      border: '2px solid ' + stat.color + '20',
                      textAlign: 'center',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>{stat.icon}</div>
                    <div style={{ fontSize: '36px', fontWeight: '700', color: stat.color, marginBottom: '8px' }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '15px', color: '#6b7280', fontWeight: '500' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)', borderRadius: '20px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
                <p style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>Detailed progress tracking coming soon</p>
                <p style={{ fontSize: '15px' }}>Track your journey and improvements over time</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
