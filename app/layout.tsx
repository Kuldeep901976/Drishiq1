import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import GoogleAnalytics from '../components/GoogleAnalytics';
import { fontVariableClassNames, inter } from '@/lib/fonts';
// import FloatingSocialIcons from '../components/FloatingSocialIcons';
import HeaderWrapper from '@/components/HeaderWrapper';
import ChunkLoadErrorHandler from '@/components/ChunkLoadErrorHandler';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Drishiq - See Through the Challenge',
    template: '%s | Drishiq'
  },
  description: 'Drishiq is an AI-powered clarity platform that helps you see through challenges with intelligent perception. Join our early access program for exclusive insights.',
  keywords: [
    'AI clarity platform',
    'intelligent perception',
    'challenge resolution',
    'personal growth',
    'mental clarity',
    'AI insights',
    'early access',
    'Drishiq'
  ],
  authors: [{ name: 'Drishiq Team' }],
  creator: 'Drishiq',
  publisher: 'Drishiq',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.drishiq.com'),
  alternates: {
    canonical: 'https://www.drishiq.com',
    languages: {
      en: 'https://www.drishiq.com/en',
      hi: 'https://www.drishiq.com/hi',
      es: 'https://www.drishiq.com/es',
      fr: 'https://www.drishiq.com/fr',
      de: 'https://www.drishiq.com/de',
      zh: 'https://www.drishiq.com/zh',
      ja: 'https://www.drishiq.com/ja',
      ar: 'https://www.drishiq.com/ar',
      ta: 'https://www.drishiq.com/ta',
      bn: 'https://www.drishiq.com/bn',
      ru: 'https://www.drishiq.com/ru',
      pt: 'https://www.drishiq.com/pt'
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.drishiq.com',
    siteName: 'Drishiq',
    title: 'Drishiq - See Through the Challenge',
    description: 'Drishiq is an AI-powered clarity platform that helps you see through challenges with intelligent perception. Join our early access program for exclusive insights.',
    images: [
      {
        url: 'https://www.drishiq.com/assets/logo/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Drishiq - See Through the Challenge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Drishiq - See Through the Challenge',
    description: 'Drishiq is an AI-powered clarity platform that helps you see through challenges with intelligent perception. Join our early access program for exclusive insights.',
    images: ['https://www.drishiq.com/assets/logo/og-image.png'],
    creator: '@drishiq',
    site: '@drishiq',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
  category: 'technology',
  classification: 'AI Platform',
  other: {
    'theme-color': '#0B4422',
    'msapplication-TileColor': '#0B4422',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Drishiq',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Use default lang so layout is sync; client LanguageProvider reads cookie on hydrate
const DEFAULT_LANG = 'en';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const serverLang = DEFAULT_LANG;

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Drishiq",
    "operatingSystem": "Web",
    "applicationCategory": "LifestyleApplication",
    "description": "When things feel unclear, Drishiq helps you find direction and move forward confidently — in your own language, through voice or text.",
    "inLanguage": ["en","hi","es","fr","de","ru","ar","zh","bn","ta","ja","pt"],
    "url": "https://www.drishiq.com",
    "featureList": [
      "Voice-based clarity assistance",
      "Text-based guidance",
      "12 language support",
      "Emotionally intelligent responses",
      "Instant clarity plans"
    ],
    "author": {
      "@type": "Organization",
      "name": "Drishiq"
    }
  };

  return (
    <html lang={serverLang} className={fontVariableClassNames}>
      <head>
        {/* Fonts loaded via next/font in layout - no external font requests */}
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{__html: JSON.stringify(softwareApplicationSchema, null, 2)}} 
        />
      </head>
      <body className={inter.className}>
        {/* Handle chunk loading errors with automatic retry */}
        <ChunkLoadErrorHandler />
        
        {/* Load reCAPTCHA only when needed (not blocking initial render) */}
        <Script 
          src="https://www.google.com/recaptcha/api.js" 
          strategy="lazyOnload"
        />
        
        <Providers initialLang={serverLang}>
          <HeaderWrapper />
          <main>{children}</main>
          {/* <FloatingSocialIcons /> */}
          <GoogleAnalytics />
        </Providers>
      </body>
    </html>
  );
}