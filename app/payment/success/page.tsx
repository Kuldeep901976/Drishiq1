'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/drishiq-i18n';

interface PaymentSuccessData {
  planId: string;
  planName: string;
  planCategory: 'prelaunch' | 'postlaunch' | 'gift' | 'support';
  amount: number;
  currency: string;
  currencySymbol: string;
  credits: number;
  transactionId: string;
  country: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage(['payment', 'common']);
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditsAdded, setCreditsAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const planId = searchParams.get('plan') || 'first-light';
    const planCategory = (searchParams.get('category') as any) || 'prelaunch';
    const amount = parseFloat(searchParams.get('amount') || '0');
    const currency = searchParams.get('currency') || 'INR';
    const transactionId = searchParams.get('transaction_id') || 'TXN_' + Date.now();
    const country = searchParams.get('country') || 'IN';

    const planNames: Record<string, string> = {
      'first-light': 'First Light',
      'steady-lens': 'Steady Lens',
      'enterprise': 'Enterprise',
      'gift-first-light': 'Gift First Light',
      'gift-steady-lens': 'Gift Steady Lens',
      'gift-deeper-sense': 'Gift Deeper Sense',
      'support-gentle-nudge': 'One Gentle Nudge',
      'support-shift-forward': 'A Shift Forward',
      'support-deeper-space': 'Deeper Space'
    };

    const planCredits: Record<string, number> = {
      'first-light': 1,
      'steady-lens': 5,
      'enterprise': 10,
      'gift-first-light': 1,
      'gift-steady-lens': 2,
      'gift-deeper-sense': 5,
      'support-gentle-nudge': 1,
      'support-shift-forward': 2,
      'support-deeper-space': 5
    };

