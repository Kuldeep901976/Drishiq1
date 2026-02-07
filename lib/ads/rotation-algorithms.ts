/**
 * Ad Rotation Algorithms
 * Implements various rotation strategies for selecting creatives
 */

export interface LineItem {
  id: string;
  creative_id: string;
  priority: number;
  weight: number;
  served_impressions?: number;
  max_impressions_total?: number;
  max_impressions_daily?: number;
  status: string;
}

export type RotationStrategy = 'weighted_random' | 'even_distribution' | 'priority_first' | 'sequential' | 'ab_test';

/**
 * Select a line item using weighted random rotation
 */
export function weightedRandomRotation(lineItems: LineItem[]): LineItem | null {
  if (lineItems.length === 0) return null;

  // Filter active items
  const activeItems = lineItems.filter(item => item.status === 'active');
  if (activeItems.length === 0) return null;

  // Calculate total weight
  const totalWeight = activeItems.reduce((sum, item) => sum + (item.weight || 1), 0);
  if (totalWeight === 0) {
    // If all weights are 0, fall back to equal probability
    const randomIndex = Math.floor(Math.random() * activeItems.length);
    return activeItems[randomIndex];
  }

  // Generate random number
  let random = Math.random() * totalWeight;

  // Select item based on weight
  for (const item of activeItems) {
    random -= (item.weight || 1);
    if (random <= 0) {
      return item;
    }
  }

  // Fallback to last item
  return activeItems[activeItems.length - 1];
}

/**
 * Select a line item using even distribution (lowest served impressions)
 */
export function evenDistributionRotation(lineItems: LineItem[]): LineItem | null {
  if (lineItems.length === 0) return null;

  const activeItems = lineItems.filter(item => item.status === 'active');
  if (activeItems.length === 0) return null;

  // Sort by served impressions (ascending), then by priority (descending)
  const sorted = [...activeItems].sort((a, b) => {
    const aImpr = a.served_impressions || 0;
    const bImpr = b.served_impressions || 0;
    if (aImpr !== bImpr) {
      return aImpr - bImpr;
    }
    return (b.priority || 0) - (a.priority || 0);
  });

  return sorted[0];
}

/**
 * Select a line item using priority-first rotation
 */
export function priorityFirstRotation(lineItems: LineItem[]): LineItem | null {
  if (lineItems.length === 0) return null;

  const activeItems = lineItems.filter(item => item.status === 'active');
  if (activeItems.length === 0) return null;

  // Sort by priority (descending), then by weight (descending)
  const sorted = [...activeItems].sort((a, b) => {
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return (b.weight || 0) - (a.weight || 0);
  });

  // Check if highest priority item has available budget/caps
  const topItem = sorted[0];
  if (hasAvailableBudget(topItem)) {
    return topItem;
  }

  // Find first item with available budget
  for (const item of sorted) {
    if (hasAvailableBudget(item)) {
      return item;
    }
  }

  // If no item has budget, return top priority anyway (for fallback)
  return topItem;
}

/**
 * Select a line item using sequential rotation
 */
export function sequentialRotation(lineItems: LineItem[], lastServedIndex: number = -1): LineItem | null {
  if (lineItems.length === 0) return null;

  const activeItems = lineItems.filter(item => item.status === 'active');
  if (activeItems.length === 0) return null;

  // Sort by priority, then by ID for deterministic ordering
  const sorted = [...activeItems].sort((a, b) => {
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return a.id.localeCompare(b.id);
  });

  // Get next item in sequence
  const nextIndex = (lastServedIndex + 1) % sorted.length;
  return sorted[nextIndex];
}

/**
 * Select a line item using A/B test bucketing
 * Deterministically assigns users to variants based on anon_id hash
 */
export function abTestRotation(lineItems: LineItem[], anonId: string): LineItem | null {
  if (lineItems.length === 0) return null;

  const activeItems = lineItems.filter(item => item.status === 'active');
  if (activeItems.length === 0) return null;

  // Sort by priority, then by ID for deterministic ordering
  const sorted = [...activeItems].sort((a, b) => {
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return a.id.localeCompare(b.id);
  });

  // Hash anon_id to get deterministic bucket
  const hash = simpleHash(anonId);
  const bucket = hash % sorted.length;
  
  return sorted[Math.abs(bucket)];
}

/**
 * Simple hash function for deterministic bucketing
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if line item has available budget/caps
 */
function hasAvailableBudget(item: LineItem): boolean {
  // Check total impression cap
  if (item.max_impressions_total !== null && item.max_impressions_total !== undefined) {
    const served = item.served_impressions || 0;
    if (served >= item.max_impressions_total) {
      return false;
    }
  }

  // Daily cap would need to be checked separately with date context
  // For now, assume it's available if total cap is available

  return true;
}

/**
 * Main rotation function that selects algorithm based on strategy
 */
export function rotateLineItems(
  lineItems: LineItem[],
  strategy: RotationStrategy,
  context?: {
    anonId?: string;
    lastServedIndex?: number;
  }
): LineItem | null {
  switch (strategy) {
    case 'weighted_random':
      return weightedRandomRotation(lineItems);
    case 'even_distribution':
      return evenDistributionRotation(lineItems);
    case 'priority_first':
      return priorityFirstRotation(lineItems);
    case 'sequential':
      return sequentialRotation(lineItems, context?.lastServedIndex);
    case 'ab_test':
      if (!context?.anonId) {
        // Fallback to weighted random if no anon_id
        return weightedRandomRotation(lineItems);
      }
      return abTestRotation(lineItems, context.anonId);
    default:
      return weightedRandomRotation(lineItems);
  }
}

