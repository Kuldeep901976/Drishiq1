'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/drishiq-i18n';

export default function RequestThankYouPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage(['request']);
  const [requestType, setRequestType] = useState<'trial' | 'sponsor' | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    
    if (type === 'trial' || type === 'sponsor') {
      setRequestType(type);
    } else {
      // Default to trial if no type specified
      setRequestType('trial');
    }
    
    if (id) {
      setRequestId(id);
    }
  }, [searchParams]);

  const isTrialAccess = requestType === 'trial';
  const isSponsorSupport = requestType === 'sponsor';

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header with gradient - different colors for each type */}
            <div className={`px-8 py-12 text-center relative overflow-hidden ${
              isTrialAccess 
                ? 'bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600'
            }`}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full"></div>
              </div>
              
              <div className="relative z-10">
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg"
                >
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-5xl font-bold text-white mb-3"
                >
                  {isTrialAccess ? t('request.thankYou.trialAccess.title') : t('request.thankYou.sponsorSupport.title')}
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-white/90"
                >
                  {isTrialAccess 
                    ? t('request.thankYou.trialAccess.subtitle')
                    : t('request.thankYou.sponsorSupport.subtitle')
                  }
                </motion.p>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center mb-8"
              >
                <p className="text-lg text-gray-700 mb-6">
                  {isTrialAccess
                    ? t('request.thankYou.trialAccess.message')
                    : t('request.thankYou.sponsorSupport.message')
                  }
                </p>

                {/* Info Box - Different content for each type */}
                <div className={`rounded-xl p-6 mb-6 text-left ${
                  isTrialAccess
                    ? 'bg-emerald-50 border-2 border-emerald-200'
                    : 'bg-purple-50 border-2 border-purple-200'
                }`}>
                  <p className={`text-base font-semibold mb-3 ${
                    isTrialAccess ? 'text-emerald-900' : 'text-purple-900'
                  }`}>
                    {isTrialAccess ? t('request.thankYou.trialAccess.whatHappensNext.title') : t('request.thankYou.sponsorSupport.whatHappensNext.title')}
                  </p>
                  {isTrialAccess ? (
                    <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                      <li>{t('request.thankYou.trialAccess.whatHappensNext.item1')}</li>
                      <li>{t('request.thankYou.trialAccess.whatHappensNext.item2')}</li>
                      <li>{t('request.thankYou.trialAccess.whatHappensNext.item3')}</li>
                      <li>{t('request.thankYou.trialAccess.whatHappensNext.item4')}</li>
                      <li>{t('request.thankYou.trialAccess.whatHappensNext.item5')}</li>
                    </ul>
                  ) : (
                    <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                      <li>{t('request.thankYou.sponsorSupport.whatHappensNext.item1')}</li>
                      <li>{t('request.thankYou.sponsorSupport.whatHappensNext.item2')}</li>
                      <li>{t('request.thankYou.sponsorSupport.whatHappensNext.item3')}</li>
                      <li>{t('request.thankYou.sponsorSupport.whatHappensNext.item4')}</li>
                      <li>{t('request.thankYou.sponsorSupport.whatHappensNext.item5')}</li>
                    </ul>
                  )}
                </div>

                {/* Request ID if available */}
                {requestId && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600">
                      <strong>{t('request.thankYou.requestId.label')}</strong> <span className="font-mono">{requestId}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {t('request.thankYou.requestId.info')}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                  <Link
                    href="/"
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      isTrialAccess
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                    } shadow-lg hover:shadow-xl transform hover:scale-105`}
                  >
                    {t('request.thankYou.buttons.returnHome')}
                  </Link>
                  
                  <Link
                    href="/about"
                    className="px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all shadow-md hover:shadow-lg"
                  >
                    {t('request.thankYou.buttons.learnMore')}
                  </Link>
                </div>

                {/* Additional Info */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>{t('request.thankYou.support.title')}</strong> {t('request.thankYou.support.message')}{' '}
                    <a href={`mailto:${t('request.thankYou.support.email')}`} className="text-blue-600 hover:underline">
                      {t('request.thankYou.support.email')}
                    </a>
                  </p>
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
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
}


