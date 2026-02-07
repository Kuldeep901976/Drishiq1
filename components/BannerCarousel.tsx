'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../lib/drishiq-i18n';
import { getButtonRedirectUrl } from '@/lib/button-redirects';

interface Banner {
  image: string;
  title: string;
  text: string;
  cta?: { label: string; link: string };
  // legacy optional fields — keep them optional so both shapes are supported
  cta_label?: string;
  cta_link?: string;
  is_active?: boolean;
}

export default function BannerCarousel(): JSX.Element {
  const { t, locale, translationsLoaded } = useLanguage();

  // Recompute banners when translations/locale/change
  const defaultBanners: Banner[] = useMemo(
    () => [
      {
        image: '/assets/banners/banner-0-1753217601452.jpg',
        title: t('home_dynamic.banner.0.title'),
        text: t('home_dynamic.banner.0.text'),
        cta: { label: t('home_dynamic.banner.0.cta'), link: '/share-experience#story' },
      },
      {
        image: '/assets/banners/banner-1-1753218298881.jpg',
        title: t('home_dynamic.banner.1.title'),
        text: t('home_dynamic.banner.1.text'),
        cta: { label: t('home_dynamic.banner.1.cta'), link: '/invitation' },
      },
      {
        image: '/assets/banners/banner-2-1753218056625.jpg',
        title: t('home_dynamic.banner.2.title'),
        text: t('home_dynamic.banner.2.text'),
        cta: { label: t('home_dynamic.banner.2.cta'), link: '/invitation' },
      },
      {
        image: '/assets/banners/banner-3-1753218624317.jpg',
        title: t('home_dynamic.banner.3.title'),
        text: t('home_dynamic.banner.3.text'),
        cta: { label: t('home_dynamic.banner.3.cta'), link: '/invitation' },
      },
      {
        image: '/assets/banners/banner-4-1753218891541.avif',
        title: t('home_dynamic.banner.4.title'),
        text: t('home_dynamic.banner.4.text'),
        cta: { label: t('home_dynamic.banner.4.cta'), link: '/support-in-need' },
      },
      ],
    // include t so translations update when translator changes
    [t, locale, translationsLoaded]
  );

  const [current, setCurrent] = useState<number>(0);
  const [banners, setBanners] = useState<Banner[]>(defaultBanners);
  const [loading, setLoading] = useState<boolean>(true);
  // Use number for browser timers
  const intervalRef = useRef<number | null>(null);

  // Update banners when defaults change
  useEffect(() => {
    setBanners(defaultBanners);
  }, [defaultBanners]);

  // Load English saved banners from server when locale is 'en'
  const loadBanners = async () => {
    console.log('loadBanners called, locale:', locale);
    try {
      // only attempt server JSON for English (your existing behavior)
      if (locale === 'en') {
        console.log('Fetching banners from API...');
        const resp = await fetch('/api/banners');
        if (!resp.ok) {
          console.log('API response not ok, using default banners');
          setBanners(defaultBanners);
          setLoading(false);
          return;
        }
        const data = await resp.json();
        console.log('API data received:', data);
        if (data?.banners && Array.isArray(data.banners) && data.banners.length > 0) {
          console.log('Processing API banners:', data.banners.length);
          // Normalize entries to Banner shape (defensive)
          const normalized: Banner[] = data.banners.map((b: any, idx: number) => ({
            image: String(b.image || b.img || b.image_url || defaultBanners[idx % defaultBanners.length].image),
            title: String(b.title ?? defaultBanners[idx % defaultBanners.length].title),
            text: String(b.text ?? defaultBanners[idx % defaultBanners.length].text),
            cta: b.cta ? { label: String(b.cta.label ?? ''), link: String(b.cta.link ?? '/invitation') } : (b.cta_label ? { label: String(b.cta_label), link: String(b.cta_link ?? '/invitation') } : undefined),
            cta_label: b.cta_label ? String(b.cta_label) : undefined,
            cta_link: b.cta_link ? String(b.cta_link) : undefined,
            is_active: typeof b.is_active === 'boolean' ? b.is_active : true,
          }));
          // Optionally filter inactive banners
          const active = normalized.filter((b) => b.is_active !== false);
          console.log('Setting active banners:', active.length);
          setBanners(active.length > 0 ? active : defaultBanners);
          setLoading(false);
          return;
        }
      }

      // for non-English locales or fallback
      console.log('Using default banners for locale:', locale);
      setBanners(defaultBanners);
      setLoading(false);
    } catch (err) {
      // swallow errors and fallback to defaults
      console.error('Error loading banners:', err);
      setBanners(defaultBanners);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadBanners();
    // reset current index when banners source changes
    setCurrent(0);
    // Force loading to false after a short delay as fallback
    const timeout = setTimeout(() => {
      console.log('Force setting loading to false');
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, defaultBanners]);

  // auto-rotate (pauses when tab is hidden)
  useEffect(() => {
    if (!banners || banners.length <= 1) {
      // clear any existing interval
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let isVisible = true;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (!isVisible && intervalRef.current) {
        // Pause when tab is hidden
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (isVisible && !intervalRef.current) {
        // Resume when tab becomes visible
        intervalRef.current = window.setInterval(() => {
          setCurrent((prev) => (prev + 1) % banners.length);
        }, 5000);
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start interval if visible
    if (!document.hidden) {
      intervalRef.current = window.setInterval(() => {
        setCurrent((prev) => (prev + 1) % banners.length);
      }, 5000);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [banners]);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index: number) => {
    if (!banners || banners.length === 0) return;
    setCurrent(((index % banners.length) + banners.length) % banners.length);
  };

  // Debug logging
  console.log('BannerCarousel render check:', { 
    translationsLoaded, 
    loading, 
    bannersLength: banners.length,
    current 
  });

  // Loading / translation gating
  if (!translationsLoaded) {
    console.log('Translations not loaded, showing loading state');
    return (
      <div className="h-64 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading translations...</div>
      </div>
    );
  }

  if (loading) {
    console.log('Still loading banners, showing loading state');
    return (
      <div className="banner-carousel">
        <div className="banner-loading">
          <div className="loading-spinner" />
          <p>Loading banners...</p>
        </div>
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return (
      <div className="banner-carousel">
        <div className="banner-error">
          <p>No banners available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="banner-carousel" role="region" aria-roledescription="carousel" aria-label="Homepage banners">
      <div className="banner-container">
        {banners.map((banner, index) => {
          // resolve CTA label/link using either cta object or legacy fields
          const ctaLabel = banner.cta?.label ?? banner.cta_label ?? 'Learn More';
          const originalLink = banner.cta?.link ?? banner.cta_link ?? '/invitation';
          
          // Check for button redirect in 'banner' section
          const redirectUrl = getButtonRedirectUrl('banner', ctaLabel);
          const ctaLink = redirectUrl || originalLink;

          return (
            <div
              key={index}
              className={`banner-slide ${index === current ? 'active' : ''}`}
              style={{
                backgroundImage: `url(${banner.image})`,
              }}
              aria-hidden={index !== current}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${banners.length}`}
            >
              <div className="banner-content">
                <div className="banner-text-container">
                  <h2 className="banner-title">{banner.title}</h2>
                  <p className="banner-text">{banner.text}</p>
                  <a href={ctaLink} className="banner-cta-button" role="button">
                    {ctaLabel}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation buttons */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="banner-nav-button banner-nav-prev"
            aria-label="Previous banner"
            type="button"
          >
            &#8249;
          </button>
          <button
            onClick={nextSlide}
            className="banner-nav-button banner-nav-next"
            aria-label="Next banner"
            type="button"
          >
            &#8250;
          </button>

          {/* Dots indicator */}
          <div className="banner-dots" role="tablist" aria-label="Banner slides">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`banner-dot ${index === current ? 'active' : ''}`}
                aria-label={`Go to banner ${index + 1}`}
                aria-current={index === current}
                type="button"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
