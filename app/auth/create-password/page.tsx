'use client';

import React, { Suspense } from 'react';
import CreatePasswordForm from '@/components/CreatePasswordForm';
import LogoHeader from '@/components/LogoHeader';

function CreatePasswordContent() {
  return (
    <div className="auth-page-container">
      <div className="auth-form-container">
        {/* Logo and Header */}
        <div className="auth-header">
          <LogoHeader />
          
          <h1 className="auth-title">
            Create Your Password
          </h1>
          <p className="auth-subtitle">
            Set a secure password for your account
          </p>
        </div>

        <CreatePasswordForm 
          redirectUrl="/user/profile"
          checkExistingUser={false}
          minPasswordLength={6}
          signInUrl="/user/signin"
        />
      </div>
    </div>
  );
}

export default function CreatePasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatePasswordContent />
    </Suspense>
  );
}

