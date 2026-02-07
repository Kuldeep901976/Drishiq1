'use client';

import { useState, useEffect } from 'react';
import { AUTH_CONFIG } from '@/lib/auth-config';

export default function AuthConfigPage() {
  const [config, setConfig] = useState(AUTH_CONFIG);
  const [saved, setSaved] = useState(false);

  const updateConfig = (path: string, value: any) => {
    const pathArray = path.split('.');
    const newConfig = { ...config };
    let current: any = newConfig;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    current[pathArray[pathArray.length - 1]] = value;
    setConfig(newConfig);
  };

  const handleSave = () => {
    // In a real app, you'd save this to a database or config file
    localStorage.setItem('drishiq-auth-config', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setConfig(AUTH_CONFIG);
    localStorage.removeItem('drishiq-auth-config');
  };

  useEffect(() => {
    const savedConfig = localStorage.getItem('drishiq-auth-config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Failed to parse saved config');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#0B4422]">
              Authentication Configuration
            </h1>
            <div className="space-x-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset to Default
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#0B4422] text-white rounded-lg hover:bg-[#083318] transition-colors"
              >
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Social Login Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#0B4422]">Social Login</h2>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.social.enabled}
                    onChange={(e) => updateConfig('social.enabled', e.target.checked)}
                    className="rounded border-gray-300 text-[#0B4422] focus:ring-[#0B4422]"
                  />
                  <span className="text-sm text-gray-600">Enable Social Login</span>
                </label>
              </div>
              
              {config.social.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(config.social.providers).map(([key, provider]) => (
                    <div key={key} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{key}</span>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={provider.enabled}
                            onChange={(e) => updateConfig(`social.providers.${key}.enabled`, e.target.checked)}
                            className="rounded border-gray-300 text-[#0B4422] focus:ring-[#0B4422]"
                          />
                          <span className="text-xs text-gray-500">Enable</span>
                        </label>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Name: {provider.name}</div>
                        <div>Color: <span className="inline-block w-4 h-4 rounded" style={{backgroundColor: provider.color}}></span> {provider.color}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Magic Link Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#0B4422]">Magic Link</h2>
                  <p className="text-sm text-gray-600">Email-based signup with OTP</p>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.magicLink.enabled}
                    onChange={(e) => updateConfig('magicLink.enabled', e.target.checked)}
                    className="rounded border-gray-300 text-[#0B4422] focus:ring-[#0B4422]"
                  />
                  <span className="text-sm text-gray-600">Enable</span>
                </label>
              </div>
            </div>

            {/* Password Signup Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#0B4422]">Password Signup</h2>
                  <p className="text-sm text-gray-600">Traditional email + password registration</p>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.passwordSignup.enabled}
                    onChange={(e) => updateConfig('passwordSignup.enabled', e.target.checked)}
                    className="rounded border-gray-300 text-[#0B4422] focus:ring-[#0B4422]"
                  />
                  <span className="text-sm text-gray-600">Enable</span>
                </label>
              </div>
            </div>

            {/* Invitation Flow Section */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#0B4422]">Invitation Flow</h2>
                  <p className="text-sm text-gray-600">Organizer-invited user registration</p>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.invitation.enabled}
                    onChange={(e) => updateConfig('invitation.enabled', e.target.checked)}
                    className="rounded border-gray-300 text-[#0B4422] focus:ring-[#0B4422]"
                  />
                  <span className="text-sm text-gray-600">Enable</span>
                </label>
              </div>
            </div>

            {/* UI Configuration Section */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-[#0B4422] mb-4">UI Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.ui.showSeparators}
                      onChange={(e) => updateConfig('ui.showSeparators', e.target.checked)}
                      className="rounded border-gray-300 text-[#0B4422] focus:ring-[#0B4422]"
                    />
                    <span className="text-sm text-gray-600">Show separators between methods</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.ui.showDescriptions}
                      onChange={(e) => updateConfig('ui.showDescriptions', e.target.checked)}
                      className="rounded border-gray-300 text-[#0B4422] focus:ring-[#0B4422]"
                    />
                    <span className="text-sm text-gray-600">Show method descriptions</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Size
                  </label>
                  <select
                    value={config.ui.buttonSize}
                    onChange={(e) => updateConfig('ui.buttonSize', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#0B4422] focus:border-[#0B4422]"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Columns
                  </label>
                  <select
                    value={config.ui.maxColumns}
                    onChange={(e) => updateConfig('ui.maxColumns', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#0B4422] focus:border-[#0B4422]"
                  >
                    <option value={1}>1 Column</option>
                    <option value={2}>2 Columns</option>
                    <option value={3}>3 Columns</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Configuration Preview</h3>
            <p className="text-sm text-blue-700">
              Current enabled methods: {getEnabledSignupMethods().length} method(s)
            </p>
            <p className="text-sm text-blue-700">
              Social providers: {getEnabledProviders().length} provider(s)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions (same as in auth-config.ts)
function getEnabledProviders() {
  if (!AUTH_CONFIG.social.enabled) return [];
  
  return Object.entries(AUTH_CONFIG.social.providers)
    .filter(([_, config]) => config.enabled)
    .map(([key, config]) => ({
      key: key as 'google' | 'facebook' | 'linkedin',
      ...config
    }));
}

function getEnabledSignupMethods() {
  const methods = [];
  
  if (AUTH_CONFIG.social.enabled) {
    methods.push({ type: 'social' });
  }
  
  if (AUTH_CONFIG.magicLink.enabled) {
    methods.push({ type: 'magicLink' });
  }
  
  if (AUTH_CONFIG.passwordSignup.enabled) {
    methods.push({ type: 'password' });
  }
  
  if (AUTH_CONFIG.invitation.enabled) {
    methods.push({ type: 'invitation' });
  }
  
  return methods;
}
