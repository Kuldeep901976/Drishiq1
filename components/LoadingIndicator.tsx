import React from 'react';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dots' | 'spinner' | 'pulse';
  className?: string;
}

export default function LoadingIndicator({ 
  message = 'Loading...', 
  size = 'md',
  variant = 'dots',
  className = ''
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2', 
    lg: 'w-3 h-3'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const renderDots = () => (
    <div className="flex space-x-2">
      <div 
        className={`${sizeClasses[size]} bg-[#0B4422] rounded-full animate-bounce`} 
        style={{ animationDelay: '0ms' }}
      ></div>
      <div 
        className={`${sizeClasses[size]} bg-[#0B4422] rounded-full animate-bounce`} 
        style={{ animationDelay: '150ms' }}
      ></div>
      <div 
        className={`${sizeClasses[size]} bg-[#0B4422] rounded-full animate-bounce`} 
        style={{ animationDelay: '300ms' }}
      ></div>
    </div>
  );

  const renderSpinner = () => (
    <div className={`${sizeClasses[size]} border-2 border-gray-200 border-t-[#0B4422] rounded-full animate-spin`}></div>
  );

  const renderPulse = () => (
    <div className={`${sizeClasses[size]} bg-[#0B4422] rounded-full animate-pulse`}></div>
  );

  const renderVariant = () => {
    switch (variant) {
      case 'spinner':
        return renderSpinner();
      case 'pulse':
        return renderPulse();
      default:
        return renderDots();
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {renderVariant()}
      {message && (
        <p className={`${textSizes[size]} text-gray-500 font-medium`}>
          {message}
        </p>
      )}
    </div>
  );
}

// Specialized components for common use cases
export function RedirectingIndicator({ message = 'Redirecting...', className = '' }) {
  return (
    <LoadingIndicator 
      message={message}
      size="md"
      variant="dots"
      className={className}
    />
  );
}

export function LoadingSpinner({ message = 'Loading...', className = '' }) {
  return (
    <LoadingIndicator 
      message={message}
      size="md"
      variant="spinner"
      className={className}
    />
  );
}

export function LoadingPulse({ message = 'Loading...', className = '' }) {
  return (
    <LoadingIndicator 
      message={message}
      size="md"
      variant="pulse"
      className={className}
    />
  );
}
