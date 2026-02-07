'use client';

import { UserFriendlyError } from '@/lib/user-friendly-errors';
import React from 'react';
import { Alert } from './DrishiqUI';
import { Lightbulb } from 'lucide-react';

interface UserFriendlyAlertProps {
  error: UserFriendlyError | null;
  onAction?: () => void;
  onClose?: () => void;
  className?: string;
}

export const UserFriendlyAlert: React.FC<UserFriendlyAlertProps> = ({
  error,
  onAction,
  onClose,
  className = ''
}) => {
  if (!error) return null;

  const getIcon = (severity: UserFriendlyError['severity']) => {
    switch (severity) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <Alert 
      variant={error.severity} 
      onClose={onClose}
      className={className}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 mt-0.5">
          {getIcon(error.severity)}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium mb-1">
            {error.title}
          </h3>
          <p className="text-sm mb-2">
            {error.message}
          </p>
          {error.suggestion && (
            <p className="text-sm opacity-75 mb-3 flex items-start gap-1">
              <Lightbulb size={14} className="flex-shrink-0 mt-0.5" /> {error.suggestion}
            </p>
          )}
          {error.action && onAction && (
            <button
              onClick={onAction}
              className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
            >
              {error.action}
            </button>
          )}
        </div>
      </div>
    </Alert>
  );
};

// ===== SPECIALIZED ALERT COMPONENTS =====

interface ErrorAlertProps {
  error: any;
  context?: string;
  onAction?: () => void;
  onClose?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  context,
  onAction,
  onClose,
  className
}) => {
  const { mapErrorToUserFriendly } = require('@/lib/user-friendly-errors');
  const userFriendlyError = mapErrorToUserFriendly(error, { page: context });
  
  return (
    <UserFriendlyAlert
      error={userFriendlyError}
      onAction={onAction}
      onClose={onClose}
      className={className}
    />
  );
};

// ===== TOAST-STYLE ALERT =====

interface ToastAlertProps {
  error: UserFriendlyError | null;
  onAction?: () => void;
  onClose?: () => void;
  duration?: number;
}

export const ToastAlert: React.FC<ToastAlertProps> = ({
  error,
  onAction,
  onClose,
  duration = 5000
}) => {
  React.useEffect(() => {
    if (error && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [error, duration, onClose]);

  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <UserFriendlyAlert
        error={error}
        onAction={onAction}
        onClose={onClose}
        className="shadow-lg"
      />
    </div>
  );
};

// ===== INLINE ERROR DISPLAY =====

interface InlineErrorProps {
  error: UserFriendlyError | null;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  error,
  className = ''
}) => {
  if (!error) return null;

  return (
    <div className={`text-sm ${className}`}>
      <div className="flex items-center">
        <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span className="text-red-600">{error.message}</span>
      </div>
      {error.suggestion && (
        <p className="text-xs text-gray-500 mt-1 ml-6">
          {error.suggestion}
        </p>
      )}
    </div>
  );
}; 
