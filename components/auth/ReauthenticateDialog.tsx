'use client';

import React, { useState, useCallback } from 'react';
import { 
  ReauthenticateDialogProps, 
  AuthSuccess, 
  AuthError 
} from './types';
import PhoneCaptureAuth from './PhoneCaptureAuthSimple';
import EmailAuth from './EmailAuth';

export default function ReauthenticateDialog({
  isOpen,
  onClose,
  onSuccess,
  onCancel,
  requiredMethods = ['phone', 'email']
}: ReauthenticateDialogProps) {
  const [activeMethod, setActiveMethod] = useState<'phone' | 'email'>('phone');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSuccess = useCallback((result: AuthSuccess) => {
    setIsAuthenticating(false);
    onSuccess(result);
    onClose();
  }, [onSuccess, onClose]);

  const handleLinkNeeded = useCallback((info: any) => {
    // For reauthentication, we typically don't need linking
    // Just show an error that the account needs to be linked first
    console.warn('Account linking needed during reauthentication:', info);
  }, []);

  const handleCancel = useCallback(() => {
    if (isAuthenticating) return; // Prevent closing during authentication
    onCancel?.();
    onClose();
  }, [isAuthenticating, onCancel, onClose]);

  const handleMethodChange = useCallback((method: 'phone' | 'email') => {
    if (isAuthenticating) return; // Prevent changing during authentication
    setActiveMethod(method);
  }, [isAuthenticating]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleCancel}
        />

        {/* Dialog */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🔒</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Re-authentication Required
                  </h3>
                  <p className="text-sm text-gray-500">
                    Please verify your identity to continue
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isAuthenticating}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Method Selection */}
          {requiredMethods.length > 1 && (
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {requiredMethods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => handleMethodChange(method)}
                    disabled={isAuthenticating}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeMethod === method
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {method === 'phone' ? '📱 Phone' : '📧 Email'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Authentication Content */}
          <div className="px-4 py-6">
            {activeMethod === 'phone' && requiredMethods.includes('phone') && (
              <PhoneCaptureAuth
                onSuccess={handleSuccess}
                onLinkNeeded={handleLinkNeeded}
                onCancel={handleCancel}
                className="border-0 shadow-none p-0"
              />
            )}

            {activeMethod === 'email' && requiredMethods.includes('email') && (
              <EmailAuth
                enablePassword={true}
                enableMagicLink={false}
                socialProviders={[]}
                onSuccess={handleSuccess}
                onLinkNeeded={handleLinkNeeded}
                onCancel={handleCancel}
                className="border-0 shadow-none p-0"
              />
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                This action requires additional verification
              </p>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isAuthenticating}
                className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for easy reauthentication
export function useReauthentication() {
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [reauthMethod, setReauthMethod] = useState<'phone' | 'email'>('phone');

  const requireReauthentication = useCallback((
    method: 'phone' | 'email' = 'phone',
    requiredMethods: ('phone' | 'email')[] = ['phone', 'email']
  ): Promise<AuthSuccess> => {
    return new Promise((resolve, reject) => {
      setIsReauthenticating(true);
      setReauthMethod(method);

      // This would typically be handled by the dialog component
      // For now, we'll just resolve immediately
      resolve({
        user: {} as any,
        session: {} as any,
        provider: method
      });
    });
  }, []);

  const ReauthenticateDialogWrapper = useCallback(({
    isOpen,
    onClose,
    onSuccess,
    onCancel,
    requiredMethods = ['phone', 'email']
  }: Omit<ReauthenticateDialogProps, 'isOpen'> & { isOpen?: boolean }) => (
    <ReauthenticateDialog
      isOpen={isOpen ?? isReauthenticating}
      onClose={() => {
        setIsReauthenticating(false);
        onClose();
      }}
      onSuccess={(result) => {
        setIsReauthenticating(false);
        onSuccess(result);
      }}
      onCancel={() => {
        setIsReauthenticating(false);
        onCancel?.();
      }}
      requiredMethods={requiredMethods}
    />
  ), [isReauthenticating]);

  return {
    isReauthenticating,
    reauthMethod,
    requireReauthentication,
    ReauthenticateDialog: ReauthenticateDialogWrapper
  };
}
