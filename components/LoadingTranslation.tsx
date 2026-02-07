import React from 'react';

export default function LoadingTranslation() {
  return (
    <div className="flex items-center justify-center min-h-[100px] text-gray-500">
      <div className="flex flex-col items-center space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
        <div className="text-sm">Loading translations...</div>
      </div>
    </div>
  );
} 
