'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/drishiq-i18n';

export default function PaymentFailurePage() {
  const router = useRouter();
  const { t } = useLanguage(['payment', 'common']);

  const handleTryAgain = () => {
    router.push('/priceplan');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 px-8 py-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full"></div>
          </div>
          
          <div className="relative z-10">
            {/* Alert Icon */}
            <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-3">
              {t('payment.failure.title')}
            </h1>
            <p className="text-xl text-red-50">
              {t('payment.failure.subtitle')}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-red-50 rounded-full px-6 py-3 mb-4">
              <span className="text-red-700 font-semibold text-lg">
                {t('payment.failure.transactionFailed')}
              </span>
            </div>
            
            <p className="text-lg text-gray-700 mt-4">
              {t('payment.failure.notCharged')}
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-yellow-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {t('payment.failure.possibleReasons')}
            </h3>
            <ul className="text-yellow-800 text-sm space-y-2 text-left list-disc list-inside">
              <li>{t('payment.failure.reasons.insufficientFunds')}</li>
              <li>{t('payment.failure.reasons.incorrectCard')}</li>
              <li>{t('payment.failure.reasons.bankDeclined')}</li>
              <li>{t('payment.failure.reasons.networkIssues')}</li>
              <li>{t('payment.failure.reasons.cardExpired')}</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleTryAgain}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {t('payment.failure.tryAgain')}
            </button>

            <Link
              href="/priceplan"
              className="block w-full bg-white border-2 border-gray-300 text-gray-700 font-bold py-4 px-6 rounded-xl hover:bg-gray-50 transition-all duration-300 text-center"
            >
              {t('payment.failure.backToPlans')}
            </Link>

            <Link
              href="/support"
              className="block w-full text-center text-gray-600 font-medium py-2 hover:text-green-600 transition-colors"
            >
              {t('payment.failure.contactSupport')}
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-900 mb-2">{t('payment.failure.needHelp')}</h3>
            <p className="text-blue-800 text-sm mb-3">
              {t('payment.failure.helpMessage')}
            </p>
            <div className="flex items-center text-blue-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <a href={`mailto:${t('payment.failure.supportEmail')}`} className="font-medium hover:underline">
                {t('payment.failure.supportEmail')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
