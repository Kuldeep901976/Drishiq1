/**
 * Time-of-day from timezone for greeter context.
 * Uses visitor's timezone so greeting can be time-aware.
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Returns time of day in the given timezone.
 * Uses new Date().toLocaleString('en-US', { timeZone }).
 */
export function getTimeOfDay(timezone: string | null | undefined): TimeOfDay {
  if (!timezone?.trim()) return 'morning';
  try {
    const hourStr = new Date().toLocaleString('en-US', {
      timeZone: timezone.trim(),
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(hourStr, 10);
    if (Number.isNaN(hour)) return 'morning';
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  } catch {
    return 'morning';
  }
}
