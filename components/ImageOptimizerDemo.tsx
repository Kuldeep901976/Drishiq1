'use client';

import { useState } from 'react';
import { ImageOptimizer } from '@/lib/image-optimizer';

export default function ImageOptimizerDemo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<keyof typeof ImageOptimizer['OPTIMIZATION_PROFILES']>('featured');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setOptimizationResult(null);
    }
  };

  const handleOptimize = async () => {
    if (!selectedFile) return;

    setIsOptimizing(true);
    try {
      const result = await ImageOptimizer.optimizeImage(selectedFile, { type: selectedProfile });
      setOptimizationResult(result);
    } catch (error) {
      console.error('Optimization failed:', error);
      setOptimizationResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsOptimizing(false);
    }
  };

  const profiles = ImageOptimizer.getAvailableProfiles();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🖼️ Image Optimizer Demo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Image File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {selectedFile && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Selected File:</h4>
              <p className="text-sm text-gray-600">Name: {selectedFile.name}</p>
              <p className="text-sm text-gray-600">Size: {ImageOptimizer.formatFileSize(selectedFile.size)}</p>
              <p className="text-sm text-gray-600">Type: {selectedFile.type}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optimization Profile
            </label>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {profiles.map(profile => {
                const hasDimensions = 'width' in profile;
                const dimensions = hasDimensions 
                  ? `${profile.width}x${profile.height}` 
                  : `${profile.maxWidth}x${profile.maxHeight}`;
                const maxSize = hasDimensions 
                  ? profile.maxSize 
                  : `${profile.maxFileSize}KB`;
                
                return (
                  <option key={profile.type} value={profile.type}>
                    {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)} ({dimensions}, max {maxSize})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={handleOptimize}
            disabled={!selectedFile || isOptimizing}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOptimizing ? '🔄 Optimizing...' : '🚀 Optimize Image'}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Optimization Results:</h4>
          
          {optimizationResult?.error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">❌ {optimizationResult.error}</p>
            </div>
          ) : optimizationResult ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <h5 className="font-medium text-green-800">✅ Optimization Complete!</h5>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Original Size:</strong> {ImageOptimizer.formatFileSize(selectedFile?.size || 0)}</p>
                <p><strong>Optimized Size:</strong> {ImageOptimizer.formatFileSize(optimizationResult.size)}</p>
                <p><strong>Dimensions:</strong> {optimizationResult.width} x {optimizationResult.height}</p>
                <p><strong>Format:</strong> {optimizationResult.format}</p>
                <p><strong>Compression:</strong> {Math.round((1 - optimizationResult.size / (selectedFile?.size || 1)) * 100)}%</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-500">Select a file and click optimize to see results</p>
            </div>
          )}

          {/* Profile Information */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-medium text-blue-800 mb-2">Available Profiles:</h5>
            <div className="text-sm text-blue-700 space-y-1">
              {profiles.map(profile => {
                const hasDimensions = 'width' in profile;
                const dimensions = hasDimensions 
                  ? `${profile.width}x${profile.height}` 
                  : `${profile.maxWidth}x${profile.maxHeight}`;
                const maxSize = hasDimensions 
                  ? profile.maxSize 
                  : `${profile.maxFileSize}KB`;
                
                return (
                  <div key={profile.type} className="flex justify-between">
                    <span className="capitalize">{profile.type}:</span>
                    <span>{dimensions}, max {maxSize}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



