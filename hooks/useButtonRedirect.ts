'use client';

import { useMemo } from 'react';
import { getButtonRedirectUrl } from '@/lib/button-redirects';

/**
 * Hook to get the redirect URL for a button in a specific section
 * @param section - The section name (e.g., 'about', 'banner', 'Hero section')
 * @param buttonText - The button text to match
 * @param defaultHref - Default href to use if no redirect is configured
 * @returns The redirect URL or default href
 */
export function useButtonRedirect(
  section: string,
  buttonText: string,
  defaultHref?: string
): string | undefined {
  return useMemo(() => {
    const redirectUrl = getButtonRedirectUrl(section, buttonText);
    return redirectUrl || defaultHref;
  }, [section, buttonText, defaultHref]);
}