    const currencySymbols: Record<string, string> = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$',
      'AUD': 'A$'
    };

    const paymentInfo: PaymentSuccessData = {
      planId,
      planName: planNames[planId] || 'Unknown Plan',
      planCategory,
      amount,
      currency,
      currencySymbol: currencySymbols[currency] || currency,
      credits: planCredits[planId] || 0,
      transactionId,
      country
    };

    setPaymentData(paymentInfo);
    processPaymentSuccess(paymentInfo);
  }, [searchParams]);

  const processPaymentSuccess = async (data: PaymentSuccessData) => {
    try {
      console.log('Processing payment success:', data);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // Payment should only happen for authenticated users (checked at payment page)
      if (sessionError || !session?.user) {
        console.error('❌ No user session found - should not reach here');
        setError('User session not found. Please sign in and try again.');
        setLoading(false);
        setTimeout(() => {
          router.push('/auth/signin?redirect=/priceplan');
        }, 3000);
        return;
      }

      const userId = session.user.id;
      console.log('User ID:', userId);

      // Get exchange rate and convert to INR
      // The RPC function will update both user_credit_balance and users.credits
      const exchangeRates: Record<string, number> = {
        'INR': 1,
        'USD': 83.5,
        'EUR': 91.2,
        'GBP': 105.3
      };
      
      const exchangeRate = exchangeRates[data.currency] || 1;
      const convertedAmountInr = data.amount * exchangeRate;

      // Call API to record transaction server-side
      const transactionResponse = await fetch('/api/payment/record-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: session.user.email,
          transactionType: 'purchase',
          currency: data.currency,
          originalAmount: data.amount,
          credits: data.credits,
          transactionId: data.transactionId,
          packageId: data.planId,
          packageName: data.planName,
          planCategory: data.planCategory,
          country: data.country
        })
      });
      
      const transactionResult = await transactionResponse.json();
      
      if (!transactionResult.success) {
        console.error('Warning: Failed to record transaction:', transactionResult.error);
        setError(transactionResult.error || 'Failed to record transaction');
        setLoading(false);
        return;
      } else {
        console.log('✅ Transaction recorded and balance updated');
      }

      console.log('✅ Payment processed successfully. Credits added:', data.credits);
      setCreditsAdded(true);
      setLoading(false);
      
      // Redirect to mode-selection after successful payment
      setTimeout(() => {
        router.push('/apps/mode-selection');
      }, 2000);
    } catch (err: any) {
      console.error('Error processing payment:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const getCategoryMessage = (category: string) => {
    const messages = {
      prelaunch: {
        title: t('payment.successPage.categories.prelaunch.title'),
        subtitle: t('payment.successPage.categories.prelaunch.subtitle'),
        message: t('payment.successPage.categories.prelaunch.message'),
        badge: t('payment.successPage.categories.prelaunch.badge'),
        color: "emerald"
      },
      postlaunch: {
        title: t('payment.successPage.categories.postlaunch.title'),
        subtitle: t('payment.successPage.categories.postlaunch.subtitle'),
        message: t('payment.successPage.categories.postlaunch.message'),
        badge: t('payment.successPage.categories.postlaunch.badge'),
        color: "blue"
      },
      gift: {
        title: t('payment.successPage.categories.gift.title'),
        subtitle: t('payment.successPage.categories.gift.subtitle'),
        message: t('payment.successPage.categories.gift.message'),
        badge: t('payment.successPage.categories.gift.badge'),
        color: "purple"
      },
      support: {
        title: t('payment.successPage.categories.support.title'),
        subtitle: t('payment.successPage.categories.support.subtitle'),
        message: t('payment.successPage.categories.support.message'),
        badge: t('payment.successPage.categories.support.badge'),
        color: "pink"
      }
    };
    return messages[category as keyof typeof messages] || messages.postlaunch;
  };

  const getBadgeImage = (category: string) => {
    const badgeImages = {
      prelaunch: '/assets/images/seedbadge.png',
      postlaunch: '/assets/images/growthbadge.png',
      gift: '/assets/images/wisdombadge.png',
      support: '/assets/images/donationbadge.png'
    };
    return badgeImages[category as keyof typeof badgeImages] || '/assets/images/growthbadge.png';
  };

  const handleDownloadBadge = () => {
    if (!paymentData) return;
    
    const badgeImage = getBadgeImage(paymentData.planCategory);
    const link = document.createElement('a');
    link.href = badgeImage;
    link.download = `drishiq-${paymentData.planCategory}-badge.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGoToChat = () => {
    router.push('/apps/mode-selection');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B4422] via-emerald-600 to-[#0B4422] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">{t('payment.successPage.processing')}</p>
          {creditsAdded && <p className="text-sm mt-2 text-emerald-200">{t('payment.successPage.creditsAdded')}</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B4422] via-emerald-600 to-[#0B4422] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t('payment.successPage.processingError')}</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link
            href="/priceplan"
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors inline-block"
          >
            {t('payment.successPage.backToPlans')}
          </Link>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B4422] via-emerald-600 to-[#0B4422] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">{t('payment.successPage.paymentDataNotFound')}</h1>
          <p className="text-lg mb-6">{t('payment.successPage.unableToLoad')}</p>
          <Link
            href="/priceplan"
            className="bg-white text-[#0B4422] px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors inline-block"
          >
            {t('payment.successPage.backToPlans')}
          </Link>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryMessage(paymentData.planCategory);
  const badgeImage = getBadgeImage(paymentData.planCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B4422] via-emerald-600 to-[#0B4422]">
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌙</span>
              <h1 className="text-xl font-bold text-white">DrishiQ</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-6 animate-bounce">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {categoryInfo.title}
          </h1>
          <p className="text-xl text-emerald-100 mb-6">
            {categoryInfo.subtitle}
          </p>
          {creditsAdded && (
            <div className="inline-block bg-green-400/20 border border-green-400 rounded-lg px-4 py-2 mb-4">
              <p className="text-green-200 font-semibold">✓ {paymentData.credits} {t('payment.successPage.creditsAdded')}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-[#0B4422] mb-6">{t('payment.successPage.paymentConfirmation')}</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">{t('payment.successPage.plan')}</span>
                <span className="font-bold text-[#0B4422]">{paymentData.planName}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">{t('payment.successPage.creditsAddedLabel')}</span>
                <span className="font-bold text-green-600">+{paymentData.credits}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">{t('payment.successPage.amountPaid')}</span>
                <span className="font-bold text-[#0B4422]">
                  {paymentData.currencySymbol}{paymentData.amount.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">{t('payment.successPage.transactionId')}</span>
                <span className="font-mono text-sm text-gray-500">{paymentData.transactionId}</span>
              </div>
              
              <div className="flex justify-between items-center py-4">
                <span className="text-gray-600">{t('payment.successPage.status')}</span>
                <span className="inline-flex items-center gap-2 text-green-600 font-bold">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {t('payment.successPage.paymentSuccessful')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 relative">
                <Image
                  src={badgeImage}
                  alt={`${categoryInfo.badge} Badge`}
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-[#0B4422] mb-2">{categoryInfo.badge}</h3>
            </div>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              {categoryInfo.message}
            </p>

            {paymentData.planCategory === 'support' && (
              <div className="bg-pink-50 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-pink-800 mb-2">{t('payment.successPage.categories.support.downloadBadge')}</h4>
                <p className="text-sm text-pink-700 mb-3">{t('payment.successPage.categories.support.badgeDescription')}</p>
                <button
                  onClick={handleDownloadBadge}
                  className="bg-pink-200 text-pink-800 px-4 py-2 rounded-lg font-medium hover:bg-pink-300 transition-colors w-full"
                >
                  {t('payment.successPage.categories.support.downloadButton')}
                </button>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-bold text-[#0B4422]">{t('payment.successPage.whatsNext')}</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ {t('payment.successPage.creditsAddedToAccount')}</li>
                <li>• {t('payment.successPage.startFirstSession')}</li>
                <li>• {t('payment.successPage.checkEmail')}</li>
                {paymentData.planCategory === 'gift' && (
                  <li>• {t('payment.successPage.shareGift')}</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoToChat}
              className="bg-white text-[#0B4422] px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-200 transform hover:-translate-y-1 shadow-lg"
            >
              {t('payment.successPage.goToChat')}
            </button>
            
            <Link
              href="/priceplan"
              className="bg-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition-all duration-200 transform hover:-translate-y-1 border border-white/30"
            >
              {t('payment.successPage.viewAllPlans')}
            </Link>
          </div>

          <div className="mt-8">
            <p className="text-white/80 mb-4">{t('payment.successPage.shareJourney')}</p>
            <div className="flex justify-center gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                {t('payment.successPage.shareTwitter')}
              </button>
              <button className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors">
                {t('payment.successPage.shareLinkedIn')}
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-white/80 text-lg italic">
            "See Through the Challenge"
          </p>
        </div>

        {/* YouTube Playlist */}
        <div className="mt-12 max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
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