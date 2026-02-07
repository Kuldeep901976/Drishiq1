// components/HreflangLinks.tsx - Component for rendering hreflang links on individual pages
import { generateHreflangLinks } from '@/lib/hreflang';

interface HreflangLinksProps {
  routeKey: string;
}

/**
 * Component that renders hreflang alternate links for a specific route
 * Use this on individual pages to provide locale-specific alternate links
 * 
 * @param routeKey - The route key from seo.config.ts (e.g., 'home', 'blog', 'pricing')
 */
export default function HreflangLinks({ routeKey }: HreflangLinksProps) {
  return <>{generateHreflangLinks(routeKey)}</>;
}

/**
 * Hook version for use in client components
 * @param routeKey - The route key from seo.config.ts
 * @returns Array of JSX link elements
 */
export function useHreflangLinks(routeKey: string) {
  return generateHreflangLinks(routeKey);
}






