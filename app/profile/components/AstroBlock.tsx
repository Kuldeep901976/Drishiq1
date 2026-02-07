'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Lock, MapPin, CheckCircle } from 'lucide-react';

interface LocationSuggestion {
  display_name: string;
  lat: number;
  lon: number;
}

interface AstroBlockProps {
  astroOptIn: boolean;
  timeOfBirth: string;
  placeOfBirth: string;
  consentProvided: boolean;
  freezeBirthData: boolean;
  onToggleAstro: () => void;
  onTimeChange: (value: string) => void;
  onPlaceChange: (value: string) => void;
  onConsentChange: (checked: boolean) => void;
  onFreezeChange: () => void;
  errors: Record<string, string>;
  isGeocoding?: boolean;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export default function AstroBlock({
  astroOptIn,
  timeOfBirth,
  placeOfBirth,
  consentProvided,
  freezeBirthData,
  onToggleAstro,
  onTimeChange,
  onPlaceChange,
  onConsentChange,
  onFreezeChange,
  errors,
  isGeocoding = false,
  latitude,
  longitude,
  timezone,
}: AstroBlockProps) {
  const isLocked = freezeBirthData;
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions when user types
  useEffect(() => {
    if (placeOfBirth && placeOfBirth.length > 2) {
      const timeoutId = setTimeout(async () => {
        setIsLoadingSuggestions(true);
        try {
          const response = await fetch(
            `/api/geocode?place=${encodeURIComponent(placeOfBirth)}&suggestions=true`
          );
          const data = await response.json();
          if (data.success && data.suggestions) {
            setSuggestions(data.suggestions);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [placeOfBirth]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    // Update place name - this will trigger parent geocoding automatically
    onPlaceChange(suggestion.display_name);
    setShowSuggestions(false);
  };

  return (
    <div className="border border-gray-300 rounded-lg p-6 space-y-4">
      {/* Toggle Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Sparkles size={20} className="text-purple-600" /> Free Astrology Advice
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Get personalized guidance based on your birth chart
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={astroOptIn}
            onChange={onToggleAstro}
            className="sr-only peer"
            aria-label="Enable astrology advice"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      </div>

      {/* Expanded Fields */}
      {astroOptIn && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Time of Birth */}
          <div className={isLocked ? 'opacity-60' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              Time of Birth (optional) {isLocked && <Lock size={14} className="text-gray-500" />}
            </label>
            <input
              type="time"
              value={timeOfBirth}
              onChange={(e) => onTimeChange(e.target.value)}
              onClick={(e) => {
                if (!isLocked) {
                  const target = e.target as HTMLInputElement;
                  if (target.showPicker) {
                    target.showPicker();
                  }
                }
              }}
              disabled={isLocked}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.timeOfBirth 
                  ? 'border-red-500' 
                  : 'border-gray-300 focus:ring-green-500'
              } ${isLocked ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}`}
              aria-label="Time of birth"
            />
            <p className="text-xs text-gray-500 mt-1">
              {isLocked 
                ? 'Locked — contact support to unlock'
                : 'Time of birth improves astrology accuracy (Moon, Ascendant). If unknown, provide approximate or leave blank.'
              }
            </p>
            {errors.timeOfBirth && (
              <p className="text-xs text-red-500 mt-1">{errors.timeOfBirth}</p>
            )}
          </div>

          {/* Place of Birth */}
          <div className={isLocked ? 'opacity-60' : 'relative'}>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              Place of Birth (city, country) {isLocked && <Lock size={14} className="text-gray-500" />}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={placeOfBirth}
              onChange={(e) => onPlaceChange(e.target.value)}
              disabled={isLocked}
              placeholder="e.g., Jaipur, India"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.placeOfBirth 
                  ? 'border-red-500' 
                  : 'border-gray-300 focus:ring-green-500'
              } ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              aria-label="Place of birth"
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && !isLocked && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {isLoadingSuggestions && (
                  <div className="p-2 text-center text-sm text-gray-500">Loading suggestions...</div>
                )}
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-sm font-medium text-gray-800">{suggestion.display_name}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="text-xs text-gray-500 mt-1 space-y-1">
              <p>{isLocked ? 'Locked — contact support to unlock' : 'Start typing city — choose the best match from suggestions. We store lat/lon if available.'}</p>
              {isGeocoding && <p className="text-blue-600 flex items-center gap-1"><MapPin size={14} /> Geocoding location...</p>}
              {latitude && longitude && !isGeocoding && (
                <p className="text-green-600 flex items-center gap-1">
                  <CheckCircle size={14} /> Location set: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  {timezone && ` • ${timezone}`}
                </p>
              )}
            </div>
            {errors.placeOfBirth && (
              <p className="text-xs text-red-500 mt-1">{errors.placeOfBirth}</p>
            )}
          </div>

          {/* Consent Checkbox */}
          {!isLocked && (
            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentProvided}
                  onChange={(e) => onConsentChange(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  I consent to share my date, time and place of birth for astrology-based guidance. 
                  I understand these details are sensitive and will be stored securely.
                </span>
              </label>
              {errors.consentProvided && (
                <p className="text-xs text-red-500 mt-1">{errors.consentProvided}</p>
              )}
            </div>
          )}

          {/* Freeze Toggle (after saving) */}
          {!isLocked && (
            <div className="pt-2 border-t border-gray-200">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freezeBirthData}
                  onChange={onFreezeChange}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  Lock birth details — require re-verification to edit
                </span>
              </label>
            </div>
          )}

          {/* Locked Message */}
          {isLocked && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Your birth data is locked. Changes require verification.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

