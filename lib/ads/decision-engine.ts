/**
 * Ad Decision Engine
 * Core logic for selecting which ad to serve for a given placement
 */

import { evaluateTargeting, compileTargetingRule, type TargetingRule, type UserContext } from './targeting-evaluator';
import { rotateLineItems, type LineItem, type RotationStrategy } from './rotation-algorithms';

export interface DecisionRequest {
  placement_code: string;
  user_id?: string;
  anon_id: string;
  page_path?: string;
  query_params?: Record<string, string>;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  country?: string;
  region?: string;
  city?: string;
  referrer?: string;
  user_agent?: string;
  ip?: string;
  custom_context?: Record<string, any>;
}

export interface DecisionResponse {
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
      campaign_id?: string;
    };
  };
  debug?: {
    reason?: string;
    evaluated_items?: number;
    filtered_items?: number;
  };
  error?: string;
}

export interface LineItemWithContext extends LineItem {
  creative_id: string;
  campaign_id: string;
  placement_id: string;
  targeting?: TargetingRule | null;
  start_at: string;
  end_at: string;
  rotation_strategy?: RotationStrategy;
  creative_type?: string;
  creative_file_url?: string;
  creative_third_party_tag?: string;
  creative_click_url?: string;
  creative_width?: number;
  creative_height?: number;
}

/**
 * Make ad decision for a placement
 */
