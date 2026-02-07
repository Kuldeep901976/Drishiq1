'use client';

import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ProviderLinkResolverDialogProps, 
  LinkNeededInfo, 
  AuthError 
} from './types';

export default function ProviderLinkResolverDialog({
  isOpen,
  onClose,
  linkInfo,
  onResolve
}: ProviderLinkResolverDialogProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [resolutionStep, setResolutionStep] = useState<'confirm' | 'linking' | 'success'>('confirm');

  const getProviderDisplayName = (type: string) => {
    switch (type) {
      case 'phone':
        return 'Phone Number';
      case 'email':
        return 'Email Address';
      case 'social':
        return 'Social Account';
      default:
        return type;
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return '📱';
      case 'email':
        return '📧';
      case 'social':
        return '🔗';
      default:
        return '❓';
    }
  };

  const handleResolve = useCallback(async () => {
    if (!linkInfo) return;

    setIsResolving(true);
    setError(null);
    setResolutionStep('linking');

    try {
      // Call the parent's resolve function
      await onResolve(linkInfo.type, linkInfo.identifier);
      
      setResolutionStep('success');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error: any) {
      setError({
        code: 'LINKING_FAILED',
        message: error.message || 'Failed to link accounts'
      });
      setResolutionStep('confirm');
    } finally {
      setIsResolving(false);
    }
  }, [linkInfo, onResolve, onClose]);

  const handleClose = useCallback(() => {
    if (isResolving) return; // Prevent closing while resolving
    onClose();
  }, [isResolving, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Dialog */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            {resolutionStep === 'confirm' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">⚠️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Account Already Exists
                    </h3>
                    <p className="text-sm text-gray-500">
                      We found an account with different credentials
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getProviderIcon(linkInfo.type)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getProviderDisplayName(linkInfo.type)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {linkInfo.identifier}
                      </p>
                    </div>
                  </div>

                  {linkInfo.suggestedProvider && (
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">💡</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Suggested Action
                        </p>
                        <p className="text-sm text-gray-600">
                          Link this {linkInfo.suggestedProvider} account to your existing profile
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 text-lg">ℹ️</span>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">What happens next?</p>
                      <ul className="mt-1 space-y-1 text-blue-700">
                        <li>• Your accounts will be securely linked</li>
                        <li>• You can sign in with either method</li>
                        <li>• All your data will be preserved</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {resolutionStep === 'linking' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Linking Accounts
                </h3>
                <p className="text-sm text-gray-600">
                  Please wait while we securely link your accounts...
                </p>
              </div>
            )}

            {resolutionStep === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Accounts Linked Successfully!
                </h3>
                <p className="text-sm text-gray-600">
                  You can now sign in with either method
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <div className="flex items-start space-x-3">
                  <span className="text-red-600 text-lg">❌</span>
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Linking Failed</p>
                    <p className="text-red-700">{error.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {resolutionStep === 'confirm' && (
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="button"
                onClick={handleResolve}
                disabled={isResolving}
                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
              >
                {isResolving ? 'Linking...' : 'Link Accounts'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isResolving}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          )}

          {resolutionStep === 'success' && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  This dialog will close automatically...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
