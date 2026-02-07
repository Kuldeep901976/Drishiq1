'use client';

import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  background?: 'default' | 'gradient' | 'white' | 'gray';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Responsive Page Container Component
 * 
 * Provides consistent responsive layout for all user-facing pages.
 * Follows the established responsive design patterns.
 * 
 * @example
 * <PageContainer maxWidth="7xl" background="gradient">
 *   <YourPageContent />
 * </PageContainer>
 */
export default function PageContainer({
  children,
  className = '',
  maxWidth = '7xl',
  background = 'default',
  padding = 'md'
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  const backgroundClasses = {
    default: 'bg-gradient-to-br from-green-50 via-white to-green-50',
    gradient: 'bg-gradient-to-br from-slate-50 via-white to-blue-50',
    white: 'bg-white',
    gray: 'bg-gray-50'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4 sm:p-5',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'p-6 sm:p-8 lg:p-12'
  };

  return (
    <div className={`min-h-screen ${backgroundClasses[background]} ${paddingClasses[padding]} ${className}`}>
      <div className={`${maxWidthClasses[maxWidth]} mx-auto w-full`}>
        {children}
      </div>
    </div>
  );
}

