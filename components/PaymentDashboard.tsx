'use client';

import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';

interface PricingPlan {
  id: string;
  plan_code: string;
  plan_name: string;
  plan_description: string;
  base_price_usd: number;
  billing_cycle: string;
  credits_included: number;
  features: string[];
  max_sessions_per_month: number;
  max_users: number;
}

interface CreditBalance {
  user_id: string;
  total_credits: number;
  available_credits: number;
  reserved_credits: number;
  last_updated: string;
}

interface UserSubscription {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  pricing_plans: PricingPlan;
  pricing_regions: {
    region_name: string;
    currency_symbol: string;
  };
}

interface CreditPackage {
  id: string;
  package_code: string;
  package_name: string;
  credits_amount: number;
  bonus_credits: number;
  regional_price: number;
  currency_code: string;
}

export default function PaymentDashboard() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRegion, setUserRegion] = useState('US');

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      
      // Detect user region
      const regionResponse = await fetch('/api/payment/pricing?region=auto');
      const regionData = await regionResponse.json();
      const detectedRegion = regionData.region || 'US';
      setUserRegion(detectedRegion);

      // Load subscription data
      const [subscriptionRes, balanceRes, packagesRes, plansRes] = await Promise.all([
        fetch('/api/payment/subscription'),
        fetch('/api/payment/credits?action=balance'),
        fetch(`/api/payment/pricing?type=credits&region=${detectedRegion}`),
        fetch(`/api/payment/pricing?region=${detectedRegion}`)
      ]);

      if (subscriptionRes.ok) {
        const subData = await subscriptionRes.json();
        setSubscription(subData.data);
      }

      if (balanceRes.ok) {
        const balData = await balanceRes.json();
        setCreditBalance(balData.data);
      }

      if (packagesRes.ok) {
        const packData = await packagesRes.json();
        setCreditPackages(packData.data);
      }

      if (plansRes.ok) {
        const planData = await plansRes.json();
        setPricingPlans(planData.data.plans);
      }

    } catch (error) {
      logger.error('Failed to load payment data');
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      // Subscription functionality disabled in simplified version
      alert('Subscription functionality will be available in the full payment integration. For now, you can purchase credits.');
    } catch (error) {
      setError('Subscription functionality not available');
    }
  };

  const handleBuyCredits = async (packageId: string) => {
    try {
      // Credit purchase functionality disabled in simplified version
      alert('Credit purchase functionality will be available in the full payment integration.');
    } catch (error) {
      setError('Credit purchase functionality not available');
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      const response = await fetch(`/api/payment/subscription?id=${subscription.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await loadPaymentData(); // Reload data
        alert('Subscription will be canceled at the end of the current period');
      } else {
        setError(result.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      setError('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Dashboard</h1>
        <p className="text-gray-600">Manage your subscription and credits</p>
        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Credit Balance Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Credit Balance</h2>
        {creditBalance ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{creditBalance.available_credits}</div>
              <div className="text-sm text-gray-600">Available Credits</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{creditBalance.reserved_credits}</div>
              <div className="text-sm text-gray-600">Reserved Credits</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{creditBalance.total_credits}</div>
              <div className="text-sm text-gray-600">Total Credits</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No credit balance found. Purchase credits to get started.
          </div>
        )}
      </div>

      {/* Current Subscription */}
      {subscription && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Subscription</h2>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{subscription.pricing_plans.plan_name}</h3>
              <p className="text-gray-600">{subscription.pricing_plans.plan_description}</p>
              <p className="text-sm text-gray-500 mt-2">
                Status: <span className={`font-medium ${subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {subscription.status}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
              {subscription.cancel_at_period_end && (
                <p className="text-sm text-orange-600 font-medium">
                  Will be canceled at the end of the current period
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {subscription.pricing_plans.credits_included} credits/month
              </div>
              {!subscription.cancel_at_period_end && (
                <button
                  onClick={handleCancelSubscription}
                  className="mt-2 px-4 py-2 text-sm text-red-600 hover:text-red-800"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Credit Packages */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Buy Credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditPackages.map((pkg) => (
            <div key={pkg.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{pkg.package_name}</h3>
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-blue-600">
                  {pkg.credits_amount + pkg.bonus_credits}
                </div>
                <div className="text-sm text-gray-600">
                  {pkg.credits_amount} + {pkg.bonus_credits} bonus
                </div>
              </div>
              <div className="text-center mb-4">
                <div className="text-xl font-semibold text-gray-900">
                  {pkg.currency_code === 'USD' ? '$' : pkg.currency_code} {pkg.regional_price}
                </div>
              </div>
              <button
                onClick={() => handleBuyCredits(pkg.id)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Buy Credits
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Plans */}
      {!subscription && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pricingPlans.filter(plan => plan.plan_code !== 'free').map((plan) => (
              <div key={plan.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.plan_name}</h3>
                <p className="text-gray-600 mb-4">{plan.plan_description}</p>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600">
                    ${plan.base_price_usd}
                  </div>
                  <div className="text-sm text-gray-600">per {plan.billing_cycle}</div>
                </div>
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Includes:</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• {plan.credits_included} credits per month</li>
                    <li>• Up to {plan.max_sessions_per_month} sessions</li>
                    <li>• {plan.max_users} user{plan.max_users > 1 ? 's' : ''}</li>
                    {plan.features.map((feature, index) => (
                      <li key={index}>• {feature.replace('_', ' ')}</li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
