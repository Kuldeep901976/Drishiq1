'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Loading component for charts
const ChartLoading = ({ height = 300 }: { height?: number }) => (
  <div 
    className="flex items-center justify-center bg-gray-50 rounded-lg animate-pulse"
    style={{ height }}
  >
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B4422] mx-auto mb-2"></div>
      <p className="text-gray-400 text-sm">Loading chart...</p>
    </div>
  </div>
);

// Dynamic imports with loading states - reduces initial bundle by ~150KB
export const TimeSeriesChart = dynamic(
  () => import('./TimeSeriesChart'),
  { 
    loading: () => <ChartLoading />,
    ssr: false 
  }
);

export const MultiSeriesChart = dynamic(
  () => import('./MultiSeriesChart'),
  { 
    loading: () => <ChartLoading />,
    ssr: false 
  }
);

// Re-export types for convenience
export type { TimeSeriesDataPoint } from './TimeSeriesChart';
export type { MultiSeriesDataPoint } from './MultiSeriesChart';
