/**
 * Onboarding Concierge Data Store — Clean architecture.
 * Temp users and tenant only. No thread logic.
 */

import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';

export interface TempUserRow {
  id: string;
  visitor_id: string;
  tenant_id: string | null;
  identity_hash: string | null;
  name: string | null;
  age_range: string | null;
  gender: string | null;
  problem_statement: string | null;
  identity_status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Person identity = hash(visitor_id + device_id + name + age + gender).
 * All parts lowercased and trimmed; null/undefined as empty string.
 */
export function computeIdentityHash(
  visitorId: string,
  deviceId: string,
  name: string | null | undefined,
  age: string | null | undefined,
  gender: string | null | undefined
): string {
  const parts = [
    (visitorId ?? '').toString().toLowerCase().trim(),
    (deviceId ?? '').toString().toLowerCase().trim(),
    (name ?? '').toString().toLowerCase().trim(),
    (age ?? '').toString().toLowerCase().trim(),
    (gender ?? '').toString().toLowerCase().trim(),
  ];
  return crypto.createHash('sha256').update(parts.join('')).digest('hex');
}

/**
 * Get or create temp_user.
 * 1) If name+age+gender present -> lookup by identity_hash
 * 2) Else lookup by visitor_id
 * 3) Else insert new with identity_status 'partial'
 */
export async function getOrCreateTempUser(
  visitorId: string,
  deviceId: string,
  name?: string | null,
  age?: string | null,
  gender?: string | null
): Promise<TempUserRow | null> {
  const supabase = createServiceClient();
  const n = (name ?? '').toString().trim();
  const a = (age ?? '').toString().trim();
  const g = (gender ?? '').toString().trim();
  const hasIdentity = !!(n && a && g);

  if (hasIdentity) {
    const hash = computeIdentityHash(visitorId, deviceId, n, a, g);
    const { data } = await supabase
      .from('temp_users')
      .select('*')
      .eq('identity_hash', hash)
      .is('transferred_to_user_id', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return data as TempUserRow;
  }

  const { data: existing } = await supabase
    .from('temp_users')
    .select('*')
    .eq('visitor_id', visitorId)
    .is('transferred_to_user_id', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return existing as TempUserRow;

  const now = new Date().toISOString();
  const { data: inserted, error } = await supabase
    .from('temp_users')
    .insert({
      visitor_id: visitorId,
      identity_status: 'partial',
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) {
    console.error('getOrCreateTempUser insert error:', error);
    return null;
  }
  return inserted as TempUserRow;
}

/**
 * Update temp_user fields.
 */
export async function updateTempUser(
  tempUserId: string,
  fields: {
    name?: string | null;
    age_range?: string | null;
    gender?: string | null;
    problem_statement?: string | null;
    identity_status?: 'partial' | 'complete';
    identity_hash?: string | null;
  }
): Promise<void> {
  const supabase = createServiceClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.age_range !== undefined) payload.age_range = fields.age_range;
  if (fields.gender !== undefined) payload.gender = fields.gender;
  if (fields.problem_statement !== undefined)
    payload.problem_statement = fields.problem_statement;
  if (fields.identity_status !== undefined)
    payload.identity_status = fields.identity_status;
  if (fields.identity_hash !== undefined)
    payload.identity_hash = fields.identity_hash;

  const { error } = await supabase
    .from('temp_users')
    .update(payload)
    .eq('id', tempUserId);
  if (error) throw error;
}

/**
 * If identity_status === 'complete' and tenant_id is null:
 * insert organization, update temp_users.tenant_id.
 */
export async function ensureTenantForTempUser(
  tempUserId: string
): Promise<string | null> {
  const supabase = createServiceClient();
  const { data: row, error: fetchError } = await supabase
    .from('temp_users')
    .select('id, identity_status, tenant_id, name')
    .eq('id', tempUserId)
    .single();
  if (fetchError || !row) return null;
  if (row.identity_status !== 'complete') return null;
  if (row.tenant_id) return row.tenant_id;

  const name = (row.name && String(row.name).trim()) || `Person ${tempUserId.slice(0, 8)}`;
  const { data: org, error: insertError } = await supabase
    .from('organizations')
    .insert({ name: `Tenant: ${name}`, is_active: true })
    .select('id')
    .single();
  if (insertError || !org?.id) {
    console.error('ensureTenantForTempUser org insert:', insertError);
    return null;
  }

  const { error: updateError } = await supabase
    .from('temp_users')
    .update({
      tenant_id: org.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tempUserId);
  if (updateError) {
    console.error('ensureTenantForTempUser update:', updateError);
    return null;
  }
  return org.id;
}
