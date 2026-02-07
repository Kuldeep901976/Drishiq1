'use client';

import { useState } from 'react';

export default function AdminAffiliatePage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Affiliate Management
          </h1>
          <p className="text-gray-600 mb-6">
            Manage affiliate programs, commissions, and partner relationships.
          </p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium mb-2">Affiliate System Coming Soon</h3>
              <p className="text-sm">
                This module is under development. It will include affiliate tracking, 
                commission management, and partner analytics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
