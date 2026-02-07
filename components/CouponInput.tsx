'use client';

import { useState } from 'react';

interface CouponInputProps {
  onCouponApplied: (coupon: {
    id: string;
    code: string;
    discount_amount: number;
    final_amount: number;
  }) => void;
  onCouponRemoved: () => void;
  orderAmount: number;
  userId?: string;
}

export default function CouponInput({
  onCouponApplied,
  onCouponRemoved,
  orderAmount,
  userId
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const handleValidate = async () => {
    if (!code.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          user_id: userId || null,
          order_amount: orderAmount
        })
      });

      const data = await response.json();

      if (data.success && data.valid) {
        setAppliedCoupon(data.coupon);
        onCouponApplied({
          id: data.coupon.id,
          code: data.coupon.code,
          discount_amount: data.coupon.calculated_discount || 0,
          final_amount: data.coupon.final_amount || orderAmount
        });
        setError(null);
      } else {
        // Friendly, actionable error messages
        let errorMessage = data.error || 'Invalid coupon code';
        
        // Make error messages more helpful
        if (errorMessage.includes('expired')) {
          errorMessage = 'This coupon has expired. Please check the validity dates.';
        } else if (errorMessage.includes('limit reached')) {
          errorMessage = 'This coupon has reached its usage limit. Try a different coupon.';
        } else if (errorMessage.includes('already used')) {
          errorMessage = 'You have already used this coupon. Each coupon can only be used once per customer.';
        } else if (errorMessage.includes('Minimum order')) {
          errorMessage = errorMessage + ' Please add more items to your cart to use this coupon.';
        } else if (errorMessage.includes('Invalid coupon code')) {
          errorMessage = 'The coupon code you entered is not valid. Please check for typos and try again.';
        }
        
        setError(errorMessage);
        setAppliedCoupon(null);
        onCouponRemoved();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate coupon');
      setAppliedCoupon(null);
      onCouponRemoved();
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setAppliedCoupon(null);
    setError(null);
    onCouponRemoved();
  };

  if (appliedCoupon) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-emerald-800">
              Coupon Applied: {appliedCoupon.code}
            </div>
            <div className="text-sm text-emerald-600 mt-1">
              You saved ${appliedCoupon.calculated_discount?.toFixed(2) || '0.00'}
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Have a coupon code?
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          className="flex-1 border rounded-lg px-4 py-2 font-mono"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleValidate();
            }
          }}
        />
        <button
          onClick={handleValidate}
          disabled={loading || !code.trim()}
          className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Validating...' : 'Apply'}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}

