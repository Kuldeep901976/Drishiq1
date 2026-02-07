'use client';

import React, { useState, useEffect } from 'react';

const styles = [
  {
    name: 'Classic',
    file: '/styles/style-classic.css',
    description: 'Traditional & Comfortable',
    icon: '🎨', // Classic palette
    color: '#0B4422'
  },
  {
    name: 'Clean',
    file: '/styles/style-cleanrefined.css',
    description: 'Minimal & Professional',
    icon: '✨', // Clean sparkle
    color: '#0B4422'
  },
  {
    name: 'Elevated',
    file: '/styles/style-drishelevated.css',
    description: 'Modern & Dynamic',
    icon: '🚀', // Elevated rocket
    color: '#0B4422'
  }
];

export default function StyleSwitcher() {
  const [currentStyleIndex, setCurrentStyleIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Load saved style preference on mount
  useEffect(() => {
    const savedStyle = localStorage.getItem('drishiq-style');
    if (savedStyle) {
      const styleIndex = styles.findIndex(style => style.name === savedStyle);
      if (styleIndex !== -1) {
        setCurrentStyleIndex(styleIndex);
      }
    }
  }, []);

  // Apply the current style
  useEffect(() => {
    // Remove any existing style links
    const existingLinks = document.querySelectorAll('link[data-style-switcher]');
    existingLinks.forEach(link => link.remove());

    // Add the current style
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = styles[currentStyleIndex].file;
    link.setAttribute('data-style-switcher', 'true');
    document.head.appendChild(link);

    // Save preference
    localStorage.setItem('drishiq-style', styles[currentStyleIndex].name);
  }, [currentStyleIndex]);

  const nextStyle = () => {
    setCurrentStyleIndex((prevIndex) => (prevIndex + 1) % styles.length);
    setIsOpen(false);
  };

  const selectStyle = (index: number) => {
    setCurrentStyleIndex(index);
    setIsOpen(false);
  };

  const currentStyle = styles[currentStyleIndex];

  return (
    <>
      {/* Floating Style Switcher Button */}
      <div className="fixed bottom-0 right-6 z-50 transform translate-y-1/2">
        <div className="relative">
          {/* Style Options Panel */}
          {isOpen && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 min-w-[280px] animate-fade-in">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Choose Your Style</h3>
                <p className="text-sm text-gray-600">Select your preferred interface</p>
              </div>
              
              <div className="space-y-3">
                {styles.map((style, index) => (
                  <button
                    key={style.name}
                    onClick={() => selectStyle(index)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                      index === currentStyleIndex
                        ? 'bg-green-100 border-2 border-green-500 shadow-md'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-2xl">{style.icon}</div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-800">{style.name}</div>
                      <div className="text-sm text-gray-600">{style.description}</div>
                    </div>
                    {index === currentStyleIndex && (
                      <div className="text-green-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={nextStyle}
                  className="w-full bg-[#0B4422] text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Quick Switch to Next Style
                </button>
              </div>
            </div>
          )}

          {/* Main Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-14 h-14 bg-white rounded-full shadow-lg border-2 border-gray-200 flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-105"
            title={`Current: ${currentStyle.name} - ${currentStyle.description}`}
          >
            <div className="text-2xl">{currentStyle.icon}</div>
          </button>
        </div>
      </div>

      {/* Overlay to close panel when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
} 
