'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useLanguage } from '@/lib/drishiq-i18n';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CheckoutButtonProps {
  planId: string;
  planName: string;
  basePrice: number;
  userCountry?: string;
  currencyCode?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
  type?: 'main' | 'gift' | 'support';
  supportLevel?: string;
  customAmount?: number;
}

export default function CheckoutButton({
  planId,
  planName,
  basePrice,
  userCountry = 'IN',
  currencyCode,
  userId = 'guest',
  userEmail = 'guest@example.com',
  userName = 'Guest User',
  userPhone = '9999999999',
  onPaymentSuccess,
  onPaymentError,
  className = '',
  children,
  type = 'main',
  supportLevel,
  customAmount
}: CheckoutButtonProps) {
  const { t } = useLanguage(['payment', 'common']);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState<{ finalPrice: number; currency: string } | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<string>('payment');

  useEffect(() => {
    // Table-driven/static: use provided basePrice and country to set currency
    const inferred = (userCountry || 'IN') === 'IN' ? 'INR' : 'USD';
    const currency = currencyCode || inferred;
    setPricing({ finalPrice: basePrice, currency });
  }, [planId, userCountry, currencyCode, basePrice]);

  const handlePayment = async () => {
    if (!pricing) return;

    setLoading(true);
    try {
      const finalAmount = customAmount || pricing.finalPrice;
      const currency = pricing.currency;

      // Determine plan category based on type and planId
      let planCategory = 'postlaunch';
      if (type === 'gift') {
        planCategory = 'gift';
      } else if (type === 'support') {
        planCategory = 'support';
      } else if (planId.includes('prelaunch') || planId.includes('early')) {
        planCategory = 'prelaunch';
      }

      // Redirect to payment page with plan details
      const params = new URLSearchParams({
        plan: planId,
        category: planCategory,
        country: userCountry || 'IN',
        amount: String(finalAmount),
        currency: currency
      });
      window.location.href = `/payment?${params.toString()}`;
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError?.(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async (amount: number, currency: string) => {
    try {
      // Create PayPal order
      const response = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId,
          amount,
          currency,
          userCountry,
          type,
          supportLevel,
          planName,
          userEmail,
          userName,
          userPhone
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create PayPal order');
      }

      // Redirect to PayPal
      if (result.paymentLink) {
        window.location.href = result.paymentLink;
      } else {
        throw new Error('No payment link received');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleCashfreePayment = async (amount: number, currency: string) => {
    try {
      // Create Cashfree order
      const response = await fetch('/api/payments/cashfree/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId,
          amount,
          currency,
          userCountry,
          type,
          supportLevel,
          planName,
          userEmail,
          userName,
          userPhone
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create Cashfree order');
      }

      // Redirect to Cashfree
      if (result.paymentLink) {
        window.location.href = result.paymentLink;
      } else {
        throw new Error('No payment link received');
      }
    } catch (error) {
      throw error;
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'paypal':
        return '💳';
      case 'cashfree':
        return '🏦';
      case 'phonepe':
        return '📱';
      default:
        return '💳';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'paypal':
        return 'PayPal';
      case 'cashfree':
        return 'Cashfree';
      case 'phonepe':
        return 'PhonePe';
      default:
        return 'Payment';
    }
  };

  if (!pricing) {
    return (
      <button
        disabled
        className={`w-full py-3 px-4 rounded-lg font-semibold bg-gray-300 text-gray-500 cursor-not-allowed ${className}`}
      >
        {t('payment.checkout.loading')}
      </button>
    );
  }

  const finalAmount = customAmount || pricing.finalPrice;
  const displayText = children || `${t('payment.checkout.pay')} ${formatPrice(finalAmount, pricing.currency)}`;

  return (
    <div className="w-full">
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
          loading
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } ${className}`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {t('payment.checkout.processing')}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="mr-2">{getProviderIcon(paymentProvider)}</span>
            {displayText}
          </div>
        )}
      </button>
    </div>
  );
}
