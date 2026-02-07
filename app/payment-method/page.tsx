'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { CheckCircle, CreditCard, Smartphone } from 'lucide-react';
import { useLanguage } from '@/lib/drishiq-i18n';

function PaymentMethodContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage(['payment', 'common']);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const amount = searchParams.get('amount');
  const description = searchParams.get('description');
  const supporterName = searchParams.get('supporter_name');
  const supporterEmail = searchParams.get('supporter_email');
  const supportLevel = searchParams.get('support_level');
  const purpose = searchParams.get('purpose') || 'support';

  const paymentMethods = [
    {
      id: 'paypal',
      name: t('payment.method.paypal.name'),
      description: t('payment.method.paypal.description'),
      icon: '💳',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      selectedColor: 'bg-blue-100 border-blue-400',
    },
    {
      id: 'cashfree',
      name: t('payment.method.cashfree.name'),
      description: t('payment.method.cashfree.description'),
      icon: '📱',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      selectedColor: 'bg-green-100 border-green-400',
    }
  ];

  const handlePaymentMethodSelect = async () => {
    if (!selectedMethod) return;
    
    setIsProcessing(true);
    
    try {
      // Create payment order
      const orderResponse = await fetch('/api/support/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          support_level: supportLevel,
          amount: amount,
          supporter_name: supporterName,
          supporter_email: supporterEmail,
          supporter_phone: '',
          country_code: 'IN',
          purpose: purpose,
          payment_method: selectedMethod
        }),
      });

      const orderResult = await orderResponse.json();

      if (orderResponse.ok && orderResult.success) {
        // Redirect to payment provider
        const paymentData = orderResult.payment_data;
        
        if (selectedMethod === 'paypal') {
          // Redirect to PayPal
          window.location.href = paymentData.links.find((link: any) => link.rel === 'approve')?.href || '#';
        } else if (selectedMethod === 'cashfree') {
          // Redirect to Cashfree
          window.location.href = paymentData.payment_url;
        }
      } else {
        alert(orderResult.error || 'Failed to create payment order. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-emerald-50 flex items-center justify-center py-8">
      <div className="max-w-2xl w-full mx-auto p-8">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">💚</span>
            </div>
            <h1 className="text-4xl font-bold text-[#0B4422] mb-4">
              {t('payment.method.title')}
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              {t('payment.method.subtitle').replace('{purpose}', purpose === 'gift' ? t('payment.method.gift') : t('payment.method.support'))}
            </p>
          </div>

          {/* Support Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-green-800">
                {purpose === 'gift' ? t('payment.method.summary.giftContribution') : t('payment.method.summary.supportContribution')}
              </h2>
              <span className="text-2xl font-bold text-green-600">
                ₹{amount}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-600">{t('payment.method.summary.name')}:</span>
                <p className="font-medium">{supporterName}</p>
              </div>
              <div>
                <span className="text-green-600">{t('payment.method.summary.email')}:</span>
                <p className="font-medium">{supporterEmail}</p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4 mb-8">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full p-6 rounded-xl border-2 transition-all duration-200 ${
                  selectedMethod === method.id
                    ? method.selectedColor
                    : method.color
                }`}
              >
                <div className="flex items-center">
                  <div className="text-3xl mr-4">{method.icon}</div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {method.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {method.description}
                    </p>
                  </div>
                  {selectedMethod === method.id && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Continue Button */}
          <button
            onClick={handlePaymentMethodSelect}
            disabled={!selectedMethod || isProcessing}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {t('payment.method.processing')}
              </div>
            ) : (
              t('payment.method.continue').replace('{method}', selectedMethod ? paymentMethods.find(m => m.id === selectedMethod)?.name || '' : 'Payment Method')
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('payment.method.security')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentMethodPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment methods...</p>
        </div>
      </div>
    }>
      <PaymentMethodContent />
    </Suspense>
  );
}

