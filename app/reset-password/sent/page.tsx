'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

// Prevent static generation - this page must be rendered dynamically
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

	function ResetLinkSentContent() {
	const router = useRouter();
	const params = useSearchParams();
	// Safely get email - handle case where params might be null during static generation
	let emailParam: string | null = null;
	try {
		emailParam = params?.get?.('email') || null;
	} catch (error) {
		console.warn('Error getting search params:', error);
		emailParam = null;
	}
	// Use optional chaining and nullish checks to prevent undefined.length errors
	const email = (emailParam && typeof emailParam === 'string' && emailParam.length > 0) ? emailParam : '';
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleResend = async () => {
		if (!email || typeof email !== 'string') return;
		setLoading(true);
		setError(null);
		setMessage(null);
		try {
			const res = await fetch('/api/auth/forgot-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, accountType: 'user' }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.error || 'Failed to resend');
			setMessage('We sent the reset link again. Please check your inbox.');
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
			<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow ring-1 ring-gray-200 text-center">
				<Image src="/assets/logo/Logo.png" alt="DrishiQ" width={140} height={60} className="mx-auto mb-4" />
				<h1 className="text-2xl font-semibold text-gray-900 mb-2">Reset link sent</h1>
				<p className="text-sm text-gray-600 mb-4">
					{email ? (
						<>We sent a password reset link to <span className="font-medium">{email}</span>.</>
					) : (
						<>We sent a password reset link to your email.</>
					)}
				</p>
				<p className="text-xs text-gray-500 mb-6">Open the email and click the link to change your password. The link will take you to the reset password page.</p>

				{error && <p className="text-sm text-red-600 mb-2">{error}</p>}
				{message && <p className="text-sm text-emerald-700 mb-2">{message}</p>}

				<div className="flex flex-col gap-3">
					<button
						onClick={handleResend}
						disabled={loading || !email}
						className={`w-full rounded-lg px-4 py-2 text-white font-semibold ${
							loading ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'
						}`}
					>
						{loading ? 'Resending…' : 'Resend link'}
					</button>
					<button
						onClick={() => router.push('/user/signin')}
						className="w-full rounded-lg px-4 py-2 font-semibold border border-gray-300 hover:bg-gray-50"
					>
						Back to Sign In
					</button>
				</div>
			</div>
		</div>
	);
}

export default function ResetLinkSentPage() {
	// This component must not be statically generated due to useSearchParams
	// Return safe fallback during SSR to prevent any undefined access
	if (typeof window === 'undefined') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
				<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow ring-1 ring-gray-200 text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}
	
	return (
		<Suspense fallback={
			<div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
				<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow ring-1 ring-gray-200 text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		}>
			<ResetLinkSentContent />
		</Suspense>
	);
}


