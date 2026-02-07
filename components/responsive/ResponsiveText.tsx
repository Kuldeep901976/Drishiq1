'use client';

import React from 'react';

interface ResponsiveTextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption';
  className?: string;
  color?: 'default' | 'primary' | 'secondary' | 'muted' | 'white';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  breakWords?: boolean;
}

/**
 * Responsive Text Component
 * 
 * Provides consistent responsive typography for all user-facing pages.
 * Automatically scales text size based on screen size.
 * 
 * @example
 * <ResponsiveText variant="h1" color="primary" weight="bold">
 *   Welcome to Your Dashboard
 * </ResponsiveText>
 */
export default function ResponsiveText({
  children,
  variant = 'body',
  className = '',
  color = 'default',
  weight = 'normal',
  align = 'left',
  breakWords = true
}: ResponsiveTextProps) {
  const variantClasses = {
    h1: 'text-2xl sm:text-3xl lg:text-4xl',
    h2: 'text-xl sm:text-2xl lg:text-3xl',
    h3: 'text-lg sm:text-xl lg:text-2xl',
    h4: 'text-base sm:text-lg lg:text-xl',
    body: 'text-base sm:text-lg',
    small: 'text-sm sm:text-base',
    caption: 'text-xs sm:text-sm'
  };

  const colorClasses = {
    default: 'text-gray-900',
    primary: 'text-[#0B4422]',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
    white: 'text-white'
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const baseClasses = `${variantClasses[variant]} ${colorClasses[color]} ${weightClasses[weight]} ${alignClasses[align]} ${breakWords ? 'break-words' : ''}`;

  const Component = variant.startsWith('h') ? variant : 'p';

  return (
    <Component className={`${baseClasses} ${className}`} style={breakWords ? { wordBreak: 'break-word', overflowWrap: 'break-word' } : undefined}>
      {children}
    </Component>
  );
}

