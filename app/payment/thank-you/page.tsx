'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/drishiq-i18n';

export default function PaymentThankYouPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage(['payment', 'common', 'chat']);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    // Get credits from URL if available
    const creditsParam = searchParams.get('credits');
    if (creditsParam) {
      setCredits(parseInt(creditsParam));
    }
  }, [searchParams]);

  const handleStartChat = () => {
    router.push('/apps/mode-selection');
  };

  const handleViewDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B4422] via-emerald-600 to-[#0B4422] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 px-8 py-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full"></div>
          </div>
          
          <div className="relative z-10">
            {/* Success Icon */}
            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-3">
              {t('chat.thankYou.payment.title')}
            </h1>
            <p className="text-xl text-green-50">
              {t('chat.thankYou.payment.subtitle')}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-green-50 rounded-full px-6 py-3 mb-4">
              <span className="text-green-700 font-semibold text-lg">
                {t('chat.thankYou.payment.creditsAdded')}
              </span>
            </div>
            
            {credits && (
              <p className="text-2xl font-bold text-gray-800 mt-4">
                {t('chat.thankYou.payment.creditsReady', { credits: credits.toString() })}
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-emerald-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {t('chat.thankYou.payment.whatsNext')}
            </h3>
            <p className="text-emerald-800 text-sm">
              {t('chat.thankYou.payment.creditsAvailable')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleStartChat}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {t('chat.thankYou.payment.startConversation')}
            </button>

            <button
              onClick={handleViewDashboard}
              className="w-full bg-white border-2 border-green-600 text-green-700 font-bold py-4 px-6 rounded-xl hover:bg-green-50 transition-all duration-300"
            >
              {t('chat.thankYou.payment.viewDashboard')}
            </button>

            <Link
              href="/priceplan"
              className="block w-full text-center text-gray-600 font-medium py-2 hover:text-green-600 transition-colors"
            >
              {t('chat.thankYou.payment.purchaseMore')}
            </Link>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>{t('chat.thankYou.payment.needHelp')}</p>
            <a href={`mailto:${t('chat.thankYou.payment.supportEmail')}`} className="text-green-600 hover:text-green-700 font-medium">
              {t('chat.thankYou.payment.supportEmail')}
            </a>
          </div>

          {/* YouTube Playlist */}
          <div className="mt-8 bg-white rounded-xl p-4 border border-gray-200">
            <h4 className="text-base font-semibold text-[#0B4422] mb-3 text-center">Watch Real Stories from DrishiQ Users</h4>
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
      </div>
    </div>
  );
}



















