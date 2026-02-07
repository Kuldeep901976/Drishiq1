'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useLanguage } from '@/lib/drishiq-i18n';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

interface PaymentSuccessProps {
  onComplete?: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ onComplete }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage(['payment', 'common']);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const orderId = searchParams.get('orderId');
        const transactionId = searchParams.get('transactionId');
        const provider = searchParams.get('provider');

        if (!orderId && !transactionId) {
          setError(t('payment.verification.failed'));
          setLoading(false);
          return;
        }

        // Verify payment status
        let verificationResponse;
        
        if (provider === 'phonepe') {
          verificationResponse = await fetch(
            `/api/payment/phonepe/callback?merchantTransactionId=${transactionId}`
          );
        } else if (provider === 'paypal') {
          verificationResponse = await fetch(
            `/api/payment/paypal/callback?orderId=${orderId}`
          );
        } else {
          setError(t('payment.verification.failed'));
          setLoading(false);
          return;
        }

        const verificationData = await verificationResponse.json();

        if (verificationData.success) {
          setPaymentData(verificationData);
          
          // Call completion callback
          onComplete?.();
        } else {
          setError(verificationData.error || t('payment.verification.failed'));
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError(t('payment.verification.failed'));
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, onComplete]);

  const handleContinue = () => {
    // Redirect to dashboard or main app
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('payment.verification.verifying')}</h2>
          <p className="text-gray-600">{t('payment.verification.pleaseWait')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('payment.verification.failed')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {t('payment.verification.tryAgain')}
            </button>
            <button
              onClick={() => router.push('/support')}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {t('payment.verification.contactSupport')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('payment.verification.successful')}</h2>
        <p className="text-gray-600 mb-6">
          {t('payment.verification.activated')}
        </p>

        {paymentData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">{t('payment.verification.paymentDetails')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('payment.verification.transactionId')}</span>
                <span className="font-mono text-xs">{paymentData.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('payment.verification.amount')}</span>
                <span className="font-semibold">
                  {paymentData.currency === 'INR' ? '₹' : '$'}{paymentData.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('payment.verification.status')}</span>
                <span className="text-green-600 font-semibold capitalize">{paymentData.status}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleContinue}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
          >
            {t('payment.verification.continueToDrishiq')}
          </button>
          
          <div className="text-sm text-gray-500">
            <p>{t('payment.verification.confirmationEmail')}</p>
            <p>{t('payment.verification.questions')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
