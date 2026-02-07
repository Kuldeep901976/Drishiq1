'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function UserMainPage() {
  // Temporary i18n shim so `t(...)` compiles.
  // Replace this with your real i18n hook, for example:
  // const { t } = useLanguage(); OR const t = useTranslations();
  const t = (k: string) => k;

  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to main user dashboard preserving any search params
    try {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      const redirectUrl = `/user/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
      // Use location.replace so back button behaves more naturally (optional)
      window.location.replace(redirectUrl);
    } catch (err) {
      // Fallback: navigate to dashboard root if something goes wrong
      window.location.replace('/user/dashboard');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('user.redirecting_dashboard')}</p>
      </div>
    </div>
  );
}
