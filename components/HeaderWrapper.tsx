'use client';

import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/Header'), {
  ssr: true,
  loading: () => (
    <header className="drishiq-header" style={{ minHeight: 64 }}>
      <div className="header-container">
        <div className="header-logo" style={{ minWidth: 120, minHeight: 50, background: 'var(--header-bg, #f9fafb)' }} />
      </div>
    </header>
  ),
});

export default function HeaderWrapper() {
  return <Header />;
}
