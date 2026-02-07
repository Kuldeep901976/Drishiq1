'use client';

import { useState } from 'react';
import Footer from '@/components/Footer';
import Link from 'next/link';
import ServicesFlipSlider from '@/components/ServicesFlipSlider';
import { useLanguage } from '@/lib/drishiq-i18n';
import { CheckCircle, Target, Brain, Users } from 'lucide-react';

export default function SuggestionSuccessPage() {
  const { t } = useLanguage(['community']);
  const [activeTab, setActiveTab] = useState('about');

  return (
    <>
      <main className="content-safe-area min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('community.suggestions.successPage.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('community.suggestions.successPage.message')}
            </p>
            <div className="mt-6">
              <Link
                href="/community/suggestions"
                className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mr-4"
              >
                {t('community.suggestions.successPage.submitAnother')}
              </Link>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('community.suggestions.successPage.backToHome')}
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('services')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'services'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t('community.suggestions.successPage.tabs.services')}
                </button>
                <button
                  onClick={() => setActiveTab('about')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'about'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t('community.suggestions.successPage.tabs.about')}
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'services' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {t('community.suggestions.successPage.services.title')}
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  {t('community.suggestions.successPage.services.subtitle')}
                </p>
              </div>

              {/* Services Showcase */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <ServicesFlipSlider orientation="horizontal" />
              </div>

              {/* Service Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target size={28} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('community.suggestions.successPage.services.careerGuidance.title')}</h3>
                  <p className="text-gray-600">
                    {t('community.suggestions.successPage.services.careerGuidance.description')}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain size={28} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('community.suggestions.successPage.services.personalDevelopment.title')}</h3>
                  <p className="text-gray-600">
                    {t('community.suggestions.successPage.services.personalDevelopment.description')}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={28} className="text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('community.suggestions.successPage.services.communitySupport.title')}</h3>
                  <p className="text-gray-600">
                    {t('community.suggestions.successPage.services.communitySupport.description')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {t('community.suggestions.successPage.about.title')}
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  {t('community.suggestions.successPage.about.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('community.suggestions.successPage.about.mission.title')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('community.suggestions.successPage.about.mission.description1')}
                  </p>
                  <p className="text-gray-600">
                    {t('community.suggestions.successPage.about.mission.description2')}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('community.suggestions.successPage.about.vision.title')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('community.suggestions.successPage.about.vision.description1')}
                  </p>
                  <p className="text-gray-600">
                    {t('community.suggestions.successPage.about.vision.description2')}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('community.suggestions.successPage.about.approach.title')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('community.suggestions.successPage.about.approach.description')}
                  </p>
                  <ul className="text-gray-600 space-y-2">
                    <li>• {t('community.suggestions.successPage.about.approach.points.personalized')}</li>
                    <li>• {t('community.suggestions.successPage.about.approach.points.community')}</li>
                    <li>• {t('community.suggestions.successPage.about.approach.points.learning')}</li>
                    <li>• {t('community.suggestions.successPage.about.approach.points.safe')}</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('community.suggestions.successPage.about.whatsNext.title')}</h3>
                  <p className="text-gray-600 mb-4">
                    {t('community.suggestions.successPage.about.whatsNext.description1')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('community.suggestions.successPage.about.whatsNext.description2')}
                  </p>
                  <ul className="text-gray-600 space-y-2">
                    <li>• {t('community.suggestions.successPage.about.whatsNext.features.ai')}</li>
                    <li>• {t('community.suggestions.successPage.about.whatsNext.features.workshops')}</li>
                    <li>• {t('community.suggestions.successPage.about.whatsNext.features.mobile')}</li>
                    <li>• {t('community.suggestions.successPage.about.whatsNext.features.integration')}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-12 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-8 text-center border border-emerald-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('community.suggestions.successPage.cta.title')}
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              {t('community.suggestions.successPage.cta.message')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {t('community.suggestions.successPage.cta.explore')}
              </Link>
              <Link
                href="/testimonials"
                className="inline-flex items-center px-6 py-3 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                {t('community.suggestions.successPage.cta.readStories')}
              </Link>
            </div>
          </div>

          {/* YouTube Playlist */}
          <div className="mt-12 bg-white rounded-xl p-4 border border-gray-200">
            <h4 className="text-base font-semibold text-[#0B4422] mb-3 text-center">{t('community.suggestions.successPage.youtube.title')}</h4>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/videoseries?list=PLkvOieJ_pAbDGUm6laWiJtbxTGoNZjKkN"
                title="DrishiQ Testimonials Playlist"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
