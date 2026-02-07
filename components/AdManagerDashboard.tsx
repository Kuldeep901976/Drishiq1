'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AdConfig } from '../lib/ad-manager';
import { useAdManager } from '../lib/use-ads';

export default function AdManagerDashboard() {
  const {
    allAds,
    pageSettings,
    addAd,
    removeAd,
    updateAd,
    updatePageSettings,
    clearDismissedAds,
    refreshData
  } = useAdManager();

  const [selectedPage, setSelectedPage] = useState('/');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAd, setEditingAd] = useState<AdConfig | null>(null);

  const [newAd, setNewAd] = useState<Partial<AdConfig>>({
    type: 'banner',
    dismissible: true,
    conditions: {}
  });

  const handleAddAd = () => {
    if (newAd.id && newAd.title && newAd.cta && newAd.link) {
      addAd(newAd as AdConfig);
      setNewAd({ type: 'banner', dismissible: true, conditions: {} });
      setShowAddForm(false);
    }
  };

  const handleUpdatePageSetting = (setting: string, value: any) => {
    const currentSettings = pageSettings[selectedPage] || {};
    updatePageSettings(selectedPage, {
      ...currentSettings,
      [setting]: value
    });
  };

  const handleToggleAd = (adId: string, enabled: boolean) => {
    // This would typically update the ad's enabled status
    updateAd(adId, { conditions: { ...allAds.find(ad => ad.id === adId)?.conditions } });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[#0B4422] mb-2">Ad Manager Dashboard</h1>
          <p className="text-gray-600">Centrally manage all ads across your DrishiQ website</p>
        </div>
        <Link
          href="/admin"
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Admin Dashboard
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#0B4422] text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Add New Ad
          </button>
          <button
            onClick={clearDismissedAds}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Clear User Dismissals
          </button>
          <button
            onClick={refreshData}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Page Settings</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Page:</label>
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              {Object.keys(pageSettings).length > 0 ? (
                Object.keys(pageSettings).map(page => (
                  <option key={page} value={page}>{page}</option>
                ))
              ) : (
                <option value="/">/ (Home)</option>
              )}
            </select>
          </div>

          {(() => {
            const currentSettings = pageSettings[selectedPage] || {};
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Banner Ads:</span>
                  <input
                    type="checkbox"
                    checked={currentSettings.bannerAds || false}
                    onChange={(e) => handleUpdatePageSetting('bannerAds', e.target.checked)}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Header Centered Ad:</span>
                  <input
                    type="checkbox"
                    checked={currentSettings.headerCenteredAd || false}
                    onChange={(e) => handleUpdatePageSetting('headerCenteredAd', e.target.checked)}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Footer Floating Ad:</span>
                  <input
                    type="checkbox"
                    checked={currentSettings.footerFloatingAd || false}
                    onChange={(e) => handleUpdatePageSetting('footerFloatingAd', e.target.checked)}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Footer Takeover Ad:</span>
                  <input
                    type="checkbox"
                    checked={currentSettings.footerTakeoverAd || false}
                    onChange={(e) => handleUpdatePageSetting('footerTakeoverAd', e.target.checked)}
                    className="rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Max Ads Per Page:</label>
                  <input
                    type="number"
                    value={currentSettings.maxAdsPerPage || 0}
                    onChange={(e) => handleUpdatePageSetting('maxAdsPerPage', parseInt(e.target.value) || 0)}
                    className="w-full p-2 border rounded-lg"
                    min="0"
                    max="10"
                  />
                </div>
                
                {Object.keys(pageSettings).length === 0 && (
                  <div className="text-sm text-gray-500 italic mt-4">
                    No page settings configured yet. Settings will be saved when you create your first ad.
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Ad List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">All Ads ({allAds.length})</h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allAds.map(ad => (
              <div key={ad.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{ad.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    ad.type === 'banner' ? 'bg-blue-100 text-blue-800' :
                    ad.type === 'header-centered' ? 'bg-yellow-100 text-yellow-800' :
                    ad.type === 'footer-floating' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {ad.type}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{ad.subtitle}</p>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {ad.conditions?.pages?.join(', ') || 'All pages'} | 
                    {ad.conditions?.userType || 'All users'}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingAd(ad)}
                      className="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeAd(ad.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add New Ad Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Add New Ad</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ad ID:</label>
                <input
                  type="text"
                  value={newAd.id || ''}
                  onChange={(e) => setNewAd({...newAd, id: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="unique-ad-id"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type:</label>
                <select
                  value={newAd.type}
                  onChange={(e) => setNewAd({...newAd, type: e.target.value as any})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="banner">Banner</option>
                  <option value="header-centered">Header Centered</option>
                  <option value="footer-floating">Footer Floating</option>
                  <option value="footer-takeover">Footer Takeover</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title:</label>
                <input
                  type="text"
                  value={newAd.title || ''}
                  onChange={(e) => setNewAd({...newAd, title: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Ad title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Call to Action:</label>
                <input
                  type="text"
                  value={newAd.cta || ''}
                  onChange={(e) => setNewAd({...newAd, cta: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Click here"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Link:</label>
                <input
                  type="text"
                  value={newAd.link || ''}
                  onChange={(e) => setNewAd({...newAd, link: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="/page-link"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newAd.dismissible || false}
                  onChange={(e) => setNewAd({...newAd, dismissible: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm">Dismissible</label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddAd}
                className="bg-[#0B4422] text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Add Ad
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
