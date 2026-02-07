'use client';

import React from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Responsive Grid Component
 * 
 * Provides consistent responsive grid layouts for all user-facing pages.
 * Automatically adapts columns based on screen size.
 * 
 * @example
 * <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="lg">
 *   {items.map(item => <Card key={item.id} />)}
 * </ResponsiveGrid>
 */
export default function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = ''
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-5',
    lg: 'gap-4 sm:gap-6',
    xl: 'gap-6 sm:gap-8'
  };

  // Generate grid column classes - using explicit combinations for Tailwind JIT
  const getGridClasses = (): string => {
    const mobile = cols.mobile || 1;
    const tablet = cols.tablet || 2;
    const desktop = cols.desktop || 3;

    // Explicit class combinations for Tailwind JIT compiler
    const combinations: Record<string, string> = {
      '1-1-1': 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-1',
      '1-1-2': 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-2',
      '1-1-3': 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-3',
      '1-2-2': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2',
      '1-2-3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      '1-2-4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      '1-3-3': 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-3',
      '1-3-4': 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-4',
      '2-2-2': 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-2',
      '2-2-3': 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3',
      '2-3-3': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3',
      '2-3-4': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
      '2-4-4': 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-4',
    };

    const key = `${mobile}-${tablet}-${desktop}`;
    return combinations[key] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  };

  return (
    <div className={`grid ${getGridClasses()} ${gapClasses[gap]} w-full ${className}`}>
      {children}
    </div>
  );
}

