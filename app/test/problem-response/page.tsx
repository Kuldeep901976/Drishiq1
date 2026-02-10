'use client';

import React, { useState } from 'react';

type Tab = 'greeter' | 'main_chat';

const TAB_OPTIONS: { id: Tab; label: string }[] = [
  { id: 'greeter', label: 'Greeter Chat' },
  { id: 'main_chat', label: 'Main Chat' },
];

interface GeocodedResult {
  latitude: number;
  longitude: number;
  timezone: string;
  formatted?: string;
}

export default function ProblemResponseTestPage() {
  const [activeTab, setActiveTab] = useState<Tab>('greeter');
  const [problem, setProblem] = useState('');
  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [dobDate, setDobDate] = useState('');
  const [dobTime, setDobTime] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [geocoded, setGeocoded] = useState<GeocodedResult | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [astroSignals, setAstroSignals] = useState<{
    gain_signal: number | string;
    risk_signal: number | string;
    phase_signal: number | string;
    confidence: number;
  } | null>(null);
  const [fromAstroLayer, setFromAstroLayer] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGeocode = async () => {
    const place = placeOfBirth.trim();
    if (!place) {
      setGeocodeError('Enter place of birth first.');
      return;
    }
    setGeocodeError(null);
    setGeocoded(null);
    setGeocodeLoading(true);
    try {
      const res = await fetch(`/api/geocode?place=${encodeURIComponent(place)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGeocodeError(json?.error || `Geocode failed (${res.status})`);
        return;
      }
      const data = json?.data ?? json;
      if (data?.latitude != null && data?.longitude != null && data?.timezone) {
        setGeocoded({
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          timezone: String(data.timezone),
          formatted: data.formatted,
        });
      } else {
        setGeocodeError('No coordinates or timezone in response');
      }
    } catch (err) {
      setGeocodeError(err instanceof Error ? err.message : 'Geocode failed');
    } finally {
      setGeocodeLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResponse(null);
    setAstroSignals(null);
    setFromAstroLayer(null);
    if (!problem.trim()) {
      setError('Please enter a problem.');
      return;
    }
    setLoading(true);
    try {
      const details: Record<string, string | number> = {
        ...(name.trim() && { name: name.trim() }),
        ...(ageRange.trim() && { age_range: ageRange.trim() }),
        ...(gender.trim() && { gender: gender.trim() }),
        ...(city.trim() && { city: city.trim() }),
        ...(dobDate.trim() && { dob_date: dobDate.trim() }),
        ...(dobTime.trim() && { dob_time: dobTime.trim() }),
        ...(placeOfBirth.trim() && { place_of_birth: placeOfBirth.trim() }),
        ...(language.trim() && { language: language.trim() }),
      };
      if (geocoded) {
        details.latitude = geocoded.latitude;
        details.longitude = geocoded.longitude;
        details.timezone = geocoded.timezone;
      }
      const res = await fetch('/api/chat/problem-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: problem.trim(),
          source: activeTab,
          language: language.trim() || 'en',
          details,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }
      setResponse(data?.response ?? '');
      if (data?.astro_signals) setAstroSignals(data.astro_signals);
      setFromAstroLayer(data?.from_astro_layer ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Problem response (test)</h1>
        <p className="text-sm text-gray-600 mb-6">
          Details aligned with greeter chat: problem, name, age, gender, DOB, place of birth. Use &quot;Look up place&quot; to get lat/long/timezone for place of birth.
        </p>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {TAB_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`py-2 px-4 text-sm font-medium border-b-2 -mb-px ${
                activeTab === id
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div>
            <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-1">
              Problem <span className="text-red-500">*</span>
            </label>
            <textarea
              id="problem"
              rows={3}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g. Work stress and tight deadlines"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700 mb-1">Age range</label>
              <input
                id="ageRange"
                type="text"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                placeholder="e.g. 25-34"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <input
                id="gender"
                type="text"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City (current)</label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* DOB + Place of birth (aligned with greeter) */}
          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Birth details (greeter/astro)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dobDate" className="block text-sm font-medium text-gray-700 mb-1">DOB date</label>
                <input
                  id="dobDate"
                  type="text"
                  value={dobDate}
                  onChange={(e) => setDobDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="dobTime" className="block text-sm font-medium text-gray-700 mb-1">DOB time (24h)</label>
                <input
                  id="dobTime"
                  type="text"
                  value={dobTime}
                  onChange={(e) => setDobTime(e.target.value)}
                  placeholder="HH:MM or HH:MM:SS"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-700 mb-1">Place of birth</label>
              <div className="flex gap-2">
                <input
                  id="placeOfBirth"
                  type="text"
                  value={placeOfBirth}
                  onChange={(e) => {
                    setPlaceOfBirth(e.target.value);
                    setGeocoded(null);
                    setGeocodeError(null);
                  }}
                  placeholder="e.g. Mumbai, Maharashtra, India"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={geocodeLoading || !placeOfBirth.trim()}
                  className="px-3 py-2 rounded-md border border-gray-300 bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {geocodeLoading ? '…' : 'Look up place'}
                </button>
              </div>
              {geocodeError && <p className="mt-1 text-sm text-red-600">{geocodeError}</p>}
              {geocoded && (
                <p className="mt-2 text-sm text-gray-600">
                  Lat: {geocoded.latitude.toFixed(4)}, Long: {geocoded.longitude.toFixed(4)}, TZ: {geocoded.timezone}
                  {geocoded.formatted && ` · ${geocoded.formatted}`}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <input
              id="language"
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="en"
              className="w-full max-w-[8rem] rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending…' : `Get ${activeTab === 'greeter' ? 'Greeter' : 'Main Chat'} response`}
          </button>
        </form>

        {response !== null && (
          <div className="mt-6 space-y-4">
            {fromAstroLayer === false && activeTab === 'greeter' && (
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 shadow-sm">
                <p className="text-sm text-amber-800">
                  <strong>Greeter fallback</strong> — this is not from the astro layer. Start the astro service (port 5001) and ensure DOB, time, and place of birth with &quot;Look up place&quot; are filled.
                </p>
              </div>
            )}
            {astroSignals != null && (
              <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-emerald-800 mb-2">Swiss Ephemeris signals (astro layer)</h2>
                <p className="text-sm text-emerald-900">
                  gain_signal: {String(astroSignals.gain_signal)} · risk_signal: {String(astroSignals.risk_signal)} · phase_signal: {String(astroSignals.phase_signal)} · confidence: {astroSignals.confidence}
                </p>
              </div>
            )}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                {fromAstroLayer === true ? 'Response from astro layer (Greeter)' : `Response (${activeTab === 'greeter' ? 'Greeter' : 'Main Chat'})`}
              </h2>
              <p className="text-gray-900 whitespace-pre-wrap">{response || '(empty)'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
