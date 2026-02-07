/**
 * Storage Service
 * Factory that provides the appropriate storage adapter based on environment
 */

import type { StorageAdapter } from './storage.interface';
import { R2Adapter } from './r2Adapter';
import { SupabaseStorageAdapter } from './supabaseStorageAdapter';

export type StorageProvider = 'r2' | 'supabase';

/**
 * Get storage service instance
 * Uses environment variable to determine provider
 * 
 * @param supabaseClient - Optional Supabase client (required for Supabase adapter, ignored for R2)
 * @returns StorageAdapter instance
 */
export function getStorageService(supabaseClient?: any): StorageAdapter {
  const provider = (process.env.STORAGE_PROVIDER?.toLowerCase() || 'supabase') as StorageProvider;

  if (provider === 'r2') {
    return new R2Adapter();
  }

  // Default: Supabase
  if (!supabaseClient) {
    throw new Error('SupabaseStorageAdapter requires a Supabase client. Pass supabaseClient to getStorageService() or use createServiceClient().');
  }
  
  return new SupabaseStorageAdapter(supabaseClient);
}

