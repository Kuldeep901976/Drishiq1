'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ResetMode = 'user' | 'admin';

interface ResetPasswordFormProps {
  mode: ResetMode;
}

export default function ResetPasswordForm({ mode }: ResetPasswordFormProps) {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  const minLength = 8;
  // After successful password change, send users to the correct sign-in route
  const redirectAfter = useMemo(() => (mode === 'admin' ? '/admin/signin' : '/user/signin'), [mode]);
  const continueTo = useMemo(
    () => (mode === 'admin' ? '/admin/blog-management' : '/'),
    [mode]
  );

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setHasSession(Boolean(data.session));
    };
    check();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < minLength) {
      setError(`Password must be at least ${minLength} characters long`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data, error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw updateError;
      }
      if (data.user) {
        setMessage('Password updated. You can sign in with your new password.');
        setTimeout(() => router.replace(redirectAfter), 1500);
      } else {
        setMessage('Password updated.');
      }
    } catch (err) {
      setError((err as Error)?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow ring-1 ring-gray-200">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">{mode === 'admin' ? 'Admin' : 'User'} Reset Password</h1>
      <p className="text-sm text-gray-500 mb-6">
        Follow the link sent to your email, then set a new password below.
        {hasSession && ' You are verified. You can also continue without changing your password.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={minLength}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={minLength}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg px-4 py-2 text-white font-semibold ${
            loading ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>

      {hasSession && (
        <button
          onClick={() => router.replace(continueTo)}
          className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Continue without changing password
        </button>
      )}

      <p className="mt-4 text-xs text-gray-500">
        If this page was opened from a magic link, you are already signed in. You may continue or set a new password above.
      </p>
    </div>
  );
}







