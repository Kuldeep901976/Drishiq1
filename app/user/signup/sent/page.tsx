'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

function MagicLinkSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          {/* Logo */}
          <div className="mb-6">
            <Image
              src="/assets/logo/Logo.png"
              alt="DrishiQ Logo"
              width={180}
              height={80}
              className="h-16 w-auto mx-auto"
              priority
            />
          </div>

          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-[#0B4422] mb-4">
            Check Your Email
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            We've sent a magic link to{' '}
            <span className="font-semibold text-gray-800">{email}</span>
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">Next Steps:</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Check your email inbox (and spam folder)</li>
              <li>2. Click the magic link in the email</li>
              <li>3. Complete your profile setup</li>
              <li>4. Start using DrishiQ!</li>
            </ol>
          </div>

          {/* Resend Option */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">
              Didn't receive the email?
            </p>
            <Link
              href="/invitation"
              className="text-[#0B4422] hover:text-[#083318] underline font-medium"
            >
              Request Invitation
            </Link>
          </div>

          {/* Back to Sign In */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/user/signin"
                className="text-[#0B4422] hover:text-[#083318] underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MagicLinkSentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MagicLinkSentContent />
    </Suspense>
  );
}
