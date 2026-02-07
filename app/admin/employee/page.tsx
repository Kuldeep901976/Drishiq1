'use client';

import { useState } from 'react';

export default function EmployeeDashboard() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Employee Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            Welcome to your employee workspace. Access your assigned tasks and tools.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Tasks</h3>
              <p className="text-blue-700">View and manage your assigned tasks</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-green-900 mb-2">Reports</h3>
              <p className="text-green-700">Generate and view reports</p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-purple-900 mb-2">Tools</h3>
              <p className="text-purple-700">Access your work tools</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
