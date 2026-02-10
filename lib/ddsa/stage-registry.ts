/**
 * DDSA stage registry. Load stages from DB; stub returns empty until DB table exists.
 */

export interface RegisteredStage {
  id: string;
  name: string;
  [key: string]: unknown;
}

export async function loadAllStagesFromDB(): Promise<RegisteredStage[]> {
  // Stub: return empty array. Replace with Supabase/DB query when stages table is available.
  return [];
}
