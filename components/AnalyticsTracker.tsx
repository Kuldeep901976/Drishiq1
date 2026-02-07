'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface AnalyticsTrackerProps {
  userId?: string;
  enableAutoTracking?: boolean;
  enableABTesting?: boolean;
  debugMode?: boolean;
}

interface AnalyticsEvent {
  eventType: string;
  eventName: string;
  pageUrl?: string;
  pageTitle?: string;
  elementId?: string;
  properties?: Record<string, any>;
}

export default function AnalyticsTrackerComponent({
  userId,
  enableAutoTracking = true,
  enableABTesting = false,
  debugMode = false
}: AnalyticsTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pageLoadTime, setPageLoadTime] = useState<number>(0);
  const pageStartTime = useRef<number>(Date.now());
  const lastPathname = useRef<string>('');

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await fetch('/api/analytics/track?action=session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
          if (debugMode) {
            console.log('Analytics session initialized:', data.sessionId);
          }
        }
      } catch (error) {
        if (debugMode) {
          console.error('Failed to initialize analytics session:', error);
        }
      }
    };

    initializeSession();
  }, [debugMode]);

  // Track page views automatically
  useEffect(() => {
    if (!enableAutoTracking) return;

    const trackPageView = async () => {
      const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      
      // Don't track if it's the same page
      if (lastPathname.current === currentPath) return;
      
      lastPathname.current = currentPath;
      pageStartTime.current = Date.now();

      try {
        const response = await fetch('/api/analytics/track?action=page-view', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok && debugMode) {
          console.log('Page view tracked:', currentPath);
        }
      } catch (error) {
        if (debugMode) {
          console.error('Failed to track page view:', error);
        }
      }
    };

    // Track page view with a small delay to ensure DOM is ready
    const timer = setTimeout(trackPageView, 100);
    return () => clearTimeout(timer);
  }, [pathname, searchParams, enableAutoTracking, debugMode]);

  // Track page load time
  useEffect(() => {
    const handleLoad = () => {
      const loadTime = Date.now() - pageStartTime.current;
      setPageLoadTime(loadTime);
      
      if (enableAutoTracking) {
        trackEvent({
          eventType: 'performance',
          eventName: 'page_load_time',
          properties: {
            load_time_ms: loadTime,
            page_url: window.location.href
          }
        });
      }
    };

    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
      }
    }
  }, [enableAutoTracking]);

  // Track click events automatically
  useEffect(() => {
    if (!enableAutoTracking) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // Track clicks on buttons, links, and elements with data-track attribute
      if (target.tagName === 'BUTTON' || 
          target.tagName === 'A' || 
          target.hasAttribute('data-track')) {
        
        trackEvent({
          eventType: 'interaction',
          eventName: 'click',
          elementId: target.id || undefined,
          properties: {
            element_tag: target.tagName,
            element_text: target.textContent?.trim().substring(0, 100),
            element_class: target.className,
            href: target.getAttribute('href'),
            page_url: window.location.href
          }
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [enableAutoTracking]);

  // Track form submissions
  useEffect(() => {
    if (!enableAutoTracking) return;

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      if (!form) return;

      const formData = new FormData(form);
      const formFields = Array.from(formData.keys());

      trackEvent({
        eventType: 'form',
        eventName: 'form_submit',
        elementId: form.id || undefined,
        properties: {
          form_fields: formFields,
          form_method: form.method,
          form_action: form.action,
          page_url: window.location.href
        }
      });
    };

    document.addEventListener('submit', handleSubmit);
    return () => document.removeEventListener('submit', handleSubmit);
  }, [enableAutoTracking]);

  // Track scroll depth
  useEffect(() => {
    if (!enableAutoTracking) return;

    let maxScrollDepth = 0;
    const scrollDepthMarkers = [25, 50, 75, 100];
    const triggeredMarkers = new Set<number>();

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollDepth = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
      }

      // Track milestone scroll depths
      scrollDepthMarkers.forEach(marker => {
        if (scrollDepth >= marker && !triggeredMarkers.has(marker)) {
          triggeredMarkers.add(marker);
          trackEvent({
            eventType: 'engagement',
            eventName: 'scroll_depth',
            properties: {
              scroll_depth: marker,
              page_url: window.location.href
            }
          });
        }
      });
    };

    const throttledScrollHandler = throttle(handleScroll, 1000);
    window.addEventListener('scroll', throttledScrollHandler);
    return () => window.removeEventListener('scroll', throttledScrollHandler);
  }, [enableAutoTracking]);

  // Track time on page when leaving
  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeOnPage = Date.now() - pageStartTime.current;
      
      // Use sendBeacon for reliable tracking when leaving page
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/track', JSON.stringify({
          eventType: 'engagement',
          eventName: 'time_on_page',
          properties: {
            time_on_page_ms: timeOnPage,
            page_url: window.location.href
          }
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Track event function
  const trackEvent = async (event: AnalyticsEvent) => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          pageUrl: event.pageUrl || window.location.href,
          pageTitle: event.pageTitle || document.title
        }),
      });

      if (debugMode && response.ok) {
        console.log('Event tracked:', event);
      }
    } catch (error) {
      if (debugMode) {
        console.error('Failed to track event:', error);
      }
    }
  };

  // Track conversion function
  const trackConversion = async (
    conversionType: string,
    conversionValue?: number,
    metadata?: Record<string, any>
  ) => {
    try {
      const response = await fetch('/api/analytics/conversion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversionType,
          conversionValue,
          metadata,
          userId
        }),
      });

      if (debugMode && response.ok) {
        console.log('Conversion tracked:', conversionType, conversionValue);
      }
    } catch (error) {
      if (debugMode) {
        console.error('Failed to track conversion:', error);
      }
    }
  };

  // A/B testing function
  const getABTestVariant = async (testName: string): Promise<string> => {
    if (!enableABTesting) return 'control';

    try {
      const response = await fetch(
        `/api/analytics/conversion?action=ab-test-variant&testName=${testName}&userId=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (debugMode) {
          console.log('A/B test variant:', testName, data.variant);
        }
        return data.variant;
      }
    } catch (error) {
      if (debugMode) {
        console.error('Failed to get A/B test variant:', error);
      }
    }

    return 'control';
  };

  // Expose tracking functions to window for global access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).analyticsTracker = {
        trackEvent,
        trackConversion,
        getABTestVariant,
        sessionId
      };
    }
  }, [sessionId]);

  return null;
}

// Utility function to throttle scroll events
function throttle(func: Function, delay: number) {
  let timeoutId: NodeJS.Timeout;
  let lastExecTime = 0;
  
  return function (...args: any[]) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
} 
