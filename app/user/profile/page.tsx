'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import AvatarPlaceholder from '@/components/AvatarPlaceholder';

interface ProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  country_code: string;
  phone_number: string;
  gender: 'male' | 'female' | 'no_comments';
  preferred_language: string;
  date_of_birth: string;
  location: string;
  city: string;
  country: string;
  profile_image: string;
  avatar_selection: string;
  // Astro fields (read-only)
  time_of_birth?: string;
  place_of_birth_city?: string;
  place_of_birth_state?: string;
  place_of_birth_country?: string;
  place_of_birth_latitude?: number;
  place_of_birth_longitude?: number;
  place_of_birth_timezone?: string;
  astro_opt_in?: boolean;
  consent_provided?: boolean;
  freeze_birth_data?: boolean;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' }
];

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

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    phone: '',
    country_code: '+91',
    phone_number: '',
    gender: 'no_comments',
    preferred_language: 'en',
    date_of_birth: '',
    location: '',
    city: '',
    country: '',
    profile_image: '',
    avatar_selection: '',
    // Astro fields
    time_of_birth: undefined,
    place_of_birth_city: undefined,
    place_of_birth_state: undefined,
    place_of_birth_country: undefined,
    place_of_birth_latitude: undefined,
    place_of_birth_longitude: undefined,
    place_of_birth_timezone: undefined,
    astro_opt_in: false,
    consent_provided: false,
    freeze_birth_data: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [age, setAge] = useState<number | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showContactChangeModal, setShowContactChangeModal] = useState(false);

  // Close image options, language dropdown, and contact change modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showImageOptions) {
        const target = event.target as Element;
        if (!target.closest('.profile-image-section')) {
          setShowImageOptions(false);
        }
      }
      if (showLanguageDropdown) {
        const target = event.target as Element;
        if (!target.closest('.language-dropdown-section')) {
          setShowLanguageDropdown(false);
        }
      }
      if (showContactChangeModal) {
        const target = event.target as Element;
        if (!target.closest('.contact-change-modal')) {
          setShowContactChangeModal(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showImageOptions, showLanguageDropdown, showContactChangeModal]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
                 // Check if profile already exists - fetch all fields including astro
         const { data: profile } = await supabase
           .from('users')
           .select('first_name, last_name, phone, gender, preferred_language, date_of_birth, location, city, country, profile_image, avatar_selection, time_of_birth, place_of_birth_city, place_of_birth_state, place_of_birth_country, place_of_birth_latitude, place_of_birth_longitude, place_of_birth_timezone, astro_opt_in, consent_provided, freeze_birth_data')
           .eq('id', user.id)
           .single();
        
                 if (profile) {
           // Parse phone number into country code and number
           let countryCode = '+91';
           let phoneNumber = '';
           
                     if ((profile as any).phone) {
            // Check if phone starts with + (international format)
            if ((profile as any).phone.startsWith('+')) {
               // Extract country code (assume first 2-3 digits)
               if ((profile as any).phone.startsWith('+91')) {
                 countryCode = '+91';
                 phoneNumber = (profile as any).phone.substring(3);
               } else if ((profile as any).phone.startsWith('+1')) {
                 countryCode = '+1';
                 phoneNumber = (profile as any).phone.substring(2);
               } else {
                 countryCode = (profile as any).phone.substring(0, 3);
                 phoneNumber = (profile as any).phone.substring(3);
               }
             } else {
               // Assume Indian number without country code
               countryCode = '+91';
               phoneNumber = (profile as any).phone;
             }
           }
           
           // Parse location into city and country if location exists but city/country don't
           let city = (profile as any).city || '';
           let country = (profile as any).country || '';
           if (!city && !country && (profile as any).location) {
             const locationParts = String((profile as any).location).split(',').map((s: string) => s.trim());
             city = locationParts[0] || '';
             country = locationParts[1] || '';
           }
           
           setProfileData({
             first_name: (profile as any).first_name || '',
             last_name: (profile as any).last_name || '',
             phone: (profile as any).phone || '',
             country_code: countryCode,
             phone_number: phoneNumber,
             gender: (profile as any).gender || 'no_comments',
             preferred_language: (profile as any).preferred_language || 'en',
             date_of_birth: (profile as any).date_of_birth || '',
             location: (profile as any).location || '',
             city: city,
             country: country,
             profile_image: (profile as any).profile_image || '',
             avatar_selection: (profile as any).avatar_selection || '',
             // Astro fields (read-only)
             time_of_birth: (profile as any).time_of_birth || undefined,
             place_of_birth_city: (profile as any).place_of_birth_city || undefined,
             place_of_birth_state: (profile as any).place_of_birth_state || undefined,
             place_of_birth_country: (profile as any).place_of_birth_country || undefined,
             place_of_birth_latitude: (profile as any).place_of_birth_latitude || undefined,
             place_of_birth_longitude: (profile as any).place_of_birth_longitude || undefined,
             place_of_birth_timezone: (profile as any).place_of_birth_timezone || undefined,
             astro_opt_in: (profile as any).astro_opt_in || false,
             consent_provided: (profile as any).consent_provided || false,
             freeze_birth_data: (profile as any).freeze_birth_data || false
           });
          
          // Calculate age if DOB exists
          if ((profile as any).date_of_birth) {
            calculateAge((profile as any).date_of_birth);
          }
        }
      }
    };
    getUser();
  }, []);

  // Handle email from URL params (for magic link signup) and phone from session storage (for invitation flow)
  useEffect(() => {
    const emailFromParams = searchParams.get('email');
    if (emailFromParams && !user?.email) {
      // If we have an email from URL params but no authenticated user yet,
      // this means the user came from a magic link signup
      // We'll wait for the user to be authenticated first
      return;
    }

    // Check for phone number from invitation flow in session storage
    const invitationPhone = sessionStorage.getItem('phone_number');
    if (invitationPhone && !profileData.phone_number) {
      // Parse the phone number from invitation flow
      let countryCode = '+91';
      let phoneNumber = invitationPhone;
      
      if (invitationPhone.startsWith('+')) {
        if (invitationPhone.startsWith('+91')) {
          countryCode = '+91';
          phoneNumber = invitationPhone.substring(3);
        } else if (invitationPhone.startsWith('+1')) {
          countryCode = '+1';
          phoneNumber = invitationPhone.substring(2);
        } else {
          countryCode = invitationPhone.substring(0, 3);
          phoneNumber = invitationPhone.substring(3);
        }
      }
      
      setProfileData(prev => ({
        ...prev,
        phone: invitationPhone,
        country_code: countryCode,
        phone_number: phoneNumber
      }));
      
      // Clear the session storage
      sessionStorage.removeItem('phone_number');
    }
  }, [searchParams, user, profileData.phone_number]);

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    setAge(age);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setProfileData(prev => ({ ...prev, date_of_birth: date }));
    if (date) {
      calculateAge(date);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      // Immediately update the profile image to show the new image
      setProfileData(prev => ({ 
        ...prev, 
        profile_image: previewUrl,
        avatar_selection: '' // Clear avatar selection
      }));
      // Close the popup after successful image selection for better UX
      setShowImageOptions(false);
    }
  };

  const handleAvatarSelection = (avatarPath: string) => {
    console.log('Avatar selected:', avatarPath);
    setProfileData(prev => ({ 
      ...prev, 
      avatar_selection: avatarPath,
      profile_image: avatarPath // Also set profile_image for consistency
    }));
    // Clear any uploaded image since avatar was selected
    setSelectedImage(null);
    setImagePreview('');
    // Close the popup after selection for better UX
    setShowImageOptions(false);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error('Failed to upload image');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // ----- Memoized event handlers for better performance -----
  const handleImageOptionsToggle = useCallback(() => {
    setShowImageOptions(prev => !prev);
  }, []);

  const handleImageOptionsClose = useCallback(() => {
    setShowImageOptions(false);
  }, []);

  const handleLanguageDropdownToggle = useCallback(() => {
    setShowLanguageDropdown(prev => !prev);
  }, []);

  const handleContactChangeModalOpen = useCallback(() => {
    setShowContactChangeModal(true);
  }, []);

  const handleContactChangeModalClose = useCallback(() => {
    setShowContactChangeModal(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started:', profileData);
    setIsLoading(true);
    setError('');
    setShowValidationErrors(true); // Show validation errors on submit

    try {
      if (!user) throw new Error('User not found');

      let profileImageUrl = profileData.profile_image;
      
      // Upload new image if selected
      if (selectedImage) {
        profileImageUrl = await uploadImage(selectedImage);
      }

             // Ensure phone field is updated with combined country code and number
       const fullPhone = profileData.country_code + profileData.phone_number;
       
       // Check if profile exists, if not create it, otherwise update it
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      // Prepare common profile data for both users and profiles tables
      // Only update editable fields (not astro fields)
      const profileUpdateData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: fullPhone,
        gender: profileData.gender,
        preferred_language: profileData.preferred_language,
        date_of_birth: profileData.date_of_birth,
        location: profileData.location,
        city: profileData.city,
        country: profileData.country,
        profile_image: profileImageUrl,
        avatar_selection: profileData.avatar_selection,
        is_profile_complete: true,
        updated_at: new Date().toISOString()
        // Note: Astro fields are NOT updated here - they remain read-only
      };

      if (existingProfile) {
        // Update existing profile in users table
        const { error: updateError } = await (supabase as any)
          .from('users')
          .update(profileUpdateData)
          .eq('id', user.id);

        if (updateError) throw updateError;
      } else {
        // Create new profile in users table
        const { error: insertError } = await (supabase as any)
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            email_verified: user.email_confirmed_at ? true : false,
            ...profileUpdateData,
            auth_provider: 'email', // Default for email auth
            login_method: 'email',
            created_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // Sync to profiles table - ensure data is available for chat
      // Use city and country from profileData (already separated)
      const city = profileData.city || '';
      const country = profileData.country || '';

      // Prepare profiles table data (matching field names)
      const profilesTableData: any = {
        id: user.id, // profiles.id references auth.users(id)
        email: user.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: fullPhone,
        gender: profileData.gender,
        dob: profileData.date_of_birth,
        country: country,
        city: city,
        preferred_language: profileData.preferred_language,
        updated_at: new Date().toISOString()
        // Note: Astro fields are NOT synced here - they remain read-only
      };

      // Upsert into profiles table (create or update)
      const { error: profilesError } = await (supabase as any)
        .from('profiles')
        .upsert(profilesTableData, { onConflict: 'id' });

      if (profilesError) {
        console.warn('⚠️ Failed to sync profile to profiles table:', profilesError);
        // Don't throw - users table update succeeded, profiles sync is secondary
      } else {
        console.log('✅ Successfully synced profile to profiles table');
      }

      // Handle guest story completion if applicable
      const guestStoryId = sessionStorage.getItem('guest_story_id');
      const guestStoryApproved = sessionStorage.getItem('guest_story_approved');
      
      if (guestStoryId && guestStoryApproved === 'true' && user) {
        try {
          const response = await fetch('/api/guest-stories/complete-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              guestStoryId: guestStoryId
            }),
          });

          if (response.ok) {
            console.log('✅ Guest story completion processed');
            // Clear session storage
            sessionStorage.removeItem('guest_story_id');
            sessionStorage.removeItem('guest_story_approved');
          } else {
            console.error('Failed to complete guest story flow');
          }
        } catch (err) {
          console.error('Error completing guest story flow:', err);
          // Don't fail profile save if guest story completion fails
        }
      }

      // Profile updated successfully
      setSuccess('Profile updated successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkipProfile = async () => {
    try {
      if (!user) throw new Error('User not found');

      // Check if profile exists and get current verification status
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id, phone_verified, is_profile_complete')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Create minimal profile with just required fields
        const { error: insertError } = await (supabase as any)
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            email_verified: user.email_confirmed_at ? true : false,
            is_profile_complete: false, // Mark as incomplete since user skipped
            auth_provider: 'email', // Default for email auth
            login_method: 'email',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // Mark profile as completed (skipped) and redirect to advanced dashboard
      sessionStorage.setItem('profile_completed', 'true');
      console.log('Profile skipped, redirecting to advanced dashboard');
      router.push('/user/main');
    } catch (err: any) {
      console.error('Error skipping profile:', err);
      setError('Failed to skip profile. Please try again.');
    }
  };

  const isFormValid = () => {
    const isValid = !!(
      profileData.first_name.trim() &&
      profileData.last_name.trim() &&
      profileData.gender &&
      profileData.preferred_language
      // Removed date_of_birth requirement - it's optional
      // Removed profile_image and avatar_selection requirement - they are optional
    );
    
    console.log('Form validation:', {
      first_name: profileData.first_name.trim(),
      last_name: profileData.last_name.trim(),
      gender: profileData.gender,
      preferred_language: profileData.preferred_language,
      date_of_birth: profileData.date_of_birth,
      profile_image: profileData.profile_image,
      avatar_selection: profileData.avatar_selection,
      isValid
    });
    
    return isValid;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
                     {/* Header */}
           <div className="text-center mb-8" style={{ marginTop: '76px' }}>
             <div className="mb-4">
               <Image
                 src="/assets/logo/Logo.png"
                 alt="DrishiQ Logo"
                 width={180}
                 height={80}
                 className="h-16 w-auto mx-auto"
                 style={{ width: 'auto', height: '4rem' }}
                 priority
               />
             </div>
             <p className="text-[#0B4422] font-medium mb-0 text-center" style={{ marginTop: '-36px', fontSize: '19px' }}>
               See Through the Challenge
             </p>
             
                           {/* Profile Icon Placeholder */}
              <div className="mt-2 mb-0">
                <div className="relative inline-block profile-image-section">
                  {/* Profile Image Display - Clickable */}
                  <button
                    onClick={handleImageOptionsToggle}
                    className="focus:outline-none focus:ring-2 focus:ring-[#0B4422] focus:ring-offset-2 rounded-full transition-all hover:scale-105 relative group"
                    title="Click on profile icon to change image"
                  >
                    {/* Camera icon overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all">
                      <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    {profileData.profile_image || profileData.avatar_selection ? (
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#0B4422] mx-auto">
                        <Image
                          src={profileData.profile_image || profileData.avatar_selection}
                          alt="Profile"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-[#0B4422] mx-auto flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </button>
                  
                  {/* Profile Image Options - Hidden by default, shown on click */}
                  {showImageOptions && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 w-80 bg-white border-2 border-[#0B4422] rounded-lg shadow-lg p-4 z-10">
                      {/* Close button */}
                      <button
                        onClick={handleImageOptionsClose}
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      
                      <div className="space-y-3">
                        {/* Image Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload your own image
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#0B4422] file:text-white hover:file:bg-[#083318]"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG, GIF (max 5MB)
                          </p>
                        </div>
                        
                        {/* Image Preview */}
                        {imagePreview && (
                          <div className="flex items-center justify-center space-x-2">
                            <Image
                              src={imagePreview}
                              alt="Profile preview"
                              width={60}
                              height={60}
                              className="rounded-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedImage(null);
                                setImagePreview('');
                              }}
                              className="text-xs text-red-600 hover:text-red-800 underline"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        
                        {/* Divider */}
                        <div className="border-t border-gray-200 pt-3">
                          <p className="text-sm text-gray-600 mb-2 text-center">OR</p>
                        </div>
                        
                        {/* Avatar Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Choose from our avatars
                          </label>
                          <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                            {AVATAR_OPTIONS.map((avatar, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleAvatarSelection(avatar)}
                                className={`w-16 h-16 rounded-lg border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#0B4422] ${
                                  profileData.avatar_selection === avatar 
                                    ? 'border-[#0B4422] ring-2 ring-[#0B4422]' 
                                    : 'border-gray-300 hover:border-[#0B4422]'
                                }`}
                              >
                                <Image
                                  src={avatar}
                                  alt={`Avatar ${index + 1}`}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
             
             {/* User Name and Age Display */}
             {(profileData.first_name || age !== null) && (
               <div className="text-center -mt-6">
                 <div className="flex items-center justify-center space-x-1">
                   {profileData.first_name && (
                     <span className="text-lg font-semibold text-[#0B4422]">
                       {profileData.first_name}
                     </span>
                   )}
                   {profileData.first_name && age !== null && (
                     <span className="text-gray-400 mx-1">•</span>
                   )}
                   {age !== null && (
                     <span className="text-sm text-gray-600">
                       {age} years old
                     </span>
                   )}
                 </div>
               </div>
             )}
           </div>

                     {/* Profile Form */}
           <form onSubmit={handleSubmit} className="space-y-6">
                           {/* Email and Phone Number Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email Display (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email verified ✓
                  </p>
                </div>

                {/* Phone Number Display (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex space-x-2">
                    <div className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm">
                      {profileData.country_code}
                    </div>
                    <input
                      type="tel"
                      id="phone_number"
                      value={profileData.phone_number}
                      disabled
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      placeholder="Phone number"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Phone verified ✓
                  </p>
                </div>
              </div>

              {/* Change Contact Info Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleContactChangeModalOpen}
                  className="inline-flex items-center px-4 py-2 border border-[#0B4422] text-[#0B4422] rounded-lg hover:bg-[#0B4422] hover:text-white transition-all duration-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Change Contact Info
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Change email or phone number (requires re-verification)
                </p>
              </div>

             {/* First Name and Last Name Row */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* First Name */}
               <div>
                 <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                   First Name *
                 </label>
                 <input
                   type="text"
                   id="first_name"
                   value={profileData.first_name}
                   onChange={(e) => handleInputChange('first_name', e.target.value)}
                   className={`enhanced-input ${!profileData.first_name.trim() && showValidationErrors ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                   required
                   placeholder="Enter your first name"
                 />
               </div>

               {/* Last Name */}
               <div>
                 <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                   Last Name *
                 </label>
                 <input
                   type="text"
                   id="last_name"
                   value={profileData.last_name}
                   onChange={(e) => handleInputChange('last_name', e.target.value)}
                   className={`enhanced-input ${!profileData.last_name.trim() && showValidationErrors ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                   required
                   placeholder="Enter your last name"
                 />
               </div>
             </div>

                         {/* Gender and Date of Birth Row */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Gender */}
               <div>
                 <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                   Gender *
                 </label>
                 <select
                   id="gender"
                   value={profileData.gender}
                   onChange={(e) => handleInputChange('gender', e.target.value)}
                   className={`enhanced-input ${!profileData.gender && showValidationErrors ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                   required
                 >
                   <option value="">Select gender</option>
                   <option value="male">Male</option>
                   <option value="female">Female</option>
                   <option value="no_comments">No Comments</option>
                 </select>
               </div>

               {/* Date of Birth */}
               <div>
                 <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                   Date of Birth (Optional)
                 </label>
                 <input
                   type="date"
                   id="date_of_birth"
                   value={profileData.date_of_birth}
                   onChange={handleDateChange}
                   onClick={(e) => {
                     // Open calendar on click
                     const target = e.target as HTMLInputElement;
                     if (target.showPicker) {
                       target.showPicker();
                     }
                   }}
                   className="enhanced-input cursor-pointer"
                   max={new Date().toISOString().split('T')[0]}
                 />
               </div>
             </div>

                          {/* Preferred Language and Location Row */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Preferred Language */}
               <div>
                 <label htmlFor="preferred_language" className="block text-sm font-medium text-gray-700 mb-2">
                   Preferred Language *
                 </label>
                 <button
                   type="button"
                   onClick={handleLanguageDropdownToggle}
                   className={`w-full text-left px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422] focus:border-transparent transition-all duration-200 bg-gradient-to-r from-emerald-50 to-green-50 flex items-center justify-between h-12 border-emerald-200 hover:border-[#0B4422] hover:shadow-md ${
                     !profileData.preferred_language && showValidationErrors ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                   }`}
                 >
                   {profileData.preferred_language ? (
                     <span className="flex items-center space-x-2">
                       <span>{LANGUAGES.find(lang => lang.code === profileData.preferred_language)?.flag}</span>
                       <span>{LANGUAGES.find(lang => lang.code === profileData.preferred_language)?.name}</span>
                     </span>
                   ) : (
                     <span className="text-gray-500">Select language</span>
                   )}
                   <span className="text-xs">▼</span>
                 </button>
                 
                 {showLanguageDropdown && (
                   <div className="absolute top-full left-0 right-0 mt-1 w-full bg-white border-2 border-[#0B4422] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                     {LANGUAGES.map((lang) => (
                       <button
                         key={lang.code}
                         type="button"
                         onClick={() => {
                           handleInputChange('preferred_language', lang.code);
                           setShowLanguageDropdown(false);
                         }}
                         className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 last:border-b-0 text-sm hover:shadow-md hover:-translate-y-0.5 transform flex items-center space-x-2"
                       >
                         <span>{lang.flag}</span>
                         <span>{lang.name}</span>
                       </button>
                     ))}
                   </div>
                 )}
               </div>

               {/* City (Editable) */}
               <div>
                 <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                   City (Optional)
                 </label>
                 <input
                   type="text"
                   id="city"
                   value={profileData.city || ''}
                   onChange={(e) => handleInputChange('city', e.target.value)}
                   className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422] focus:border-transparent transition-all duration-200 bg-gradient-to-r from-emerald-50 to-green-50 h-12 hover:shadow-md"
                   placeholder="Enter your city"
                 />
               </div>
             </div>

             {/* Country Row */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Country (Editable) */}
               <div>
                 <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                   Country (Optional)
                 </label>
                 <input
                   type="text"
                   id="country"
                   value={profileData.country || ''}
                   onChange={(e) => handleInputChange('country', e.target.value)}
                   className="w-full px-4 py-3 border-2 border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422] focus:border-transparent transition-all duration-200 bg-gradient-to-r from-emerald-50 to-green-50 h-12 hover:shadow-md"
                   placeholder="Enter your country"
                 />
               </div>
             </div>

             {/* Astrological Details Section (Read-Only) */}
             {(profileData.time_of_birth || profileData.place_of_birth_city || profileData.place_of_birth_country) && (
               <div className="mt-6 pt-6 border-t border-gray-200">
                 <h3 className="text-lg font-semibold text-gray-700 mb-4">Astrological Details (Read-Only)</h3>
                 <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                   {profileData.time_of_birth && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-600 mb-1">Time of Birth</label>
                         <input
                           type="text"
                           value={typeof profileData.time_of_birth === 'string' ? profileData.time_of_birth : String(profileData.time_of_birth)}
                           disabled
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                         />
                       </div>
                     </div>
                   )}
                   {(profileData.place_of_birth_city || profileData.place_of_birth_state || profileData.place_of_birth_country) && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {profileData.place_of_birth_city && (
                         <div>
                           <label className="block text-sm font-medium text-gray-600 mb-1">Place of Birth - City</label>
                           <input
                             type="text"
                             value={profileData.place_of_birth_city}
                             disabled
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                           />
                         </div>
                       )}
                       {profileData.place_of_birth_state && (
                         <div>
                           <label className="block text-sm font-medium text-gray-600 mb-1">Place of Birth - State</label>
                           <input
                             type="text"
                             value={profileData.place_of_birth_state}
                             disabled
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                           />
                         </div>
                       )}
                       {profileData.place_of_birth_country && (
                         <div>
                           <label className="block text-sm font-medium text-gray-600 mb-1">Place of Birth - Country</label>
                           <input
                             type="text"
                             value={profileData.place_of_birth_country}
                             disabled
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                           />
                         </div>
                       )}
                     </div>
                   )}
                   {(profileData.place_of_birth_latitude || profileData.place_of_birth_longitude || profileData.place_of_birth_timezone) && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {profileData.place_of_birth_latitude !== undefined && (
                         <div>
                           <label className="block text-sm font-medium text-gray-600 mb-1">Latitude</label>
                           <input
                             type="text"
                             value={profileData.place_of_birth_latitude}
                             disabled
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                           />
                         </div>
                       )}
                       {profileData.place_of_birth_longitude !== undefined && (
                         <div>
                           <label className="block text-sm font-medium text-gray-600 mb-1">Longitude</label>
                           <input
                             type="text"
                             value={profileData.place_of_birth_longitude}
                             disabled
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                           />
                         </div>
                       )}
                       {profileData.place_of_birth_timezone && (
                         <div>
                           <label className="block text-sm font-medium text-gray-600 mb-1">Timezone</label>
                           <input
                             type="text"
                             value={profileData.place_of_birth_timezone}
                             disabled
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                           />
                         </div>
                       )}
                     </div>
                   )}
                   <p className="text-xs text-gray-500 mt-2">
                     These astrological details are read-only and cannot be modified here.
                   </p>
                 </div>
               </div>
             )}

                                                   {/* Profile Image Requirement Note */}
              {/* <div className="bg-blue-50 text-blue-600 p-4 rounded-lg text-sm">
                <strong>Note:</strong> Profile image is required. Please upload an image or select an avatar from the options above.
              </div> */}

                         {/* Success Display */}
             {success && (
               <div className="bg-green-50 text-green-600 p-4 rounded-lg text-sm">
                 {success}
               </div>
             )}



             {/* Error Display */}
             {error && (
               <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                 {error}
               </div>
             )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className="enhanced-btn disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => console.log('Button clicked, form valid:', isFormValid())}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          {/* Profile Image Requirement Note - Moved below Skip link */}
          {showValidationErrors && (
            <div className="mt-6 bg-blue-50 text-blue-600 p-4 rounded-lg text-sm">
              <strong>Note:</strong> Profile image is required. Please upload an image or select an avatar from the options above.
            </div>
          )}



          {/* Contact Change Modal */}
          {showContactChangeModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-[#0B4422]">
                    Change Contact Information
                  </h3>
                  <button
                    onClick={handleContactChangeModalClose}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="Enter new email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Phone Number
                    </label>
                    <div className="flex space-x-2">
                      <select className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+86">🇨🇳 +86</option>
                        <option value="+81">🇯🇵 +81</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+39">🇮🇹 +39</option>
                        <option value="+34">🇪🇸 +34</option>
                      </select>
                      <input
                        type="tel"
                        placeholder="Enter new phone number"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Changing contact information will require re-verification. 
                      You'll need to verify both email and phone number before the changes take effect.
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleContactChangeModalClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implement contact change logic with re-verification
                      alert('Contact change functionality will be implemented with re-verification flow');
                      setShowContactChangeModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-[#0B4422] text-white rounded-lg hover:bg-[#0a3a1e] transition-colors"
                  >
                    Update Contact Info
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
