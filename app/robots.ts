import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Define supported locales
  const locales = ['hi', 'es', 'fr', 'de', 'zh', 'ja', 'ar', 'ta', 'bn', 'ru', 'pt'];
  
  // Define public page routes
  const publicPages = [
    'blog',
    'pricing', 
    'meet-yourself',
    'testimonials',
    'community',
    'support',
    'terms',
    'grow-with-us'
  ];

  // Generate allowed paths dynamically
  const allowedPaths = [
    '/', // Root page
    ...locales.map(locale => `/${locale}/`), // Locale root pages
    ...publicPages.map(page => `/${page}/`), // Public pages
    ...locales.flatMap(locale => 
      publicPages.map(page => `/${locale}/${page}/`) // Localized public pages
    )
  ];

  // Define disallowed paths
  const disallowedPaths = [
    '/user/',
    '/signup/',
    '/dashboard/',
    '/admin/',
    '/api/',
    '/auth/',
    '/_next/',
    '/static/',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: allowedPaths,
        disallow: disallowedPaths,
      },
      // Specific rules for Googlebot (more permissive for better indexing)
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          ...locales.map(locale => `/${locale}/`),
          ...publicPages.map(page => `/${page}/`),
        ],
        disallow: [
          '/user/',
          '/signup/',
          '/dashboard/',
          '/admin/',
          '/api/',
          '/auth/',
        ],
      },
    ],
    sitemap: 'https://www.drishiq.com/sitemap.xml',
    host: 'https://www.drishiq.com',
  };
}