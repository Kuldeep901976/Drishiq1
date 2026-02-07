// lib/drishiq-i18n.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
  useRef,
  ReactNode,
} from 'react';

type Namespace = string;
type Lang = string;
type Translations = Record<string, string | Record<string, any>>;
type LoadResult = { ok: boolean; ns: Namespace; data?: Translations };

export interface LanguageContextValue {
  language: Lang;
  setLanguage: (l: Lang) => void;
  t: (key: string, opts?: { returnObjects?: boolean; [key: string]: any }) => any;
  isLoading: boolean;
  translationsLoaded: boolean;
  loadNamespaces: (namespaces: Namespace[]) => Promise<void>;
  locale?: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const DEFAULT_LANG: Lang = 'en';
const FALLBACK_LANG: Lang = 'en';

// Supported language codes
const SUPPORTED_LANGUAGES = ['en', 'hi', 'bn', 'ta', 'ar', 'zh', 'ja', 'es', 'fr', 'de', 'ru', 'pt'];

// Invalid language values that should be ignored (route names, variant names, etc.)
const INVALID_LANG_VALUES = ['invitation', 'support', 'share-experience', 'qualification-check', 'language-selection', 'home', 'dashboard', 'profile'];

/**
 * Validates and normalizes a language code
 * - Handles 'en-US' -> 'en'
 * - Filters out invalid values (route names, etc.)
 * - Returns a valid language code or DEFAULT_LANG
 */
function validateAndNormalizeLanguage(lang: string | null | undefined): Lang {
  if (!lang) return DEFAULT_LANG;
  
  const normalized = lang.split('-')[0].toLowerCase();
  
  // Check if it's an invalid value (route name, variant name, etc.)
  if (INVALID_LANG_VALUES.includes(normalized)) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn(`[LanguageProvider] Invalid language value "${lang}" detected (likely a route/variant name), defaulting to English.`);
    }
    // Clean up invalid value from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('i18nextLng');
      } catch (e) {
        // Ignore storage errors
      }
    }
    return DEFAULT_LANG;
  }
  
  // Check if it's a valid supported language code
  if (normalized.length >= 2 && normalized.length <= 3 && /^[a-z]+$/.test(normalized)) {
    if (SUPPORTED_LANGUAGES.includes(normalized)) {
      return normalized as Lang;
    } else {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn(`[LanguageProvider] Language "${normalized}" not supported, defaulting to English. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
      }
      return DEFAULT_LANG;
    }
  }
  
  // Invalid format, default to English
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(`[LanguageProvider] Invalid language format "${lang}", defaulting to English.`);
  }
  return DEFAULT_LANG;
}

/**
 * dynamicImportNamespace
 * Fetch JSON file from public/locales/{lang}/{ns}.json
 * Normalizes language codes (short form) and maps 'cn' -> 'zh'
 */
async function dynamicImportNamespace(lang: Lang, ns: Namespace): Promise<LoadResult> {
  const short = (lang || '').split('-')[0].toLowerCase();
  const normalized = short === 'cn' ? 'zh' : short; // map cn->zh; prefer using 'zh' in files
  const url = `/locales/${normalized}/${ns}.json`;

  try {
    const res = await fetch(url, { cache: 'no-store' }); // no-store helps dev updates
    if (!res.ok) {
      return { ok: false, ns };
    }
    const data = await res.json();
    return { ok: true, ns, data };
  } catch (err) {
    return { ok: false, ns };
  }
}

/**
 * LanguageProvider
 */
export function LanguageProvider({
  children,
  initialLang,
  defaultNamespaces = ['common'],
}: {
  children: ReactNode;
  initialLang?: Lang;
  defaultNamespaces?: Namespace[];
}) {
  // Initialize language: drishiq_lang cookie > localStorage > initialLang > 'en'
  // Validate and normalize the language to ensure it's always a valid language code
  const [language, setLanguageState] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      // 1. Cookie "drishiq_lang" (single source of truth)
      const cookies = document.cookie.split(';');
      const cookie = cookies.find(c => c.trim().startsWith('drishiq_lang='));
      if (cookie) {
        const cookieLang = cookie.split('=')[1]?.trim();
        if (cookieLang) {
          const validated = validateAndNormalizeLanguage(cookieLang);
          if (validated !== DEFAULT_LANG || cookieLang === 'en') {
            localStorage.setItem('i18nextLng', validated);
            return validated;
          }
        }
      }
      // 2. localStorage "i18nextLng"
      const storedLang = localStorage.getItem('i18nextLng');
      const langToUse = storedLang || initialLang || DEFAULT_LANG;
      return validateAndNormalizeLanguage(langToUse);
    }
    return validateAndNormalizeLanguage(initialLang || DEFAULT_LANG);
  });
  
  const [store, setStore] = useState<Record<string, Record<string, any>>>({});
  const storeRef = useRef(store);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [namespacesLoaded, setNamespacesLoaded] = useState<Set<string>>(new Set());
  
  // Keep ref in sync with state
  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  // Enhanced setLanguage function that persists to cookie and localStorage
  // Validates the language before setting it
  // This syncs language across: Onboarding Chat, Web Pages, Main Chat
  const setLanguage = (newLang: Lang) => {
    const validatedLang = validateAndNormalizeLanguage(newLang);
    console.log('🌐 [Language] Switching from', language, 'to', validatedLang);
    setLanguageState(validatedLang);
    if (typeof window !== 'undefined') {
      // Store in localStorage
      localStorage.setItem('i18nextLng', validatedLang);
      
      // Store in cookie (single source of truth: drishiq_lang)
      document.cookie = `drishiq_lang=${validatedLang}; path=/; max-age=31536000`;
      
      // Trigger storage event to sync across tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'i18nextLng',
        newValue: validatedLang,
        storageArea: localStorage
      }));
    }
  };

  // Listen for localStorage changes to sync language across tabs
  // Validates language values from other tabs before applying them
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'i18nextLng' && e.newValue && e.newValue !== language) {
        const validatedLang = validateAndNormalizeLanguage(e.newValue);
        if (validatedLang !== language) {
          setLanguageState(validatedLang);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [language]);

  // load default namespaces on mount and when language changes
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    (async () => {
      const toLoad = defaultNamespaces || [];
      const loadedSet = new Set<string>();

      for (const ns of toLoad) {
        let res = await dynamicImportNamespace(language, ns);
        if (!res.ok && language !== FALLBACK_LANG) {
          res = await dynamicImportNamespace(FALLBACK_LANG, ns);
        }
        if (res.ok && res.data && mounted) {
          setStore((s) => ({ 
            ...s, 
            [language]: { 
              ...s[language], 
              [ns]: res!.data! 
            } 
          }));
          loadedSet.add(ns);
        }
      }

      if (!mounted) return;
      setNamespacesLoaded((prev) => new Set([...Array.from(prev), ...Array.from(loadedSet)]));
      setIsLoading(false);
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // load arbitrary namespaces on demand
  const loadNamespaces = useCallback(async (namespaces: Namespace[]) => {
    setIsLoading(true);
    const newlyLoaded: string[] = [];

    for (const ns of namespaces) {
      // Check if namespace is already loaded for the current language using ref for current value
      const alreadyLoadedForLang = storeRef.current[language]?.[ns] !== undefined;
      if (alreadyLoadedForLang) continue;
      
      let res = await dynamicImportNamespace(language, ns);
      if (!res.ok && language !== FALLBACK_LANG) {
        res = await dynamicImportNamespace(FALLBACK_LANG, ns);
      }
      if (res.ok && res.data) {
        setStore((s) => ({ 
          ...s, 
          [language]: { 
            ...s[language], 
            [ns]: res!.data! 
          } 
        }));
        newlyLoaded.push(ns);
      }
    }

    setNamespacesLoaded((prev) => {
      const copy = new Set(Array.from(prev));
      newlyLoaded.forEach((n) => copy.add(n));
      return copy;
    });

    setIsLoading(false);
  }, [language]);

  // translation function
  const t = (key: string, opts?: { returnObjects?: boolean; [key: string]: any }) => {
    if (!key) return opts?.returnObjects ? {} : '';

    const parts = key.split('.');
    let namespace = 'common';
    let pathParts = parts;

    const knownNs = [
      'home',
      'home_static',
      'home_dynamic',
      'areas',
      'about',
      'features',
      'blog',
      'blog_create',
      'mental_fog',
      'testimonials',
      'testimonials_main',
      'grow_with_us',
      'choose_path',
      'footer',
      'header',
      'common',
      'user',
      'support',
      'early_access',
      'meetyourself1',
      'meetyourself2',
      'meetyourself3',
      'meetyourself4',
      'growwithus1',
      'growwithus2',
      'growwithuscommon',
      'shareexperience',
      'chat',
      'payment',
      'signup_signin',
      'terms',
      'community',
      '404nall',
    ];

    if (parts.length > 1 && knownNs.includes(parts[0])) {
      namespace = parts[0];
      pathParts = parts.slice(1);
    } else if (parts.length > 1 && namespacesLoaded.has(parts[0])) {
      namespace = parts[0];
      pathParts = parts.slice(1);
    }

    const nsObj = store[language]?.[namespace] ?? {};
    let cur: any = nsObj;

    for (const p of pathParts) {
      if (cur === undefined || cur === null) break;
      cur = cur[p];
    }

    if (cur === undefined || cur === null) {
      // try fallback language loaded in store (if present)
      const fallbackNsObj = store[FALLBACK_LANG]?.[namespace] ?? {};
      let fcur: any = fallbackNsObj;
      for (const p of pathParts) {
        if (fcur === undefined || fcur === null) break;
        fcur = fcur[p];
      }
      if (fcur !== undefined && fcur !== null) {
        cur = fcur;
      } else {
        return opts?.returnObjects ? {} : '';
      }
    }

    // Handle interpolation if opts contains variables (excluding returnObjects)
    if (opts && typeof cur === 'string') {
      let result = cur;
      for (const [key, value] of Object.entries(opts)) {
        if (key !== 'returnObjects' && typeof value === 'string') {
          result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }
      }
      return result;
    }

    return opts?.returnObjects ? cur : cur;
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      isLoading,
      translationsLoaded: namespacesLoaded.size > 0,
      loadNamespaces,
      locale: language,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language, isLoading, Array.from(namespacesLoaded).join(',')]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** useLanguage hook - accepts optional namespaces array to preload */
export function useLanguage(namespaces?: Namespace[]) {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  // if caller passes namespaces, attempt to load them (no-op if already loaded)
  useEffect(() => {
    let mounted = true;
    if (!namespaces || namespaces.length === 0) return;
    (async () => {
      if (!mounted) return;
      try {
        await ctx.loadNamespaces(namespaces);
      } catch (err) {
        // swallow - loadNamespaces already handles failure
      }
    })();
    return () => {
      mounted = false;
    };
    // intentionally only run when namespaces array reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Array.isArray(namespaces) ? namespaces.join(',') : namespaces]);

  return ctx;
}
