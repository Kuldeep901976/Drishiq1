'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ProfileSettingsData {
  // Read-only account fields (from users table)
  first_name?: string;
  last_name?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  // Location (no geocoding - just text field)
  location?: string; // Single field for location (city, state, country)
  // Astro details
  time_of_birth?: string;
  place_of_birth?: string; // Single field for place of birth
  place_of_birth_latitude?: number;
  place_of_birth_longitude?: number;
  place_of_birth_timezone?: string;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [geocodingPlaceOfBirth, setGeocodingPlaceOfBirth] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [managing, setManaging] = useState(false);
  
  const [formData, setFormData] = useState<ProfileSettingsData>({
    first_name: undefined,
    last_name: undefined,
    email: undefined,
    date_of_birth: undefined,
    gender: undefined,
    location: undefined,
    time_of_birth: undefined,
    place_of_birth: undefined,
    place_of_birth_latitude: undefined,
    place_of_birth_longitude: undefined,
    place_of_birth_timezone: undefined,
  });

  // Geocode place of birth
  const geocodePlaceOfBirth = async (place: string) => {
    if (!place || place.trim() === '') {
      return null;
    }

    try {
      setGeocodingPlaceOfBirth(true);

      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place: place.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to geocode place of birth');
      }

      const result = await response.json();
      
      if (result.latitude && result.longitude && result.timezone) {
        return {
          latitude: result.latitude,
          longitude: result.longitude,
          timezone: result.timezone,
          formatted: result.formatted || place
        };
      }
      
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    } finally {
      setGeocodingPlaceOfBirth(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
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

        // Fetch profile data - try to get all possible fields
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          // If profile doesn't exist, that's okay - user can create it
          if (profileError.code !== 'PGRST116') {
            throw profileError;
          }
        }

        if (profile) {
          // Check if user is active
          setIsActive(profile.is_active !== false);
          
          // Build location string from city and country if available
          let locationStr = '';
          if (profile.city || profile.country) {
            const parts = [];
            if (profile.city) parts.push(profile.city);
            if (profile.country) parts.push(profile.country);
            locationStr = parts.join(', ');
          } else if (profile.location) {
            locationStr = profile.location;
          }

          // Build place of birth string
          let placeOfBirthStr = '';
          if (profile.place_of_birth_city || profile.place_of_birth_state || profile.place_of_birth_country) {
            const parts = [];
            if (profile.place_of_birth_city) parts.push(profile.place_of_birth_city);
            if (profile.place_of_birth_state) parts.push(profile.place_of_birth_state);
            if (profile.place_of_birth_country) parts.push(profile.place_of_birth_country);
            placeOfBirthStr = parts.join(', ');
          } else if (profile.place_of_birth) {
            placeOfBirthStr = profile.place_of_birth;
          }

          setFormData({
            // Read-only account fields (auto-populated, cannot be changed)
            first_name: profile.first_name || undefined,
            last_name: profile.last_name || undefined,
            email: profile.email || currentUser.email || undefined,
            date_of_birth: profile.date_of_birth || undefined,
            gender: profile.gender || undefined,
            // Editable fields
            location: locationStr || undefined,
            time_of_birth: profile.time_of_birth || undefined,
            place_of_birth: placeOfBirthStr || undefined,
            place_of_birth_latitude: profile.place_of_birth_latitude || undefined,
            place_of_birth_longitude: profile.place_of_birth_longitude || undefined,
            place_of_birth_timezone: profile.place_of_birth_timezone || undefined,
          });
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleDeactivate = async () => {
    if (!user) return;
    
    setManaging(true);
    setError('');
    
    try {
      const response = await fetch('/api/user/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deactivate',
          userId: user.id,
          reason: deactivationReason
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deactivate account');
      }

      setSuccess('Account deactivated successfully. You will be signed out.');
      setShowDeactivateModal(false);
      setIsActive(false);
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate account');
    } finally {
      setManaging(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    setManaging(true);
    setError('');
    
    try {
      const response = await fetch('/api/user/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          userId: user.id,
          reason: deletionReason
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      setSuccess('Account deleted successfully. You will be signed out.');
      setShowDeleteModal(false);
      setIsActive(false);
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setManaging(false);
    }
  };

  const handleReactivate = async () => {
    if (!user) return;
    
    setManaging(true);
    setError('');
    
    try {
      const response = await fetch('/api/user/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          userId: user.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate account');
      }

      setSuccess('Account reactivated successfully!');
      setIsActive(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate account');
    } finally {
      setManaging(false);
    }
  };

  const placeOfBirthTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      location: value
    }));
  };

  const handlePlaceOfBirthChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      place_of_birth: value
    }));

    // Clear existing timeout
    if (placeOfBirthTimeoutRef.current) {
      clearTimeout(placeOfBirthTimeoutRef.current);
    }

    // Auto-geocode when user stops typing
    if (value && value.trim().length > 3) {
      placeOfBirthTimeoutRef.current = setTimeout(async () => {
        const geocodeResult = await geocodePlaceOfBirth(value);
        if (geocodeResult) {
          setFormData(prev => ({
            ...prev,
            place_of_birth_latitude: geocodeResult.latitude,
            place_of_birth_longitude: geocodeResult.longitude,
            place_of_birth_timezone: geocodeResult.timezone,
            place_of_birth: geocodeResult.formatted // Update with formatted address
          }));
        }
      }, 1000); // Wait 1 second after user stops typing
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (placeOfBirthTimeoutRef.current) clearTimeout(placeOfBirthTimeoutRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!user) {
        throw new Error('User not found');
      }

      // Geocode place of birth if not already geocoded
      if (formData.place_of_birth && (!formData.place_of_birth_latitude || !formData.place_of_birth_longitude)) {
        const geocodeResult = await geocodePlaceOfBirth(formData.place_of_birth);
        if (geocodeResult) {
          formData.place_of_birth_latitude = geocodeResult.latitude;
          formData.place_of_birth_longitude = geocodeResult.longitude;
          formData.place_of_birth_timezone = geocodeResult.timezone;
        }
      }

      // Parse location string to extract city and country for backward compatibility
      let city = null;
      let country = null;
      if (formData.location) {
        const parts = formData.location.split(',').map(p => p.trim());
        if (parts.length > 0) city = parts[0];
        if (parts.length > 1) country = parts[parts.length - 1];
      }

      // Parse place of birth string
      let place_of_birth_city = null;
      let place_of_birth_state = null;
      let place_of_birth_country = null;
      if (formData.place_of_birth) {
        const parts = formData.place_of_birth.split(',').map(p => p.trim());
        if (parts.length > 0) place_of_birth_city = parts[0];
        if (parts.length > 1) place_of_birth_state = parts[1];
        if (parts.length > 2) place_of_birth_country = parts[parts.length - 1];
      }

      // Update only the editable fields
      const updateData: any = {
        // Location fields (for backward compatibility)
        city: city,
        country: country,
        // Location field (text only, no geocoding)
        location: formData.location?.trim() || null,
        // Astro details
        time_of_birth: formData.time_of_birth || null,
        // Place of birth fields (for backward compatibility)
        place_of_birth: formData.place_of_birth?.trim() || null,
        place_of_birth_city: place_of_birth_city,
        place_of_birth_state: place_of_birth_state,
        place_of_birth_country: place_of_birth_country,
        // Place of birth fields with geocoding
        place_of_birth_latitude: formData.place_of_birth_latitude || null,
        place_of_birth_longitude: formData.place_of_birth_longitude || null,
        place_of_birth_timezone: formData.place_of_birth_timezone || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess('Profile settings updated successfully!');
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Error updating profile settings:', err);
      setError(err.message || 'Failed to update profile settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422]"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl border border-white/20 p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
              <p className="text-gray-600">Edit your location and astrological details</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <p className="text-green-700 font-medium">{success}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Account Information (Read Only) */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-r from-gray-50/50 to-slate-50/50 border-2 border-gray-200 rounded-2xl p-6 sticky top-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-2xl">👤</span>
                      Account Overview
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Your account details. These fields cannot be changed for security reasons.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                          First Name
                        </label>
                        <div className="px-3 py-2 text-base border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                          {formData.first_name || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                          Last Name
                        </label>
                        <div className="px-3 py-2 text-base border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                          {formData.last_name || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                          Email
                        </label>
                        <div className="px-3 py-2 text-base border border-gray-200 rounded-lg bg-gray-50 text-gray-700 break-words">
                          {formData.email || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                          Date of Birth
                        </label>
                        <div className="px-3 py-2 text-base border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                          {formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString() : '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                          Gender
                        </label>
                        <div className="px-3 py-2 text-base border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                          {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Editable Fields */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Location Section */}
                  <div className="bg-gradient-to-r from-emerald-50/50 to-blue-50/50 border-2 border-emerald-100 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="text-3xl">📍</span>
                  Current Location
                </h3>
                <p className="text-gray-600 mb-6">
                  Enter your current location (city, state, country).
                </p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="e.g., Mumbai, Maharashtra, India"
                    />
                  </div>
                </div>
              </div>

              {/* Astrological Details Section */}
              <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-2 border-purple-100 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="text-3xl">⭐</span>
                  Astrological Details
                </h3>
                <p className="text-gray-600 mb-6">
                  Update your birth details for accurate astrological calculations. Place of birth can be different from your current location.
                </p>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Time of Birth
                      </label>
                      <input
                        type="time"
                        value={formData.time_of_birth || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, time_of_birth: e.target.value }))}
                        className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Place of Birth
                      </label>
                      <input
                        type="text"
                        value={formData.place_of_birth || ''}
                        onChange={(e) => handlePlaceOfBirthChange(e.target.value)}
                        className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        placeholder="e.g., Delhi, Delhi, India"
                      />
                      {geocodingPlaceOfBirth && (
                        <p className="mt-2 text-sm text-gray-500">📍 Geocoding place of birth...</p>
                      )}
                      {formData.place_of_birth_latitude && formData.place_of_birth_longitude && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p>📍 Coordinates: {formData.place_of_birth_latitude.toFixed(6)}, {formData.place_of_birth_longitude.toFixed(6)}</p>
                          <p>🕐 Timezone: {formData.place_of_birth_timezone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

                  {/* Account Management Section */}
                  <div className="bg-gradient-to-r from-red-50/50 to-orange-50/50 border-2 border-red-200 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                      <span className="text-3xl">⚠️</span>
                      Account Management
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Manage your account status. Deactivated or deleted accounts can be viewed but data access is restricted.
                    </p>
                    
                    {isActive === false && (
                      <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                        <p className="text-yellow-800 font-medium">
                          ⚠️ Your account is currently deactivated. You can view your profile but cannot access your data. Contact support to reactivate.
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {isActive !== false ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowDeactivateModal(true)}
                            className="w-full px-6 py-3 border-2 border-orange-300 bg-orange-50 text-orange-700 rounded-xl font-semibold hover:bg-orange-100 transition-all"
                          >
                            Deactivate Account
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            className="w-full px-6 py-3 border-2 border-red-300 bg-red-50 text-red-700 rounded-xl font-semibold hover:bg-red-100 transition-all"
                          >
                            Delete Account
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleReactivate}
                          disabled={managing}
                          className="w-full px-6 py-3 border-2 border-green-300 bg-green-50 text-green-700 rounded-xl font-semibold hover:bg-green-100 transition-all disabled:opacity-50"
                        >
                          {managing ? 'Reactivating...' : 'Reactivate Account'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-8 py-4 border-2 border-gray-300 bg-white text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all shadow-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className={`px-8 py-4 rounded-2xl font-bold text-white transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 ${
                        saving
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700'
                      }`}
                    >
                      {saving ? (
                        <>
                          <span className="inline-block animate-spin mr-2">⏳</span>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Deactivate Account</h3>
            <p className="text-gray-600 mb-4">
              Your account will be deactivated. You can view your profile but won't be able to access your data until reactivated.
            </p>
            <textarea
              value={deactivationReason}
              onChange={(e) => setDeactivationReason(e.target.value)}
              placeholder="Reason for deactivation (optional)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl mb-4 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500"
              rows={3}
            />
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivationReason('');
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={managing}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-50"
              >
                {managing ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-red-600 mb-4">Delete Account</h3>
            <p className="text-gray-600 mb-4">
              <strong className="text-red-600">Warning:</strong> This will permanently delete your account. Your data will be marked as deleted and access will be restricted. This action cannot be easily undone.
            </p>
            <textarea
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              placeholder="Reason for deletion (optional)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl mb-4 focus:ring-4 focus:ring-red-500/20 focus:border-red-500"
              rows={3}
            />
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletionReason('');
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={managing}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {managing ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

