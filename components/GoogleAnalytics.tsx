'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface GoogleAnalyticsProps {
  GA_MEASUREMENT_ID?: string;
  GA_MEASUREMENT_ID_4?: string;
  debugMode?: boolean;
}

export default function GoogleAnalytics({ 
  GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  GA_MEASUREMENT_ID_4 = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_4,
  debugMode = process.env.NODE_ENV === 'development'
}: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Load Google Analytics scripts
    const loadGA = () => {
      // Google Analytics 4 (gtag)
      if (GA_MEASUREMENT_ID_4) {
        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID_4}`;
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID_4}', {
            page_title: document.title,
            page_location: window.location.href,
            send_page_view: false
          });
        `;
        document.head.appendChild(script2);

        if (debugMode) {
          console.log('✅ Google Analytics 4 loaded:', GA_MEASUREMENT_ID_4);
        }
      }

      // Universal Analytics (legacy support)
      if (GA_MEASUREMENT_ID) {
        const script3 = document.createElement('script');
        script3.innerHTML = `
          (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
          (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
          m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
          })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
          ga('create', '${GA_MEASUREMENT_ID}', 'auto');
          ga('send', 'pageview');
        `;
        document.head.appendChild(script3);

        if (debugMode) {
          console.log('✅ Universal Analytics loaded:', GA_MEASUREMENT_ID);
        }
      }
    };

    // Only load GA if not already loaded
    if (!(window as any).gtag && !(window as any).ga) {
      loadGA();
    }
  }, [GA_MEASUREMENT_ID, GA_MEASUREMENT_ID_4, debugMode]);

  // Track page views
  useEffect(() => {
    if (!window.gtag) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    // Track page view
    window.gtag('config', GA_MEASUREMENT_ID_4, {
      page_path: url,
      page_title: document.title,
      page_location: window.location.href
    });

    // Track custom event for page view
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: url,
      event_category: 'engagement',
      event_label: 'page_view'
    });

    if (debugMode) {
      console.log('📊 Page view tracked:', url);
    }
  }, [pathname, searchParams, GA_MEASUREMENT_ID_4, debugMode]);

  // Track performance metrics
  useEffect(() => {
    if (!window.gtag || typeof window === 'undefined') return;

    const trackPerformance = () => {
      // Core Web Vitals
      if ('PerformanceObserver' in window) {
        try {
          // Largest Contentful Paint (LCP)
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              window.gtag('event', 'core_web_vitals', {
                event_category: 'Web Vitals',
                event_label: 'LCP',
                value: Math.round(lastEntry.startTime),
                non_interaction: true
              });
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay (FID)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              window.gtag('event', 'core_web_vitals', {
                event_category: 'Web Vitals',
                event_label: 'FID',
                value: Math.round((entry as any).processingStart - entry.startTime),
                non_interaction: true
              });
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // Cumulative Layout Shift (CLS)
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            if (clsValue > 0) {
              window.gtag('event', 'core_web_vitals', {
                event_category: 'Web Vitals',
                event_label: 'CLS',
                value: Math.round(clsValue * 1000) / 1000,
                non_interaction: true
              });
            }
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (error) {
          if (debugMode) {
            console.warn('Performance tracking error:', error);
          }
        }
      }

      // Page load time
      if (window.performance && window.performance.timing) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        if (loadTime > 0) {
          window.gtag('event', 'timing_complete', {
            name: 'load',
            value: loadTime,
            event_category: 'JS Dependencies'
          });
        }
      }
    };

    // Track performance after page load
    if (document.readyState === 'complete') {
      trackPerformance();
    } else {
      window.addEventListener('load', trackPerformance);
      return () => window.removeEventListener('load', trackPerformance);
    }
  }, [debugMode]);

  // Track user engagement
  useEffect(() => {
    if (!window.gtag || typeof window === 'undefined') return;

    let startTime = Date.now();
    let isVisible = true;

    const trackEngagement = () => {
      const currentTime = Date.now();
      const timeOnPage = currentTime - startTime;

      if (timeOnPage > 30000) { // 30 seconds
        window.gtag('event', 'user_engagement', {
          event_category: 'engagement',
          event_label: 'time_on_page',
          value: Math.round(timeOnPage / 1000),
          non_interaction: true
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
        trackEngagement();
      } else {
        isVisible = true;
        startTime = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      if (isVisible) {
        trackEngagement();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Track engagement every 30 seconds
    const interval = setInterval(trackEngagement, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
    };
  }, [debugMode]);

  return null; // This component doesn't render anything
}

// Utility functions for manual event tracking
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

export const trackConversion = (conversionId: string, conversionLabel: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${conversionId}/${conversionLabel}`,
      value: value,
      currency: 'INR'
    });
  }
};

export const trackUserTiming = (category: string, variable: string, time: number, label?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: variable,
      value: time,
      event_category: category,
      event_label: label
    });
  }
};





