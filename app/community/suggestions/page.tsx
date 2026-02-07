'use client';

import { useState } from 'react';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useLanguage } from '@/lib/drishiq-i18n';
import { CheckCircle, XCircle } from 'lucide-react';

interface SuggestionForm {
  category: string;
  title: string;
  description: string;
  priority: string;
  impact: string;
  additionalDetails: string;
  contactEmail: string;
  allowContact: boolean;
  submitterName: string;
  submitterType: 'anonymous' | 'registered' | 'guest';
}

export default function CommunitySuggestionsPage() {
  const [formData, setFormData] = useState<SuggestionForm>({
    category: '',
    title: '',
    description: '',
    priority: '',
    impact: '',
    additionalDetails: '',
    contactEmail: '',
    allowContact: false,
    submitterName: '',
    submitterType: 'guest'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { t } = useLanguage(['community']);

  const categories = [
    t('community.suggestions.categories.communityPageDesign'),
    t('community.suggestions.categories.ux'),
    t('community.suggestions.categories.module'),
    t('community.suggestions.categories.features'),
    t('community.suggestions.categories.other')
  ];

  const [otherCategory, setOtherCategory] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Use otherCategory if "Other" is selected
    const finalCategory = formData.category === t('community.suggestions.categories.other') ? otherCategory : formData.category;

    try {
      const response = await fetch('/api/community/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          category: finalCategory
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        // Redirect to success page after a short delay
        setTimeout(() => {
          window.location.href = '/community/suggestions/success';
        }, 1500);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorities = [
    t('community.suggestions.priorities.low'),
    t('community.suggestions.priorities.medium'),
    t('community.suggestions.priorities.high'),
    t('community.suggestions.priorities.critical')
  ];

  const impacts = [
    t('community.suggestions.impacts.individual'),
    t('community.suggestions.impacts.smallGroups'),
    t('community.suggestions.impacts.largeCommunity'),
    t('community.suggestions.impacts.allUsers'),
    t('community.suggestions.impacts.businessOps')
  ];

  return (
    <>
      <main className="content-safe-area min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('community.suggestions.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('community.suggestions.subtitle')}
            </p>
          </div>

          {/* Success/Error Messages */}
          {submitStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="text-green-500" size={24} />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    {t('community.suggestions.successTitle')}
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    {t('community.suggestions.successMessage')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircle className="text-red-500" size={24} />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {t('community.suggestions.errorTitle')}
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {t('community.suggestions.errorMessage')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('community.suggestions.form.categoryLabel')}
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">{t('community.suggestions.form.categoryPlaceholder')}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                
                {formData.category === t('community.suggestions.categories.other') && (
                  <div className="mt-3">
                    <label htmlFor="otherCategory" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('community.suggestions.form.otherCategoryLabel')}
                    </label>
                    <input
                      type="text"
                      id="otherCategory"
                      value={otherCategory}
                      onChange={(e) => setOtherCategory(e.target.value)}
                      required
                      placeholder={t('community.suggestions.form.otherCategoryPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('community.suggestions.form.titleLabel')}
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder={t('community.suggestions.form.titlePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('community.suggestions.form.descriptionLabel')}
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder={t('community.suggestions.form.descriptionPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Priority and Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('community.suggestions.form.priorityLabel')}
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">{t('community.suggestions.form.priorityPlaceholder')}</option>
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="impact" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('community.suggestions.form.impactLabel')}
                  </label>
                  <select
                    id="impact"
                    name="impact"
                    value={formData.impact}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">{t('community.suggestions.form.impactPlaceholder')}</option>
                    {impacts.map((impact) => (
                      <option key={impact} value={impact}>
                        {impact}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <label htmlFor="additionalDetails" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('community.suggestions.form.additionalDetailsLabel')}
                </label>
                <textarea
                  id="additionalDetails"
                  name="additionalDetails"
                  value={formData.additionalDetails}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder={t('community.suggestions.form.additionalDetailsPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Submitter Information */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">{t('community.suggestions.form.aboutYouTitle')}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label htmlFor="submitterType" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('community.suggestions.form.submitterTypeLabel')}
                    </label>
                    <select
                      id="submitterType"
                      name="submitterType"
                      value={formData.submitterType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="guest">{t('community.suggestions.submitterTypes.guest')}</option>
                      <option value="registered">{t('community.suggestions.submitterTypes.registered')}</option>
                      <option value="anonymous">{t('community.suggestions.submitterTypes.anonymous')}</option>
                    </select>
                  </div>
                  
                  {formData.submitterType !== 'anonymous' && (
                    <div>
                      <label htmlFor="submitterName" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('community.suggestions.form.submitterNameLabel')}
                      </label>
                      <input
                        type="text"
                        id="submitterName"
                        name="submitterName"
                        value={formData.submitterName}
                        onChange={handleInputChange}
                        placeholder={t('community.suggestions.form.submitterNamePlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="allowContact"
                    name="allowContact"
                    checked={formData.allowContact}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allowContact" className="ml-2 block text-sm text-gray-700">
                    {t('community.suggestions.form.allowContactLabel')}
                  </label>
                </div>

                {formData.allowContact && (
                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('community.suggestions.form.emailLabel')}
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      placeholder={t('community.suggestions.form.emailPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link
                  href="/testimonials"
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('community.suggestions.form.cancel')}
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? t('community.suggestions.form.submitting') : t('community.suggestions.form.submit')}
                </button>
              </div>
            </form>
          </div>

          {/* Additional Info */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              {t('community.suggestions.howWeUse.title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">{t('community.suggestions.howWeUse.analysis.title')}</h4>
                <p>{t('community.suggestions.howWeUse.analysis.description')}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">{t('community.suggestions.howWeUse.planning.title')}</h4>
                <p>{t('community.suggestions.howWeUse.planning.description')}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">{t('community.suggestions.howWeUse.updates.title')}</h4>
                <p>{t('community.suggestions.howWeUse.updates.description')}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">{t('community.suggestions.howWeUse.collaboration.title')}</h4>
                <p>{t('community.suggestions.howWeUse.collaboration.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
