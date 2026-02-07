'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/drishiq-i18n';
import { PartyPopper } from 'lucide-react';

interface TestimonialFormData {
  title: string;
  content: string;
  rating: number;
  category: string;
  custom_category: string;
  is_anonymous: boolean;
  user_name: string;
  user_role: string;
  user_location: string;
  user_image: string;
  use_avatar: boolean;
  selected_avatar: string;
}

// Categories will be translated in the component
const categoryKeys = [
  'career_development',
  'life_coaching',
  'business_consulting',
  'educational_consulting',
  'content_marketing',
  'change_management',
  'management_consulting',
  'marketing_consulting',
  'customer_service',
  'customer_support',
  'life_path_choices',
  'confidence_presence',
  'growth_capability',
  'relationship_social',
  'clarity_mental_resilience',
  'others'
];

const categoryValues = [
  'Career Development',
  'Life Coaching',
  'Business Consulting',
  'Educational Consulting',
  'Content Marketing',
  'Change Management',
  'Management Consulting',
  'Marketing Consulting',
  'Customer Service',
  'Customer Support',
  'Life Path & Choices',
  'Confidence & Presence',
  'Growth & Capability Building',
  'Relationship & Social Balance',
  'Clarity & Mental Resilience',
  'Others'
];

// Available avatar options from the avatar folder
const avatarOptions = [
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

const TestimonialSubmissionForm: React.FC = () => {
  const router = useRouter();
  const avatarDropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage(['testimonials_main']);
  
  // Check if user is authenticated
  const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('user_id');
  
  // Get user_id and user details from localStorage if available
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') : null;
  const userName = typeof window !== 'undefined' ? localStorage.getItem('user_name') : null;
  
  const [formData, setFormData] = useState<TestimonialFormData>({
    title: '',
    content: '',
    rating: 5,
    category: '',
    custom_category: '',
    is_anonymous: !isAuthenticated, // Default to anonymous if not logged in
    user_name: userName || '', // Use actual user name if logged in
    user_role: '',
    user_location: '',
    user_image: '',
    use_avatar: false,
    selected_avatar: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(event.target as Node)) {
        setFormData(prev => ({ ...prev, use_avatar: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update anonymous state based on authentication
  useEffect(() => {
    const user_id = localStorage.getItem('user_id');
    // Don't force anonymous - let users choose
    // if (!user_id) {
    //   setFormData(prev => ({ ...prev, is_anonymous: true }));
    // }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData(prev => ({ 
          ...prev, 
          user_image: result,
          use_avatar: false,
          selected_avatar: ''
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSelection = (avatarPath: string) => {
    setFormData(prev => ({ 
      ...prev, 
      selected_avatar: avatarPath,
      use_avatar: true,
      user_image: ''
    }));
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Get user_id from localStorage or use null for anonymous submissions
      const user_id = localStorage.getItem('user_id') || null;
      
      // If user is not authenticated and not submitting anonymously, show error
      if (!user_id && !formData.is_anonymous) {
        setError(t('testimonials_main.form.validation.login_required'));
        setIsSubmitting(false);
        return;
      }

      // Determine the final category
      const finalCategory = formData.category === 'Others' ? formData.custom_category : formData.category;

      const response = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          category: finalCategory,
          user_id,
          // Include image data
          user_image: formData.user_image || formData.selected_avatar || null,
          use_avatar: formData.use_avatar,
          selected_avatar: formData.selected_avatar
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('testimonials_main.form.error.message'));
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/testimonials/submit/success');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : t('testimonials_main.form.error.message'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <PartyPopper size={48} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">{t('testimonials_main.form.success.title')}</h2>
          <p className="text-green-700">
            {t('testimonials_main.form.success.message')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 pb-12">

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title - Now Optional */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            {t('testimonials_main.form.fields.title.label')}
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder={t('testimonials_main.form.fields.title.placeholder')}
          />
          <p className="text-sm text-gray-500 mt-1">
            {t('testimonials_main.form.fields.title.help')}
          </p>
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            {t('testimonials_main.form.fields.content.label')} *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            required
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder={t('testimonials_main.form.fields.content.placeholder')}
          />
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('testimonials_main.form.fields.rating.label')} *
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingChange(star)}
                className={`text-2xl ${
                  star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-400 transition-colors`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {t(`testimonials_main.ratings.${formData.rating}`)}
          </p>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            {t('testimonials_main.form.fields.category.label')}
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">{t('testimonials_main.form.fields.category.placeholder')}</option>
            {categoryKeys.map((key, index) => (
              <option key={key} value={categoryValues[index]}>
                {t(`testimonials_main.form.fields.category.options.${key}`) || categoryValues[index]}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Category Input - Shows when "Others" is selected */}
        {formData.category === 'Others' && (
          <div>
            <label htmlFor="custom_category" className="block text-sm font-medium text-gray-700 mb-2">
              {t('testimonials_main.form.fields.custom_category.label')} *
            </label>
            <input
              type="text"
              id="custom_category"
              name="custom_category"
              value={formData.custom_category}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder={t('testimonials_main.form.fields.custom_category.placeholder')}
            />
            <p className="text-sm text-gray-500 mt-1">
              {t('testimonials_main.form.fields.custom_category.help')}
            </p>
          </div>
        )}

        {/* User Information Display */}
        {isAuthenticated && !formData.is_anonymous && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">{t('testimonials_main.form.fields.user_info.title')}</h3>
            <div className="text-sm text-blue-700">
              <p><strong>{t('testimonials_main.form.fields.user_info.name_label')}</strong> {userName || t('testimonials_main.form.fields.user_info.name_default')}</p>
              <p><strong>{t('testimonials_main.form.fields.user_info.email_label')}</strong> {userEmail || t('testimonials_main.form.fields.user_info.email_default')}</p>
            </div>
          </div>
        )}

        {/* Anonymous Option */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="is_anonymous"
            name="is_anonymous"
            checked={formData.is_anonymous}
            onChange={handleInputChange}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
          />
          <label htmlFor="is_anonymous" className="text-sm font-medium text-gray-700">
            {t('testimonials_main.form.fields.anonymous.label')}
          </label>
        </div>

        {/* Anonymous User Details */}
        {formData.is_anonymous && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="user_name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('testimonials_main.form.fields.display_name.label')}
              </label>
              <input
                type="text"
                id="user_name"
                name="user_name"
                value={formData.user_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('testimonials_main.form.fields.display_name.placeholder')}
              />
            </div>
            <div>
              <label htmlFor="user_role" className="block text-sm font-medium text-gray-700 mb-1">
                {t('testimonials_main.form.fields.role.label')}
              </label>
              <input
                type="text"
                id="user_role"
                name="user_role"
                value={formData.user_role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('testimonials_main.form.fields.role.placeholder')}
              />
            </div>
            <div>
              <label htmlFor="user_location" className="block text-sm font-medium text-gray-700 mb-1">
                {t('testimonials_main.form.fields.location.label')}
              </label>
              <input
                type="text"
                id="user_location"
                name="user_location"
                value={formData.user_location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('testimonials_main.form.fields.location.placeholder')}
              />
            </div>
          </div>
        )}

        {/* Profile Image Section */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('testimonials_main.form.fields.profile_image.label')}
          </label>
          
          {/* Image Upload Option */}
          <div className="mb-4">
            <label htmlFor="user_image" className="block text-sm text-gray-600 mb-2">
              {t('testimonials_main.form.fields.upload_image.label')}
            </label>
            <input
              type="file"
              id="user_image"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {formData.user_image && (
              <div className="mt-2">
                <img 
                  src={formData.user_image} 
                  alt="Preview" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, user_image: '', use_avatar: false, selected_avatar: '' }))}
                  className="ml-2 text-sm text-red-600 hover:text-red-800"
                >
                  {t('testimonials_main.form.fields.remove_button')}
                </button>
              </div>
            )}
          </div>

          {/* Avatar Selection Option */}
          <div ref={avatarDropdownRef}>
            <label htmlFor="selected_avatar" className="block text-sm text-gray-600 mb-2">
              {t('testimonials_main.form.fields.choose_avatar.label')}
            </label>
            
            {/* Custom Avatar Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, use_avatar: !prev.use_avatar }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-left flex items-center justify-between"
              >
                {formData.selected_avatar ? (
                  <div className="flex items-center space-x-3">
                    <img 
                      src={formData.selected_avatar} 
                      alt="Selected Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNEMzJGMzIiLz4KPHBhdGggZD0iTTE2IDE0QzE3LjY1NjkgMTQgMTkgMTIuNjU2OSAxOSAxMUMxOSA5LjM0MzE1IDE3LjY1NjkgOCAxNiA4QzE0LjM0MzEgOCAxMyA5LjM0MzE1IDEzIDExQzEzIDEyLjY1NjkgMTQuMzQzMSAxNCAxNiAxNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiAyNEMxOS4zMTM3IDI0IDIyIDIxLjMxMzcgMjIgMThIMTBMMTIgMjRIMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
                      }}
                    />
                    <span>{t('testimonials_main.form.fields.avatar_selected')} {avatarOptions.indexOf(formData.selected_avatar) + 1}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">{t('testimonials_main.form.fields.avatar_placeholder')}</span>
                )}
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {formData.use_avatar && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  <div className="p-2">
                    {avatarOptions.map((avatar, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          handleAvatarSelection(avatar);
                          setFormData(prev => ({ ...prev, use_avatar: false }));
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <img 
                          src={avatar} 
                          alt={`Avatar ${index + 1}`}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNEMzJGMzIiLz4KPHBhdGggZD0iTTE2IDE0QzE3LjY1NjkgMTQgMTkgMTIuNjU2OSAxOSAxMUMxOSA5LjM0MzE1IDE3LjY1NjkgOCAxNiA4QzE0LjM0MzEgOCAxMyA5LjM0MzE1IDEzIDExQzEzIDEyLjY1NjkgMTQuMzQzMSAxNCAxNiAxNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiAyNEMxOS4zMTM3IDI0IDIyIDIxLjMxMzcgMjIgMThIMTBMMTIgMjRIMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
                          }}
                        />
                        <span className="font-medium">{t('testimonials_main.form.fields.avatar_selected')} {index + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Avatar Preview */}
            {formData.selected_avatar && (
              <div className="mt-3 flex items-center space-x-3">
                <img 
                  src={formData.selected_avatar} 
                  alt="Selected Avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNEMzJGMzIiLz4KPHBhdGggZD0iTTE2IDE0QzE3LjY1NjkgMTQgMTkgMTIuNjU2OSAxOSAxMUMxOSA5LjM0MzE1IDE3LjY1NjkgOCAxNiA4QzE0LjM0MzEgOCAxMyA5LjM0MzE1IDEzIDExQzEzIDEyLjY1NjkgMTQuMzQzMSAxNCAxNiAxNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiAyNEMxOS4zMTM3IDI0IDIyIDIxLjMxMzcgMjIgMThIMTBMMTIgMjRIMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
                  }}
                />
                <div className="flex-1">
                  <span className="text-sm text-emerald-600 font-medium">{t('testimonials_main.form.fields.avatar_selected')}</span>
                  <p className="text-xs text-gray-500">{t('testimonials_main.form.fields.avatar_selected')} {avatarOptions.indexOf(formData.selected_avatar) + 1}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, selected_avatar: '', use_avatar: false }))}
                  className="text-sm text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                >
                  {t('testimonials_main.form.fields.change_button')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6 pb-4 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('testimonials_main.form.buttons.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? t('testimonials_main.form.buttons.submitting') : t('testimonials_main.form.buttons.submit')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestimonialSubmissionForm;
