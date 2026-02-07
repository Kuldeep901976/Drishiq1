'use client';

import React, { Suspense } from 'react';
import CreatePasswordForm from '@/components/CreatePasswordForm';
import Footer from '@/components/Footer';

function CreatePasswordContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-8 pt-10 pb-6 text-center">
              <h1 className="text-3xl font-bold text-[#0B4422] mb-2">
                Create Your Password
              </h1>
              <p className="text-gray-600 text-sm">
                Set a secure password for your account
              </p>
            </div>

            <div className="px-8 pb-8">
              <CreatePasswordForm 
                redirectUrl="/profile?source=signup"
                checkExistingUser={true}
                minPasswordLength={8}
                signInUrl="/signin"
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CreatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422]"></div>
      </div>
    }>
      <CreatePasswordContent />
    </Suspense>
  );
}