export async function makeAdDecision(
  request: DecisionRequest,
  getLineItems: (placementCode: string) => Promise<LineItemWithContext[]>,
  checkFrequencyCap: (lineItemId: string, anonId: string, userId?: string) => Promise<boolean>,
  getProviderTag?: (placementCode: string) => Promise<string | null>
): Promise<DecisionResponse> {
  try {
    // Build user context
    const userContext: UserContext = {
      country: request.country,
      region: request.region,
      city: request.city,
      device: request.device_type,
      page: {
        path: request.page_path,
        query_params: request.query_params,
      },
      referrer: request.referrer,
      custom: request.custom_context,
      // User context would be enriched from database if user_id is provided
      user: request.user_id ? {
        is_logged_in: true,
        user_id: request.user_id,
      } : {
        is_logged_in: false,
      },
      time: {
        hour: new Date().getHours(),
        day_of_week: new Date().getDay(),
      },
    };

    // Get active line items for placement
    const allLineItems = await getLineItems(request.placement_code);
    
    if (allLineItems.length === 0) {
      // Try provider fallback
      if (getProviderTag) {
        const providerTag = await getProviderTag(request.placement_code);
        if (providerTag) {
          return {
            status: 'ok',
            decision: {
              creative_id: 'provider',
              line_item_id: 'provider',
              render_type: 'js',
              render_html: providerTag,
              impression_tracking_url: '',
              click_tracking_url: '',
              expiry_timestamp: new Date(Date.now() + 3600000).toISOString(),
              metadata: {
                provider: 'third_party',
              },
            },
            debug: {
              reason: 'provider_fallback',
            },
          };
        }
      }
      return {
        status: 'no_ad',
        debug: {
          reason: 'no_line_items',
        },
      };
    }

    // Filter by schedule (active now)
    const now = new Date();
    const scheduledItems = allLineItems.filter(item => {
      const start = new Date(item.start_at);
      const end = new Date(item.end_at);
      return now >= start && now <= end && item.status === 'active';
    });

    if (scheduledItems.length === 0) {
      return {
        status: 'no_ad',
        debug: {
          reason: 'no_scheduled_items',
          evaluated_items: allLineItems.length,
        },
      };
    }

    // Filter by targeting
    const targetingMatches: LineItemWithContext[] = [];
    for (const item of scheduledItems) {
      const targeting = item.targeting ? compileTargetingRule(item.targeting) : null;
      if (evaluateTargeting(targeting, userContext)) {
        targetingMatches.push(item);
      }
    }

    if (targetingMatches.length === 0) {
      return {
        status: 'no_ad',
        debug: {
          reason: 'no_targeting_matches',
          evaluated_items: scheduledItems.length,
        },
      };
    }

    // Filter by frequency caps
    const frequencyCapPassed: LineItemWithContext[] = [];
    for (const item of targetingMatches) {
      const passed = await checkFrequencyCap(item.id, request.anon_id, request.user_id);
      if (passed) {
        frequencyCapPassed.push(item);
      }
    }

    if (frequencyCapPassed.length === 0) {
      return {
        status: 'no_ad',
        debug: {
          reason: 'frequency_cap_exceeded',
          evaluated_items: targetingMatches.length,
        },
      };
    }

    // Check budget/caps (simplified - would need real-time budget tracking)
    const budgetAvailable = frequencyCapPassed.filter(item => {
      // Check if item has available budget
      // This would query actual served impressions vs caps
      return true; // Simplified for now
    });

    if (budgetAvailable.length === 0) {
      return {
        status: 'no_ad',
        debug: {
          reason: 'budget_exhausted',
          evaluated_items: frequencyCapPassed.length,
        },
      };
    }

    // Apply rotation strategy
    const rotationStrategy = budgetAvailable[0].rotation_strategy || 'weighted_random';
    const selectedItem = rotateLineItems(
      budgetAvailable,
      rotationStrategy,
      {
        anonId: request.anon_id,
      }
    );

    if (!selectedItem) {
      return {
        status: 'no_ad',
        debug: {
          reason: 'rotation_failed',
          evaluated_items: budgetAvailable.length,
        },
      };
    }

    // Build decision response
    const decision: DecisionResponse['decision'] = {
      creative_id: selectedItem.creative_id,
      line_item_id: selectedItem.id,
      render_type: getRenderType(selectedItem.creative_type || 'banner', selectedItem.creative_third_party_tag),
      render_html: getRenderHtml(selectedItem),
      impression_tracking_url: `/api/ads/event?type=impression&line_item_id=${selectedItem.id}&creative_id=${selectedItem.creative_id}`,
      click_tracking_url: `/api/ads/track/click?line_item_id=${selectedItem.id}&creative_id=${selectedItem.creative_id}`,
      expiry_timestamp: new Date(Date.now() + 3600000).toISOString(), // 1 hour expiry
      metadata: {
        size: selectedItem.creative_width && selectedItem.creative_height
          ? `${selectedItem.creative_width}x${selectedItem.creative_height}`
          : undefined,
        provider: selectedItem.creative_third_party_tag ? 'third_party' : 'internal',
        campaign_id: selectedItem.campaign_id,
      },
    };

    return {
      status: 'ok',
      decision,
      debug: {
        reason: `selected_by_${rotationStrategy}`,
        evaluated_items: allLineItems.length,
        filtered_items: budgetAvailable.length,
      },
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Determine render type based on creative type and third-party tag
 */
function getRenderType(creativeType: string, thirdPartyTag?: string | null): 'iframe' | 'js' | 'html' | 'vast' {
  if (thirdPartyTag) {
    if (thirdPartyTag.includes('VAST') || thirdPartyTag.includes('vast')) {
      return 'vast';
    }
    if (thirdPartyTag.includes('<script') || thirdPartyTag.includes('javascript:')) {
      return 'js';
    }
    return 'html';
  }

  switch (creativeType) {
    case 'video':
      return 'vast';
    case 'html':
      return 'html';
    default:
      return 'iframe';
  }
}

/**
 * Generate render HTML for creative
 */
function getRenderHtml(item: LineItemWithContext): string {
  if (item.creative_third_party_tag) {
    return item.creative_third_party_tag;
  }

  if (item.creative_type === 'html' && item.creative_file_url) {
    // HTML creatives should be served in iframe for security
    return `<iframe src="${item.creative_file_url}" sandbox="allow-scripts allow-same-origin" style="border: none; width: ${item.creative_width || '100%'}; height: ${item.creative_height || '100%'};"></iframe>`;
  }

  if (item.creative_file_url) {
    // Image/video creatives
    const clickUrl = item.creative_click_url || '#';
    return `<a href="${clickUrl}" target="_blank" rel="noopener noreferrer"><img src="${item.creative_file_url}" alt="Advertisement" style="max-width: 100%; height: auto;" /></a>`;
  }

  return '';
}

