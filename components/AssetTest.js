'use client';

import { AssetGetters, getAssetsByCategory, getAvailableCategories } from '../lib/assets';
import Image from 'next/image';

export default function AssetTest() {
  const categories = getAvailableCategories();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Asset Test Page</h1>
      
      {categories.map(category => (
        <div key={category} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 capitalize">{category}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(getAssetsByCategory(category)).map(([filename, path]) => (
              <div key={filename} className="border rounded-lg p-4 text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <Image
                    src={path}
                    alt={filename}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      console.error(`Failed to load: ${path}`);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600 truncate">{filename}</p>
                <p className="text-xs text-gray-400 truncate">{path}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Asset Getters Test</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(AssetGetters).map(([name, getter]) => {
            const url = getter();
            return (
              <div key={name} className="border rounded p-3">
                <div className="relative w-12 h-12 mx-auto mb-2">
                  {url && (
                    <Image
                      src={url}
                      alt={name}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        console.error(`Failed to load: ${name} - ${url}`);
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <p className="text-xs text-center">{name}</p>
                {url && <p className="text-xs text-gray-500 truncate">{url}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 