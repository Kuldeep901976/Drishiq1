'use client';

import React from 'react';

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  border?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

/**
 * Responsive Card Component
 * 
 * Provides consistent responsive card styling for all user-facing pages.
 * Automatically adapts to different screen sizes.
 * 
 * @example
 * <ResponsiveCard padding="lg" shadow="xl" hover onClick={handleClick}>
 *   <CardContent />
 * </ResponsiveCard>
 */
export default function ResponsiveCard({
  children,
  className = '',
  padding = 'md',
  shadow = 'lg',
  rounded = '2xl',
  border = true,
  hover = false,
  onClick
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: 'p-4 sm:p-5',
    md: 'p-6 sm:p-8',
    lg: 'p-6 sm:p-8 lg:p-10'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl'
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl'
  };

  const baseClasses = `bg-white ${paddingClasses[padding]} ${shadowClasses[shadow]} ${roundedClasses[rounded]} ${border ? 'border border-gray-200' : ''} ${hover ? 'hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer' : ''} ${onClick ? 'cursor-pointer' : ''}`;

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={`${baseClasses} ${className}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {children}
    </Component>
  );
}

