'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Profile {
  id?: string;
  firstName: string;
  email: string;
  socialLogin?: boolean;
  country: string;
  city?: string;
  phone?: string;
  dob?: string;
  gender: string;
  avatarUrl?: string;
  astroOptIn: boolean;
  timeOfBirth?: string;
  placeOfBirth?: string;
  freezeBirthData: boolean;
  consentProvided: boolean;
}

export interface ProfileFormData {
  firstName: string;
  email: string;
  country: string;
  city: string;
  phone: string;
  phoneCountryCode: string;
  dob: string;
  gender: string;
  avatarFile?: File;
  avatarUrl?: string;
  astroOptIn: boolean;
  timeOfBirth: string;
  placeOfBirth: string;
  freezeBirthData: boolean;
  consentProvided: boolean;
  // Geographic data (calculated)
  latitude?: number;
  longitude?: number;
  timezone?: string;
  placeCountry?: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

const COUNTRIES = [
  { code: 'IN', name: 'India', phoneCode: '+91' },
  { code: 'US', name: 'United States', phoneCode: '+1' },
  { code: 'GB', name: 'United Kingdom', phoneCode: '+44' },
  { code: 'CA', name: 'Canada', phoneCode: '+1' },
  { code: 'AU', name: 'Australia', phoneCode: '+61' },
  { code: 'DE', name: 'Germany', phoneCode: '+49' },
  { code: 'FR', name: 'France', phoneCode: '+33' },
  { code: 'ES', name: 'Spain', phoneCode: '+34' },
];

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    email: '',
    country: 'US',
    city: '',
    phone: '',
    phoneCountryCode: '+1',
    dob: '',
    gender: '',
    astroOptIn: false,
    timeOfBirth: '',
    placeOfBirth: '',
    freezeBirthData: false,
    consentProvided: false,
    latitude: undefined,
    longitude: undefined,
    timezone: undefined,
    placeCountry: undefined,
  });
  
  const [originalFormData, setOriginalFormData] = useState<ProfileFormData | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [geocodingPlaceOfBirth, setGeocodingPlaceOfBirth] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate age from DOB
  const calculateAge = useCallback((dob: string): number | null => {
    if (!dob) return null;
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age > 0 && age < 120 ? age : null;
    } catch {
      return null;
    }
  }, []);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      
      if (data.success && data.profile) {
        const profile = data.profile;
        setProfile(profile);
        
        // Parse phone into country code and number
        const phoneParts = profile.phone ? parsePhone(profile.phone) : { code: '+1', number: '' };
        
        const initialData: ProfileFormData = {
          firstName: profile.firstName || '',
          email: profile.email || '',
          country: profile.country || 'US',
          city: profile.city || '',
          phone: phoneParts.number,
          phoneCountryCode: phoneParts.code,
          dob: profile.dob || '',
          gender: profile.gender || '',
          avatarUrl: profile.avatarUrl,
          astroOptIn: profile.astroOptIn || false,
          timeOfBirth: profile.timeOfBirth || '',
          placeOfBirth: profile.placeOfBirth || '',
          freezeBirthData: profile.freezeBirthData || false,
          consentProvided: profile.consentProvided || false,
          latitude: profile.latitude,
          longitude: profile.longitude,
          timezone: profile.timezone,
          placeCountry: profile.placeCountry,
        };
        
        setFormData(initialData);
        setOriginalFormData(initialData);
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse E.164 phone number
  const parsePhone = (phone: string): { code: string; number: string } => {
    const match = phone.match(/^(\+\d{1,4})(.*)/);
    if (match) {
      return { code: match[1], number: match[2] };
    }
    return { code: '+1', number: phone };
  };

  // Geocode place of birth
  const geocodePlaceOfBirth = useCallback(async (place: string) => {
    if (!place || place.length < 3) {
      setFormData(prev => ({ ...prev, latitude: undefined, longitude: undefined, timezone: undefined, placeCountry: undefined }));
      return;
    }

    setGeocodingPlaceOfBirth(true);
    try {
      const response = await fetch(`/api/geocode-place?place=${encodeURIComponent(place)}`);
      const data = await response.json();
      
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          latitude: data.data.latitude,
          longitude: data.data.longitude,
          timezone: data.data.timezone,
          placeCountry: data.data.country
        }));
      }
    } catch (error) {
      console.error('Error geocoding place of birth:', error);
    } finally {
      setGeocodingPlaceOfBirth(false);
    }
  }, []);

  // Update form field
  const updateField = useCallback((field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });

    // Auto-geocode place of birth when it changes
    if (field === 'placeOfBirth' && formData.astroOptIn) {
      geocodePlaceOfBirth(value);
    }
  }, [formData.astroOptIn, geocodePlaceOfBirth]);

  // Auto-update phone country code when country changes
  useEffect(() => {
    const country = COUNTRIES.find(c => c.code === formData.country);
    if (country) {
      setFormData(prev => ({ ...prev, phoneCountryCode: country.phoneCode }));
    }
  }, [formData.country]);

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Please enter your first name.';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address.';
    }
    
    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      if (isNaN(dobDate.getTime())) {
        newErrors.dob = 'Please provide a valid date of birth (not in the future).';
      } else if (dobDate > new Date()) {
        newErrors.dob = 'Please provide a valid date of birth (not in the future).';
      } else if (dobDate.getFullYear() < 1900) {
        newErrors.dob = 'Please provide a valid date of birth.';
      }
    }
    
    if (formData.phone) {
      if (!/^[0-9]{6,15}$/.test(formData.phone)) {
        newErrors.phone = 'Enter a valid phone number for the selected country.';
      }
    }
    
    if (formData.astroOptIn && !formData.consentProvided) {
      newErrors.consentProvided = 'You must provide consent to save birth details for astrology guidance.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Save profile
  const saveProfile = useCallback(async (): Promise<boolean> => {
    if (!validate()) {
      return false;
    }

    setIsLoading(true);
    
    try {
      // Upload avatar if new file present
      let avatarUrl = formData.avatarUrl;
      if (formData.avatarFile) {
        const uploadResult = await uploadAvatar(formData.avatarFile);
        avatarUrl = uploadResult.url;
      }

      // Build payload
      const payload = {
        firstName: formData.firstName,
        email: formData.email,
        country: formData.country,
        city: formData.city,
        phone: formData.phone ? `${formData.phoneCountryCode}${formData.phone}` : undefined,
        dob: formData.dob,
        gender: formData.gender,
        avatarUrl,
        astroOptIn: formData.astroOptIn,
        timeOfBirth: formData.astroOptIn ? formData.timeOfBirth : undefined,
        placeOfBirth: formData.astroOptIn ? formData.placeOfBirth : undefined,
        freezeBirthData: formData.freezeBirthData,
        consentProvided: formData.consentProvided,
        // Include geographic data
        latitude: formData.latitude,
        longitude: formData.longitude,
        timezone: formData.timezone,
        placeCountry: formData.placeCountry,
      };

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setOriginalFormData(formData);
        setIsDirty(false);
        setProfile(data.profile);
        return true;
      } else {
        setErrors(data.errors || {});
        return false;
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors({ submit: 'Could not save profile — try again or contact support.' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [formData, validate]);

  // Upload avatar
  const uploadAvatar = async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch('/api/avatar-upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Avatar upload failed');
    }

    return await response.json();
  };

  // Handle avatar file
  const handleAvatarChange = useCallback((file: File | null) => {
    if (!file) {
      setAvatarPreview(null);
      setFormData(prev => ({ ...prev, avatarFile: undefined, avatarUrl: undefined }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ avatar: 'File size must be less than 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
      setFormData(prev => ({ ...prev, avatarFile: file }));
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    if (originalFormData) {
      setFormData(originalFormData);
      setIsDirty(false);
      setErrors({});
    }
  }, [originalFormData]);

  // Unlock birth data
  const unlockBirthData = async (confirmation: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/profile/unlock-birth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });

      const data = await response.json();
      
      if (data.success) {
        setFormData(prev => ({ ...prev, freezeBirthData: false }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unlocking birth data:', error);
      return false;
    }
  };

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return {
    profile,
    formData,
    errors,
    isLoading,
    isDirty,
    avatarPreview,
    fileInputRef,
    geocodingPlaceOfBirth,
    calculateAge,
    updateField,
    saveProfile,
    resetForm,
    handleAvatarChange,
    unlockBirthData,
  };
};

