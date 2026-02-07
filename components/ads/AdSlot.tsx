/**
 * Ad Slot Component
 * Renders ads in a placement slot
 */

'use client';

import { useEffect, useState, useRef } from 'react';

interface AdSlotProps {
  placement: string;
  className?: string;
  style?: React.CSSProperties;
  onImpression?: () => void;
  onError?: (error: string) => void;
}

interface AdDecision {
  status: 'ok' | 'no_ad' | 'error';
  decision?: {
    creative_id: string;
    line_item_id: string;
    render_type: 'iframe' | 'js' | 'html' | 'vast';
    render_html?: string;
    impression_tracking_url: string;
    click_tracking_url: string;
    expiry_timestamp: string;
    metadata: {
      size?: string;
      provider?: string;
    };
  };
  error?: string;
}

export default function AdSlot({
  placement,
  className = '',
  style,
  onImpression,
  onError,
}: AdSlotProps) {
  const [adDecision, setAdDecision] = useState<AdDecision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionTracked = useRef(false);

  useEffect(() => {
    loadAd();
  }, [placement]);

  const loadAd = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get anon_id from cookie or generate
      const anonId = getAnonId();
      
      // Get user context
      const deviceType = getDeviceType();
      const pagePath = window.location.pathname;
      const queryParams = Object.fromEntries(new URLSearchParams(window.location.search));

      // Build decision API URL
      const params = new URLSearchParams({
        placement,
        anon_id: anonId,
        device: deviceType,
        page: pagePath,
        ...(queryParams && { query_params: JSON.stringify(queryParams) }),
      });

      const response = await fetch(`/api/ads/decision?${params}`);
      const decision: AdDecision = await response.json();

      if (decision.status === 'ok' && decision.decision) {
        setAdDecision(decision);
      } else if (decision.status === 'no_ad') {
        setAdDecision(null);
      } else {
        setError(decision.error || 'Failed to load ad');
        onError?.(decision.error || 'Failed to load ad');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adDecision?.decision && !impressionTracked.current) {
      trackImpression(adDecision.decision);
      impressionTracked.current = true;
      onImpression?.();
    }
  }, [adDecision]);

  const trackImpression = async (decision: AdDecision['decision']) => {
    if (!decision) return;

    try {
      const anonId = getAnonId();
      await fetch('/api/ads/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'impression',
          creative_id: decision.creative_id,
          line_item_id: decision.line_item_id,
          placement_id: placement,
          anon_id: anonId,
          metadata: {
            device_type: getDeviceType(),
            page_url: window.location.href,
            query_params: Object.fromEntries(new URLSearchParams(window.location.search)),
          },
        }),
      });
    } catch (err) {
      console.error('Failed to track impression:', err);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (adDecision?.decision?.click_tracking_url) {
      // Track click
      const anonId = getAnonId();
      fetch('/api/ads/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'click',
          creative_id: adDecision.decision.creative_id,
          line_item_id: adDecision.decision.line_item_id,
          placement_id: placement,
          anon_id: anonId,
        }),
      }).catch(console.error);

      // Redirect through tracking URL
      window.location.href = adDecision.decision.click_tracking_url;
    }
  };

  if (loading) {
    return (
      <div className={`ad-slot-loading ${className}`} style={style}>
        <div className="text-center text-gray-400 text-sm py-4">Loading ad...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`ad-slot-error ${className}`} style={style}>
        <div className="text-center text-gray-400 text-xs py-2">Ad unavailable</div>
      </div>
    );
  }

  if (!adDecision?.decision) {
    return null; // No ad to show
  }

  const { decision } = adDecision;

  return (
    <div
      ref={containerRef}
      className={`ad-slot ${className}`}
      style={style}
      onClick={handleClick}
    >
      {decision.render_type === 'iframe' && decision.render_html && (
        <div dangerouslySetInnerHTML={{ __html: decision.render_html }} />
      )}
      {decision.render_type === 'html' && decision.render_html && (
        <div dangerouslySetInnerHTML={{ __html: decision.render_html }} />
      )}
      {decision.render_type === 'js' && decision.render_html && (
        <div dangerouslySetInnerHTML={{ __html: decision.render_html }} />
      )}
      {decision.render_type === 'vast' && (
        <div className="ad-vast-container">
          {/* VAST video player would be initialized here */}
          <div dangerouslySetInnerHTML={{ __html: decision.render_html || '' }} />
        </div>
      )}
    </div>
  );
}

/**
 * Get or create anonymous ID
 */
function getAnonId(): string {
  if (typeof window === 'undefined') return '';

  // Try to get from cookie
  const cookies = document.cookie.split(';');
  const anonCookie = cookies.find(c => c.trim().startsWith('anon_id='));
  if (anonCookie) {
    return anonCookie.split('=')[1];
  }

  // Generate new anon ID
  const newAnonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  // Set cookie (expires in 1 year)
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `anon_id=${newAnonId}; expires=${expires.toUTCString()}; path=/`;

  return newAnonId;
}

/**
 * Detect device type
 */
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

