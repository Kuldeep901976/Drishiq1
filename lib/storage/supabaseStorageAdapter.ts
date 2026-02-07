/**
 * Supabase Storage Adapter
 * Wraps existing Supabase Storage calls to match StorageAdapter interface
 */

import type { StorageAdapter, UploadIntentParams, UploadIntentResult } from './storage.interface';
import { generateStorageKey } from './keyGenerator';

export class SupabaseStorageAdapter implements StorageAdapter {
  private supabaseClient: any; // Supabase client
  private bucketMap: Record<string, string>; // Maps category to bucket name

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
    
    // Map categories to Supabase buckets (existing buckets)
    this.bucketMap = {
      'avatars': 'avatars',
      'blog-images': 'blog-images',
      'reports': 'reports',
      'testimonials': 'public',
      'media': 'media-files',
    };
  }

  /**
   * Generate upload intent for Supabase Storage
   * Note: Supabase doesn't support signed URLs the same way as R2
   * This returns a direct upload URL that requires authentication
   */
  async generateUploadIntent(params: UploadIntentParams): Promise<UploadIntentResult> {
    const bucket = this.bucketMap[params.category] || 'uploads';
    const key = this.generateKey(params.category, params.userId, params.fileName);
    
    // Generate public URL (Supabase Storage public URLs)
    const { data: urlData } = this.supabaseClient.storage
      .from(bucket)
      .getPublicUrl(key);
    
    const cdnUrl = urlData.publicUrl;
    
    // For Supabase, we return the storage path as the "upload URL"
    // The client will use supabase.storage.from(bucket).upload() directly
    // This is a compatibility shim - in Phase 3.2, we'll migrate to R2 signed URLs
    const uploadUrl = `supabase://${bucket}/${key}`;
    
    return {
      uploadUrl, // Special format for Supabase
      cdnUrl,
      key: `${bucket}/${key}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    };
  }

  async getPublicUrl(key: string): Promise<string> {
    // Key format: "bucket/path" or just "path"
    const [bucket, ...pathParts] = key.split('/');
    const path = pathParts.join('/');
    
    const { data } = this.supabaseClient.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  async delete(key: string): Promise<boolean> {
    const [bucket, ...pathParts] = key.split('/');
    const path = pathParts.join('/');
    
    const { error } = await this.supabaseClient.storage
      .from(bucket)
      .remove([path]);
    
    return !error;
  }

  async exists(key: string): Promise<boolean> {
    // Supabase doesn't have a direct "exists" API
    // We can try to list the file or use getPublicUrl and check
    // For now, return true (optimistic)
    // TODO: Implement proper exists check if needed
    return true;
  }

  /**
   * Generate storage key based on category and user
   * Uses shared key generator for consistency, but applies Supabase-specific formatting
   */
  private generateKey(category: string, userId: string, fileName: string): string {
    // Use shared key generator for consistency
    // Supabase adapter may apply additional formatting per category if needed
    const baseKey = generateStorageKey(category, userId, fileName);
    
    // For Supabase, we may need to adjust the key format per category
    // For now, use the shared format for consistency
    // If category-specific formatting is needed, apply it here
    if (category === 'avatars') {
      // Supabase avatars bucket expects profile-images/ prefix
      const parts = baseKey.split('/');
      if (parts.length >= 3) {
        return `profile-images/${parts[1]}/${parts[2]}`;
      }
    }
    
    return baseKey;
  }

  private getExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : 'bin';
  }
}

