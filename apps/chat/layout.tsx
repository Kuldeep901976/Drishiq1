// ChatModule layout component

'use client';

import React from 'react';
import { ChatPage } from './page';

export interface ChatLayoutProps {
  children: React.ReactNode;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">DrishiQ</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </a>
              <a
                href="/chat"
                className="text-green-600 hover:text-green-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Chat
              </a>
              <a
                href="/admin"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Admin
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 DrishiQ. All rights reserved.</p>
            <p className="mt-1">Intelligence of Perception</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatLayout;



