/**
 * Admin: Placements Management Page
 */

'use client';

import { useState, useEffect } from 'react';

interface Placement {
  id: string;
  code: string;
  display_name: string;
  page_pattern: string;
  default_width: number;
  default_height: number;
  default_size: string;
  allowed_types: string[];
  description: string;
  priority_group: number;
  is_active: boolean;
}

export default function PlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadPlacements();
  }, []);

  const loadPlacements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ads/placements');
      const data = await response.json();
      setPlacements(data.placements || []);
    } catch (error) {
      console.error('Error loading placements:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0B4422] mb-2">Placements</h1>
            <p className="text-gray-600">Manage ad placement locations</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#0B4422] text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Create Placement
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading placements...</div>
      ) : placements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No placements found. Create your first placement to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {placements.map((placement) => (
            <div key={placement.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{placement.display_name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  placement.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {placement.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Code:</span> {placement.code}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {placement.default_size || `${placement.default_width}x${placement.default_height}`}
                </div>
                <div>
                  <span className="font-medium">Types:</span> {placement.allowed_types?.join(', ') || 'All'}
                </div>
                {placement.description && (
                  <div className="text-xs text-gray-500 mt-2">{placement.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateForm && (
        <PlacementCreateForm
          onClose={() => {
            setShowCreateForm(false);
            loadPlacements();
          }}
        />
      )}
    </div>
  );
}

function PlacementCreateForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    code: '',
    display_name: '',
    page_pattern: '',
    default_width: 300,
    default_height: 250,
    default_size: '300x250',
    allowed_types: ['banner', 'leaderboard', 'hero', 'square', 'small_inline', 'native', 'video', 'html'],
    description: '',
    priority_group: 0,
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/ads/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create placement');
      }
    } catch (error) {
      console.error('Error creating placement:', error);
      alert('Failed to create placement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create Placement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="home.banner.top"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Display Name *</label>
            <input
              type="text"
              required
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="Homepage Banner Top"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Width</label>
              <input
                type="number"
                value={formData.default_width}
                onChange={(e) => setFormData({ ...formData, default_width: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Height</label>
              <input
                type="number"
                value={formData.default_height}
                onChange={(e) => setFormData({ ...formData, default_height: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows={3}
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-[#0B4422] text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

