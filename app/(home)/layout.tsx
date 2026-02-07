import { Metadata } from 'next';

/**
 * Homepage-specific metadata layout
 * 
 * This layout applies homepage-specific SEO metadata.
 * Route groups (parentheses) don't affect the URL structure,
 * so app/(home)/page.tsx still renders at /
 */
export const metadata: Metadata = {
  title: "Drishiq — Clarity in Your Language. Direction for Your Life.",
  description: "When things feel unclear, Drishiq helps you find direction and move forward confidently — in your own language, through voice or text.",
  alternates: {
    canonical: 'https://www.drishiq.com',
  },
  openGraph: {
    title: "Drishiq — Clarity in Your Language. Direction for Your Life.",
    description: "When things feel unclear, Drishiq helps you find direction and move forward confidently — in your own language, through voice or text.",
    url: 'https://www.drishiq.com',
    siteName: 'Drishiq',
    type: 'website',
    images: [
      {
        url: 'https://www.drishiq.com/assets/logo/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Drishiq — Clarity in Your Language. Direction for Your Life.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Drishiq — Clarity in Your Language. Direction for Your Life.",
    description: "When things feel unclear, Drishiq helps you find direction and move forward confidently — in your own language, through voice or text.",
    images: ['https://www.drishiq.com/assets/logo/og-image.png'],
    creator: '@drishiq',
    site: '@drishiq',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

