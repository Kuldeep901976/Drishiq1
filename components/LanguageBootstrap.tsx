'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/lib/drishiq-i18n';

/**
 * Defensive language bootstrap for the app.
 * - Attempts to call i18n.loadNamespaces(...) only when available.
 * - No-op otherwise (so older or thin i18n hooks won't crash).
 *
 * Place this file under /components so imports like:
 *   import LanguageBootstrap from '@/components/LanguageBootstrap';
 * work reliably.
 */
export default function LanguageBootstrap() {
  const maybe = (useLanguage as any)();
  // Some implementations return an object; some return functions.
  const i18n = maybe?.i18n ?? maybe?.getI18n?.();

  useEffect(() => {
    if (!i18n) return;

    // Prefer a native loadNamespaces method (react-i18next / i18next)
    if (typeof i18n.loadNamespaces === 'function') {
      try {
        // load only a few common namespaces to keep startup light
        i18n.loadNamespaces(['common', 'header', 'footer']).catch(() => {});
      } catch {
        // ignore errors
      }
      return;
    }

    // Some wrappers may expose load via a different name — defensive checks:
    const altLoad: any = (i18n as any).load || (i18n as any).loadNamespace || (i18n as any).loadResources;
    if (typeof altLoad === 'function') {
      try {
        altLoad(['common', 'header', 'footer']);
      } catch {
        // ignore
      }
    }

    // otherwise no-op — your useLanguage hook likely handles translationsLoaded/isLoading
  }, [i18n]);

  return null;
}
