'use client';

import React, { useState } from 'react';

type Mode = 'bounded' | 'main_chat';

// Ensure page is always visible (fallback if Tailwind not loaded)
const pageStyles: React.CSSProperties = {
  minHeight: '100vh',
  padding: '24px',
  backgroundColor: '#f9fafb',
};
const containerStyles: React.CSSProperties = {
  maxWidth: '42rem',
  marginLeft: 'auto',
  marginRight: 'auto',
};

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

export default function ProblemResponseTestPage() {
  const [problemStatement, setProblemStatement] = useState('');
  const [dobDate, setDobDate] = useState('');
  const [dobTime, setDobTime] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [language, setLanguage] = useState('en');
  const [mode, setMode] = useState<Mode>('bounded');
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [signals, setSignals] = useState<{
    phase_signal: string;
    gain_signal: string;
    risk_signal: string;
    confidence: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [geocodeResult, setGeocodeResult] = useState<{
    latitude: number;
    longitude: number;
    timezone: string;
    country?: string;
    formatted?: string;
  } | null>(null);

  const handleResolvePlace = async () => {
    const place = placeOfBirth.trim();
    if (!place) {
      setGeocodeError('Enter place of birth first.');
      return;
    }
    setGeocodeError(null);
    setGeocodeResult(null);
    setGeocodeLoading(true);
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGeocodeError(data?.error ?? `Geocode failed (${res.status})`);
        return;
      }
      if (data.latitude != null && data.longitude != null && data.timezone) {
        setGeocodeResult({
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone,
          country: data.country,
          formatted: data.formatted,
        });
      } else {
        setGeocodeError('Invalid geocode response');
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
    setInterpretation(null);
    setSignals(null);
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        problem_statement: problemStatement.trim(),
        dob_date: dobDate.trim(),
        dob_time: dobTime.trim(),
        place_of_birth: placeOfBirth.trim(),
        mode,
        language,
      };
      if (geocodeResult) {
        payload.latitude = geocodeResult.latitude;
        payload.longitude = geocodeResult.longitude;
        payload.timezone = geocodeResult.timezone;
      }
      const res = await fetch('/api/chat/problem-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? `Request failed (${res.status})`);
        return;
      }
      if (data.success && data.interpretation !== undefined) {
        setInterpretation(data.interpretation);
        setSignals(data.signals ?? null);
      } else {
        setError(data?.error ?? 'Invalid response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" style={pageStyles}>
      <div className="mx-auto max-w-2xl" style={containerStyles}>
        <h1 className="mb-2 text-2xl font-semibold text-gray-900" style={{ marginBottom: '8px', fontSize: '1.5rem', color: '#111827' }}>
          Astro Dev Test (Single Interpreter)
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          DEV ONLY. Bounded = Greeter-style (Destiny Lens). Main Chat = lib/main-chat-astro (advisory Astro pipeline, no onboarding).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Problem Statement <span className="text-red-500">*</span>
            </label>
            <textarea
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="e.g. I am unsure whether to launch my app now or wait."
              rows={3}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Date of Birth (YYYY-MM-DD) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={dobDate}
                onChange={(e) => setDobDate(e.target.value)}
                placeholder="1990-05-15"
                className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Time of Birth (HH:MM) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={dobTime}
                onChange={(e) => setDobTime(e.target.value)}
                placeholder="14:30"
                className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Place of Birth (City, State, Country) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleResolvePlace}
                disabled={geocodeLoading || !placeOfBirth.trim()}
                className="rounded border border-green-600 bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {geocodeLoading ? 'Resolving…' : 'Resolve'}
              </button>
            </div>
            <input
              type="text"
              value={placeOfBirth}
              onChange={(e) => {
                setPlaceOfBirth(e.target.value);
                setGeocodeError(null);
                setGeocodeResult(null);
              }}
              placeholder="Delhi, Delhi, India"
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              required
            />
            {geocodeError && (
              <p className="mt-1 text-xs text-red-600">{geocodeError}</p>
            )}
            {geocodeResult && (
              <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-700">
                <div><strong>Timezone:</strong> {geocodeResult.timezone}</div>
                <div><strong>Latitude:</strong> {geocodeResult.latitude}</div>
                <div><strong>Longitude:</strong> {geocodeResult.longitude}</div>
                {geocodeResult.country && (
                  <div><strong>Country:</strong> {geocodeResult.country}</div>
                )}
                {geocodeResult.formatted && (
                  <div className="mt-1 text-gray-600"><strong>Formatted:</strong> {geocodeResult.formatted}</div>
                )}
              </div>
            )}
            {!geocodeResult && !geocodeError && (
              <p className="mt-1 text-xs text-gray-500">
                Enter place and click Resolve. On Submit, timezone/lat/long are sent to the Astro layer (Path 1 → Path 2). Without Resolve, the API will geocode from place text.
              </p>
            )}
            {geocodeResult && (
              <p className="mt-1 text-xs text-green-700">
                These values will be sent with your submission to the Astro layer (intentStructuringForAstro → runAstroCompute → generateDestinyLensInsightBlocks).
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            >
              {LANGUAGES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700">Mode</span>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="bounded"
                  checked={mode === 'bounded'}
                  onChange={() => setMode('bounded')}
                  className="text-green-600 focus:ring-green-600"
                />
                <span>Bounded</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="main_chat"
                  checked={mode === 'main_chat'}
                  onChange={() => setMode('main_chat')}
                  className="text-green-600 focus:ring-green-600"
                />
                <span>Main Chat</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Bounded: Destiny Lens insight blocks. Main Chat: Main Chat Astro module (generateAstroAdviceForProblem).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Submit'}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        {(interpretation !== null || signals !== null) && (
          <div className="mt-6 space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Final Astro Interpretation
              </h2>
              <div className="whitespace-pre-wrap text-gray-800">
                {interpretation ?? '—'}
              </div>
            </section>
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Raw Signals (debug)</h2>
              <dl className="space-y-2 font-mono text-sm">
                {signals ? (
                  <>
                    <div>
                      <dt className="text-gray-500">phase_signal</dt>
                      <dd className="text-gray-900">{String(signals.phase_signal)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">gain_signal</dt>
                      <dd className="text-gray-900">{String(signals.gain_signal)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">risk_signal</dt>
                      <dd className="text-gray-900">{String(signals.risk_signal)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">confidence</dt>
                      <dd className="text-gray-900">{signals.confidence}</dd>
                    </div>
                  </>
                ) : (
                  <dd className="text-gray-500">—</dd>
                )}
              </dl>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
