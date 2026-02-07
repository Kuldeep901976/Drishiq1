'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import HeaderUpdated from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/drishiq-i18n';
import { CreditCard, Building2, Smartphone } from 'lucide-react';

interface PaymentDetails {
  service_id: string;
  service_name: string;
  amount: number;
  credits: number;
  currency: string;
  user_name: string;
  user_email: string;
  country_code: string;
}

export default function PaymentProcess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage(['payment', 'common']);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentDetails();
  }, []);

  const loadPaymentDetails = () => {
    const details: PaymentDetails = {
      service_id: searchParams.get('service_id') || '',
      service_name: searchParams.get('service_name') || '',
      amount: parseFloat(searchParams.get('amount') || '0'),
      credits: parseInt(searchParams.get('credits') || '0'),
      currency: searchParams.get('currency') || 'INR',
      user_name: searchParams.get('user_name') || '',
      user_email: searchParams.get('user_email') || '',
      country_code: searchParams.get('country_code') || 'IN'
    };

    setPaymentDetails(details);
    setLoading(false);
  };

  const handlePayment = async () => {
    if (!paymentDetails) return;

    setProcessing(true);
    setError(null);

    try {
      // Create payment order
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: paymentDetails.service_id,
          service_name: paymentDetails.service_name,
          amount: paymentDetails.amount,
          user_name: paymentDetails.user_name,
          user_email: paymentDetails.user_email,
          country_code: paymentDetails.country_code,
          credits: paymentDetails.credits
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Redirect to payment provider
        if (result.payment_provider === 'paypal') {
          window.location.href = result.payment_data.links.find((link: any) => link.rel === 'approve')?.href || '#';
        } else if (result.payment_provider === 'cashfree') {
          window.location.href = result.payment_data.payment_url;
        } else if (result.payment_provider === 'phonepe') {
          window.location.href = result.payment_data.payment_url;
        } else {
          throw new Error('Unsupported payment provider');
        }
      } else {
        setError(result.error || 'Failed to create payment order');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('payment.process.loading')}</p>
        </div>
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
            <p className="font-bold">{t('payment.process.error')}</p>
            <p className="text-sm">{t('payment.process.invalidDetails')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <HeaderUpdated />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CreditCard size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('payment.process.title')}
              </h1>
              <p className="text-gray-600">
                {t('payment.process.subtitle')}
              </p>
            </div>

            {/* Service Summary */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('payment.process.serviceDetails')}
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('payment.process.service')}:</span>
                  <span className="font-medium">{paymentDetails.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('payment.process.amount')}:</span>
                  <span className="font-medium text-emerald-600">
                    ₹{paymentDetails.amount.toLocaleString()}
                  </span>
                </div>
                {paymentDetails.credits > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('payment.process.credits')}:</span>
                    <span className="font-medium">{paymentDetails.credits}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('payment.process.currency')}:</span>
                  <span className="font-medium">{paymentDetails.currency}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('payment.process.paymentMethodsAvailable')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <CreditCard size={24} className="text-blue-600" />
                  </div>
                  <div className="font-medium">{t('payment.process.paypal.name')}</div>
                  <div className="text-sm text-gray-500">{t('payment.process.paypal.description')}</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <Building2 size={24} className="text-emerald-600" />
                  </div>
                  <div className="font-medium">{t('payment.process.cashfree.name')}</div>
                  <div className="text-sm text-gray-500">{t('payment.process.cashfree.description')}</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <Smartphone size={24} className="text-purple-600" />
                  </div>
                  <div className="font-medium">{t('payment.process.phonepe.name')}</div>
                  <div className="text-sm text-gray-500">{t('payment.process.phonepe.description')}</div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                <p className="font-medium">{t('payment.process.paymentError')}</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Payment Button */}
            <div className="text-center">
              <button
                onClick={handlePayment}
                disabled={processing}
                className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {processing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {t('payment.process.processing')}
                  </div>
                ) : (
                  t('payment.process.proceedToPayment')
                )}
              </button>
            </div>

            {/* Security Notice */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                {t('payment.process.security')}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
