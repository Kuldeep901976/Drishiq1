export interface PaymentProviderInfo {
  id: string;
  name: string;
  logo: string;
  description?: string;
  processingTime?: string;
  supportedCurrencies: string[];
  fees: {
    percentage: number;
    fixed: number;
  };
}

export function getPaymentProviderInfo(provider: string): PaymentProviderInfo {
  const providers: Record<string, PaymentProviderInfo> = {
    paypal: {
      id: 'paypal',
      name: 'PayPal',
      logo: '/logos/paypal.svg',
      description: 'Secure payment processing',
      processingTime: 'Instant',
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      fees: { percentage: 2.9, fixed: 0.30 }
    },
    cashfree: {
      id: 'cashfree',
      name: 'Cashfree',
      logo: '/logos/cashfree.svg',
      description: 'Indian payment gateway',
      processingTime: '1-2 business days',
      supportedCurrencies: ['INR'],
      fees: { percentage: 2.0, fixed: 0 }
    }
  };
  
  return providers[provider] || providers.paypal;
}
