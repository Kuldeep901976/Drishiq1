'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { 
  getCountryInfo, 
  getCurrencyRate, 
  calculateLocationPricing,
  formatPrice,
  type CountryInfo,
  type CurrencyRate 
} from '@/lib/pricing-utils';
import { useLanguage } from '@/lib/drishiq-i18n';
import CouponInput from '@/components/CouponInput';
import { AlertTriangle, Globe, CreditCard, Wallet, Lock } from 'lucide-react';

interface PaymentPlan {
  id: string;
  name: string;
  basePrice: number;
  discountedPrice: number;
  currency: string;
  currencySymbol: string;
  credits: number;
  category: 'prelaunch' | 'postlaunch' | 'gift' | 'support';
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage(['payment', 'common']);
  const [loading, setLoading] = useState(true);
  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cashfree' | 'paypal' | null>(null);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discount_amount: number;
    final_amount: number;
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        setLoading(true);
        
        // STEP 1: Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          console.log('❌ No session - redirecting to sign up');
          setLoading(false);
          router.push('/auth/signup?redirect=/priceplan&message=Please sign up to purchase credits');
          return;
        }

        const userEmail = session.user.email;
        const userId = session.user.id;
        setUserId(userId);

        // STEP 2: Check if user has data in users or temporary_signups
        const [usersCheck, tempSignupsCheck] = await Promise.all([
          supabase
            .from('users')
            .select('id, email, first_name, phone')
            .eq('id', userId)
            .maybeSingle(),
          supabase
            .from('temporary_signups')
            .select('id, email, first_name, phone')
            .eq('email', userEmail || '')
            .maybeSingle()
        ]);

        const hasUserData = usersCheck.data && (usersCheck.data.first_name || usersCheck.data.phone);
        const hasTempData = tempSignupsCheck.data && (tempSignupsCheck.data.first_name || tempSignupsCheck.data.phone);

        // STEP 3: If no data in either table, redirect to complete profile
        if (!hasUserData && !hasTempData) {
          console.log('❌ No profile data found - redirecting to profile completion');
          setLoading(false);
          router.push('/profile?message=Please complete your profile before purchasing credits');
          return;
        }

        // STEP 4: Continue with payment if user has profile data
        console.log('✅ User authenticated and has profile data');
        
        // Get plan details from URL params
        const planId = searchParams.get('plan');
        const planCategoryParam = searchParams.get('category');
        const countryCode = searchParams.get('country') || 'IN';
        
        // Log all URL parameters for debugging
        console.log(`[PaymentPage] ==========================================`);
        console.log(`[PaymentPage] RAW URL params received:`, {
          plan: planId,
          category_raw: planCategoryParam,
          category_type: typeof planCategoryParam,
          country: countryCode,
          all_params: Object.fromEntries(searchParams.entries()),
          full_url: window.location.href
        });
        
        if (!planId) {
          console.warn('[PaymentPage] Missing planId, redirecting to priceplan');
          setLoading(false);
          router.push('/priceplan');
          return;
        }
        
        // CRITICAL: If category is 'postlaunch' but we're on a main plan, check if it should be prelaunch
        // This is a safety check in case CheckoutButton didn't pass the correct category
        let planCategory: 'prelaunch' | 'postlaunch' | 'gift' | 'support';
        
        if (planCategoryParam) {
          planCategory = planCategoryParam as 'prelaunch' | 'postlaunch' | 'gift' | 'support';
          
          // SAFETY CHECK: If category is 'postlaunch' for a main plan, default to prelaunch (early access)
          if (planCategory === 'postlaunch' && (planId === 'first-light' || planId === 'steady-lens' || planId === 'enterprise')) {
            console.warn(`[PaymentPage] 🚨 SAFETY: Received 'postlaunch' for main plan '${planId}'. This should be 'prelaunch' for early access pricing.`);
            console.warn(`[PaymentPage] 🚨 Overriding to 'prelaunch' for early access pricing.`);
            planCategory = 'prelaunch';
          }
        } else {
          // Default to prelaunch for early access pricing
          console.warn(`[PaymentPage] Category parameter missing! Defaulting to 'prelaunch' for early access pricing.`);
          planCategory = 'prelaunch';
        }
        
        console.log(`[PaymentPage] Final category decision:`, {
          original_category: planCategoryParam,
          final_category: planCategory,
          plan: planId
        });
        console.log(`[PaymentPage] ==========================================`);

        // Load country info and currency rates
        const [loadedCountryData, ratesResponse] = await Promise.all([
          getCountryInfo(countryCode).catch(err => {
            console.warn('Error loading country info:', err);
            return null;
          }),
          fetch('/api/currency-rates').then(r => r.ok ? r.json() : []).catch(err => {
            console.warn('Error loading currency rates:', err);
            return [];
          })
        ]);

        // If country info failed to load, show error
        if (!loadedCountryData) {
          setError('Unable to load payment information. Please try again or contact support.');
          setLoading(false);
          return;
        }

        setCountryInfo(loadedCountryData);
        setCurrencyRates(ratesResponse || []);
        
        // Calculate pricing for the selected plan
        const pricing = calculateLocationPricing(
          planId as any,
          loadedCountryData,
          ratesResponse || [],
          planCategory
        );

        console.log(`[PaymentPage] Calculated pricing for ${planId} with category ${planCategory}:`, {
          base_price: pricing.base_price,
          discounted_price: pricing.discounted_price,
          currency: pricing.currency_code
        });

        const plan: PaymentPlan = {
          id: planId,
          name: getPlanName(planId),
          basePrice: pricing.base_price,
          discountedPrice: pricing.discounted_price,
          currency: pricing.currency_code,
          currencySymbol: pricing.currency_symbol,
          credits: getPlanCredits(planId),
          category: planCategory
        };

        setSelectedPlan(plan);

        // Calculate tax (simplified - you can make this more sophisticated)
        const taxRate = getTaxRate(countryCode, planCategory);
        const calculatedTax = pricing.discounted_price * (taxRate / 100);
        setTaxAmount(calculatedTax);
        const total = pricing.discounted_price + calculatedTax;
        setTotalAmount(total);
        
        console.log(`[PaymentPage] Final calculation: ${pricing.discounted_price} + ${calculatedTax.toFixed(2)} (${taxRate}% tax) = ${total.toFixed(2)}`);
        
        setLoading(false);

      } catch (error) {
        console.error('Error loading payment data:', error);
        setLoading(false);
        // Show error to user instead of redirecting
        setError('Failed to load payment information. Please try again.');
      }
    };

    loadPaymentData();
  }, [searchParams, router]);

  const getPlanName = (planId: string): string => {
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
    return planNames[planId] || 'Unknown Plan';
  };

  const getPlanCredits = (planId: string): number => {
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
    return planCredits[planId] || 0;
  };

  const getTaxRate = (countryCode: string, category: string): number => {
    // Simplified tax calculation - you can make this more sophisticated
    const taxRates: Record<string, number> = {
      'IN': 18, // India GST
      'US': 8,  // US average sales tax
      'DE': 19, // Germany VAT
      'GB': 20, // UK VAT
      'CA': 13, // Canada average
      'AU': 10, // Australia GST
    };
    return taxRates[countryCode] || 10; // Default 10% tax
  };

  const handlePaymentMethodSelect = (method: 'cashfree' | 'paypal') => {
    setSelectedPaymentMethod(method);
  };

  const handleProceedToPayment = async () => {
    if (!selectedPlan || !selectedPaymentMethod) return;

    try {
      // Create payment session
      const response = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planCategory: selectedPlan.category,
          amount: appliedCoupon ? appliedCoupon.final_amount + taxAmount : totalAmount,
          currency: selectedPlan.currency,
          paymentMethod: selectedPaymentMethod,
          countryCode: countryInfo?.country_code,
          taxAmount: taxAmount,
          baseAmount: selectedPlan.discountedPrice,
          coupon_code: appliedCoupon?.code || null,
          coupon_id: appliedCoupon?.id || null,
          discount_amount: appliedCoupon?.discount_amount || 0
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to payment gateway
        if (selectedPaymentMethod === 'cashfree') {
          window.location.href = data.paymentUrl;
        } else if (selectedPaymentMethod === 'paypal') {
          window.location.href = data.paymentUrl;
        }
      } else {
        alert('Payment initialization failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment initialization failed. Please try again.');
    }
  };

  // Show error if any
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-4 flex justify-center">
            <AlertTriangle size={64} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('payment.page.error.title')}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/priceplan')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            {t('payment.page.error.backToPlans')}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B4422] via-emerald-600 to-[#0B4422] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">{t('payment.page.error.loading')}</p>
        </div>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B4422] via-emerald-600 to-[#0B4422] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">{t('payment.page.error.planNotFound')}</h1>
          <p className="text-lg mb-6">{t('payment.page.error.planNotFoundMessage')}</p>
          <button
            onClick={() => router.push('/priceplan')}
            className="bg-white text-[#0B4422] px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            {t('payment.page.error.backToPlans')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B4422] via-emerald-600 to-[#0B4422]">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe size={24} className="text-white" />
              <h1 className="text-xl font-bold text-white">{t('payment.page.header.title')}</h1>
            </div>
            <button
              onClick={() => router.push('/priceplan')}
              className="text-white/80 hover:text-white transition-colors"
            >
              {t('payment.page.header.backToPlans')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-[#0B4422] mb-6">{t('payment.page.planSummary.title')}</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-lg font-medium text-gray-700">{selectedPlan.name}</span>
                <span className="text-lg font-bold text-[#0B4422]">{selectedPlan.credits} {t('payment.page.planSummary.credits')}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">{t('payment.page.planSummary.planPrice')}</span>
                <span className="font-medium">{formatPrice(selectedPlan.discountedPrice, selectedPlan.currencySymbol)}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">{t('payment.page.planSummary.tax')} ({getTaxRate(countryInfo?.country_code || 'IN', selectedPlan.category)}%)</span>
                <span className="font-medium">{formatPrice(taxAmount, selectedPlan.currencySymbol)}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Coupon Discount ({appliedCoupon.code})</span>
                  <span className="font-medium text-emerald-600">-{formatPrice(appliedCoupon.discount_amount, selectedPlan.currencySymbol)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-4 bg-emerald-50 rounded-lg px-4">
                <span className="text-xl font-bold text-[#0B4422]">{t('payment.page.planSummary.totalAmount')}</span>
                <span className="text-2xl font-bold text-[#0B4422]">
                  {formatPrice(appliedCoupon ? appliedCoupon.final_amount + taxAmount : totalAmount, selectedPlan.currencySymbol)}
                </span>
              </div>
              
              {/* Coupon Input */}
              <div className="mt-6">
                <CouponInput
                  onCouponApplied={(coupon) => {
                    setAppliedCoupon(coupon);
                  }}
                  onCouponRemoved={() => {
                    setAppliedCoupon(null);
                  }}
                  orderAmount={selectedPlan.discountedPrice + taxAmount}
                  userId={userId || undefined}
                />
              </div>
            </div>

            {/* Country Info */}
            {countryInfo && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t('payment.page.planSummary.location')}:</span> {countryInfo.country_name} ({countryInfo.currency_code})
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t('payment.page.planSummary.pricingCategory')}:</span> {countryInfo.drishiq_category}
                </p>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-[#0B4422] mb-6">{t('payment.page.paymentMethods.title')}</h2>
            
            <div className="space-y-4">
              {/* Cashfree (for India) */}
              {countryInfo?.country_code === 'IN' && (
                <button
                  onClick={() => handlePaymentMethodSelect('cashfree')}
                  className={`w-full p-6 border-2 rounded-xl transition-all duration-200 ${
                    selectedPaymentMethod === 'cashfree'
                      ? 'border-[#0B4422] bg-emerald-50 ring-2 ring-[#0B4422]/20'
                      : 'border-gray-200 hover:border-[#0B4422]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard size={24} className="text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-[#0B4422]">{t('payment.page.paymentMethods.cashfree.name')}</h3>
                      <p className="text-gray-600">{t('payment.page.paymentMethods.cashfree.description')}</p>
                    </div>
                  </div>
                </button>
              )}

              {/* PayPal (for international) */}
              <button
                onClick={() => handlePaymentMethodSelect('paypal')}
                className={`w-full p-6 border-2 rounded-xl transition-all duration-200 ${
                  selectedPaymentMethod === 'paypal'
                    ? 'border-[#0B4422] bg-emerald-50 ring-2 ring-[#0B4422]/20'
                    : 'border-gray-200 hover:border-[#0B4422]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Wallet size={24} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-[#0B4422]">{t('payment.page.paymentMethods.paypal.name')}</h3>
                    <p className="text-gray-600">{t('payment.page.paymentMethods.paypal.description')}</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Proceed Button */}
            <button
              onClick={handleProceedToPayment}
              disabled={!selectedPaymentMethod}
              className={`w-full mt-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
                selectedPaymentMethod
                  ? 'bg-[#0B4422] text-white hover:bg-[#0B4422]/90 transform hover:-translate-y-1'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {selectedPaymentMethod ? t('payment.page.paymentMethods.proceed') : t('payment.page.paymentMethods.selectMethod')}
            </button>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Lock size={20} className="text-green-600" />
                <p className="text-sm text-green-800">
                  {t('payment.page.paymentMethods.securityNotice')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
