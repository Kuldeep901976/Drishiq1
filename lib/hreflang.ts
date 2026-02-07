// lib/hreflang.ts - Helper for generating hreflang alternate links
import { getAlternatesFor } from './getAlternateUrl';
import React from 'react';

/**
 * Generate hreflang alternate link tags for a given route
 * @param key - Page key from seo.config.ts (e.g., 'home', 'blog', 'pricing')
 * @returns Array of JSX link elements with hreflang attributes
 */
export function generateHreflangLinks(key: string): React.ReactNode[] {
  const alternates = getAlternatesFor(key);
  
  return Object.entries(alternates).map(([locale, url]) => 
    React.createElement('link', {
      key: `hreflang-${locale}`,
      rel: 'alternate',
      hrefLang: locale,
      href: url
    })
  );
}

/**
 * Generate hreflang alternate link tags as HTML string
 * @param key - Page key from seo.config.ts
 * @returns HTML string of hreflang link tags
 */
export function generateHreflangHTML(key: string): string {
  const alternates = getAlternatesFor(key);
  
  return Object.entries(alternates)
    .map(([locale, url]) => 
      `<link rel="alternate" hreflang="${locale}" href="${url}" />`
    )
    .join('\n');
}

/**
 * Get hreflang data as an object for manual rendering
 * @param key - Page key from seo.config.ts
 * @returns Object with locale to URL mapping
 */
export function getHreflangData(key: string): Record<string, string> {
  return getAlternatesFor(key);
}

/**
 * Generate hreflang metadata for Next.js metadata API
 * @param key - Page key from seo.config.ts
 * @returns Metadata object with alternates.languages
 */
export function generateHreflangMetadata(key: string) {
  const alternates = getAlternatesFor(key);
  
  return {
    alternates: {
      languages: alternates
    }
  };
}
