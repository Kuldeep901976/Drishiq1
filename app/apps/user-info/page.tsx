'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomDatePicker from '@/app/profile/components/CustomDatePicker';

// Calculate age from DOB
const calculateAge = (dateOfBirth: string): number | null => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Calculate Sun Sign
const calculateSunSign = (month: number, date: number): string => {
  const signs = [
    { name: 'Capricorn', start: [12, 22], end: [1, 19] },
    { name: 'Aquarius', start: [1, 20], end: [2, 18] },
    { name: 'Pisces', start: [2, 19], end: [3, 20] },
    { name: 'Aries', start: [3, 21], end: [4, 19] },
    { name: 'Taurus', start: [4, 20], end: [5, 20] },
    { name: 'Gemini', start: [5, 21], end: [6, 20] },
    { name: 'Cancer', start: [6, 21], end: [7, 22] },
    { name: 'Leo', start: [7, 23], end: [8, 22] },
    { name: 'Virgo', start: [8, 23], end: [9, 22] },
    { name: 'Libra', start: [9, 23], end: [10, 22] },
    { name: 'Scorpio', start: [10, 23], end: [11, 21] },
    { name: 'Sagittarius', start: [11, 22], end: [12, 21] }
  ];
  
  for (const sign of signs) {
    const [startMonth, startDay] = sign.start;
    const [endMonth, endDay] = sign.end;
    
    if (startMonth === endMonth) {
      if (month === startMonth && date >= startDay && date <= endDay) return sign.name;
    } else if (startMonth < endMonth) {
      if ((month === startMonth && date >= startDay) || (month === endMonth && date <= endDay)) return sign.name;
    } else {
      if ((month === startMonth && date >= startDay) || (month === endMonth && date <= endDay)) return sign.name;
    }
  }
  return 'Unknown';
};

// Calculate Moon Sign
const calculateMoonSign = (month: number, date: number, year: number, hour: number = 12): string => {
  const moonSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const totalDays = new Date(year, month - 1, date).getTime() / (1000 * 60 * 60 * 24);
  const moonSignIndex = Math.floor((totalDays + hour / 24) % 12);
  return moonSigns[moonSignIndex];
};

export default function UserInfoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    language: 'en',
    gender: '',
    city: '',
    country: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
  });

  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [predictions, setPredictions] = useState<{ sunSign?: string; moonSign?: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skipAstro, setSkipAstro] = useState(false);

  // Load existing data if available
  useEffect(() => {
    const existingData = sessionStorage.getItem('userInfo');
    const skipAstroFlag = sessionStorage.getItem('skipAstro');
    
    if (skipAstroFlag === 'true') {
      setSkipAstro(true);
    }
    
    if (existingData && existingData.trim()) {
      try {
        const userData = JSON.parse(existingData);
        setFormData(prev => ({
          ...prev,
          firstName: userData.firstName || '',
          language: userData.language || 'en',
          gender: userData.gender || '',
          city: userData.city || '',
          country: userData.country || '',
          dateOfBirth: userData.dateOfBirth || '',
          timeOfBirth: userData.timeOfBirth || '',
          placeOfBirth: userData.placeOfBirth || '',
        }));
      } catch (e) {
        console.error('Failed to parse userInfo from sessionStorage:', e);
        // Clear invalid data
        try {
          sessionStorage.removeItem('userInfo');
        } catch (clearErr) {
          // Ignore storage errors
        }
      }
    }
  }, []);

  // Calculate age when DOB changes
  useEffect(() => {
    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  }, [formData.dateOfBirth]);

  // Calculate predictions when DOB/Time changes
  useEffect(() => {
    if (formData.dateOfBirth) {
      const [year, month, day] = formData.dateOfBirth.split('-');
      const sunSign = calculateSunSign(parseInt(month), parseInt(day));
      const hour = formData.timeOfBirth ? parseInt(formData.timeOfBirth.split(':')[0]) : 12;
      const moonSign = calculateMoonSign(parseInt(month), parseInt(day), parseInt(year), hour);
      setPredictions({ sunSign, moonSign });
    } else {
      setPredictions(null);
    }
  }, [formData.dateOfBirth, formData.timeOfBirth]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.language) newErrors.language = 'Language is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        age: calculatedAge,
        ...predictions
      };

      // Store in session storage
      sessionStorage.setItem('userInfo', JSON.stringify(submitData));
      
      // If it was a "For Myself" update, save to DB
      const mode = sessionStorage.getItem('selectedMode');
      if (mode === 'myself') {
        await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        }).catch(err => console.error('Could not save to DB:', err));
      }

      // Redirect to chat
      router.push('/apps/chat');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.firstName && formData.language && formData.gender && formData.city && formData.country && formData.dateOfBirth;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-700 to-green-600 px-6 py-6 text-white">
          <h2 className="text-2xl font-bold">Your Information</h2>
          <p className="text-green-100 text-sm mt-2">Please complete all required fields marked with *</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Language <span className="text-red-500">*</span>
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.language ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select language</option>
                <option value="en">🇺🇸 English</option>
                <option value="hi">🇮🇳 Hindi</option>
                <option value="es">🇪🇸 Spanish</option>
                <option value="fr">🇫🇷 French</option>
              </select>
              {errors.language && <p className="text-red-500 text-xs mt-1">{errors.language}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.gender ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Enter country"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.country ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <CustomDatePicker
                value={formData.dateOfBirth}
                onChange={(date: string) => handleChange({ target: { name: 'dateOfBirth', value: date } } as any)}
                maxDate={new Date().toISOString().split('T')[0]}
                minDate="1900-01-01"
                placeholder="Select date of birth"
                className={`w-full ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
              {calculatedAge && (
                <p className="text-green-600 text-xs mt-1 font-semibold">Age: {calculatedAge} years</p>
              )}
            </div>
          </div>

          {/* Optional Section - Only show if user is interested in astro */}
          {!skipAstro && (
          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-semibold text-gray-600 mb-3">⭐ Optional: Additional Birth Information (for Astrology)</p>

            <div className="grid grid-cols-2 gap-4">
              {/* Time of Birth */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Time of Birth</label>
                <input
                  type="time"
                  name="timeOfBirth"
                  value={formData.timeOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Place of Birth */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Place of Birth</label>
                <input
                  type="text"
                  name="placeOfBirth"
                  value={formData.placeOfBirth}
                  onChange={handleChange}
                  placeholder="City, State/Province"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Predictions Display */}
            {predictions && (formData.dateOfBirth || predictions.sunSign) && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200 mt-4">
                <p className="text-sm font-semibold text-gray-800 mb-2">✨ Astrological Insights</p>
                {predictions.sunSign && (
                  <p className="text-sm text-gray-700">☀️ Sun Sign: <span className="font-semibold text-amber-700">{predictions.sunSign}</span></p>
                )}
                {predictions.moonSign && (
                  <p className="text-sm text-gray-700">🌙 Moon Sign: <span className="font-semibold text-blue-700">{predictions.moonSign}</span></p>
                )}
              </div>
            )}
          </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex-1 py-3 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0B4422' }}
              onMouseEnter={(e) => !(e.target as HTMLButtonElement).disabled && ((e.target as HTMLButtonElement).style.backgroundColor = '#1a5f3a')}
              onMouseLeave={(e) => !(e.target as HTMLButtonElement).disabled && ((e.target as HTMLButtonElement).style.backgroundColor = '#0B4422')}
            >
              {isSubmitting ? 'Processing...' : 'Continue to Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}