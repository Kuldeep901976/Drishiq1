/**
 * Storage Interface
 * Environment-agnostic interface for file storage operations
 * Implementations: R2Adapter, SupabaseStorageAdapter
 */

export interface UploadIntentParams {
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string; // 'avatars' | 'blog-images' | 'reports' | 'testimonials'
  userId: string;
  tenantId?: string;
  expiresInSeconds?: number; // Optional expiration time for signed URLs
}

export interface UploadIntentResult {
  uploadUrl: string; // Signed URL for direct upload
  cdnUrl: string;   // Public CDN URL
  key: string;      // Storage key
  expiresAt: string; // ISO timestamp
}

export interface StorageAdapter {
  /**
   * Generate a signed upload URL for direct client upload
   * Returns upload URL, CDN URL, and storage key
   */
  generateUploadIntent(params: UploadIntentParams): Promise<UploadIntentResult>;

  /**
   * Get public CDN URL for a storage key
   */
  getPublicUrl(key: string): Promise<string>;

  /**
   * Delete a file by storage key
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;
}

