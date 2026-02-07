/**
 * Frequency Cap Utilities
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if user has exceeded frequency cap for a line item
 */
export async function checkFrequencyCap(
  supabase: SupabaseClient,
  lineItemId: string,
  anonId: string,
  userId?: string
): Promise<boolean> {
  try {
    // Get line item frequency cap settings
    const { data: lineItem, error: lineItemError } = await supabase
      .from('line_items')
      .select('freq_cap_count, freq_cap_window_seconds')
      .eq('id', lineItemId)
      .eq('status', 'active')
      .single();

    if (lineItemError || !lineItem) {
      return true; // If line item not found, allow (fail open)
    }

    // If no frequency cap, allow
    if (!lineItem.freq_cap_count || !lineItem.freq_cap_window_seconds) {
      return true;
    }

    // Calculate window
    const now = new Date();
    const windowEnd = now;
    const windowStart = new Date(now.getTime() - lineItem.freq_cap_window_seconds * 1000);

    // Check frequency cap tracking
    const { data: tracking, error: trackingError } = await supabase
      .from('frequency_cap_tracking')
      .select('impression_count')
      .eq('line_item_id', lineItemId)
      .eq('anon_id', anonId)
      .gte('window_end', windowStart.toISOString())
      .lte('window_start', windowEnd.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .single();

    if (trackingError || !tracking) {
      return true; // No tracking record means under cap
    }

    // Check if count exceeds cap
    return (tracking.impression_count || 0) < lineItem.freq_cap_count;
  } catch (error) {
    // Fail open on error
    console.error('Frequency cap check error:', error);
    return true;
  }
}

/**
 * Record frequency cap impression
 */
export async function recordFrequencyCapImpression(
  supabase: SupabaseClient,
  lineItemId: string,
  anonId: string,
  userId?: string
): Promise<void> {
  try {
    // Get line item frequency cap settings
    const { data: lineItem } = await supabase
      .from('line_items')
      .select('freq_cap_count, freq_cap_window_seconds')
      .eq('id', lineItemId)
      .single();

    if (!lineItem || !lineItem.freq_cap_count || !lineItem.freq_cap_window_seconds) {
      return; // No frequency cap, nothing to record
    }

    // Calculate window
    const now = new Date();
    const windowEnd = now;
    const windowStart = new Date(now.getTime() - lineItem.freq_cap_window_seconds * 1000);

    // Upsert frequency cap tracking
    await supabase
      .from('frequency_cap_tracking')
      .upsert({
        line_item_id: lineItemId,
        user_id: userId || null,
        anon_id: anonId,
        impression_count: 1,
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString(),
      }, {
        onConflict: 'line_item_id,anon_id,window_start',
        ignoreDuplicates: false,
      });

    // Increment count if record exists
    await supabase.rpc('increment_frequency_cap', {
      p_line_item_id: lineItemId,
      p_anon_id: anonId,
    }).catch(() => {
      // If RPC doesn't exist, use update
      supabase
        .from('frequency_cap_tracking')
        .update({ impression_count: supabase.raw('impression_count + 1') })
        .eq('line_item_id', lineItemId)
        .eq('anon_id', anonId)
        .gte('window_end', windowStart.toISOString())
        .lte('window_start', windowEnd.toISOString());
    });
  } catch (error) {
    console.error('Frequency cap recording error:', error);
    // Fail silently - don't block ad serving
  }
}

