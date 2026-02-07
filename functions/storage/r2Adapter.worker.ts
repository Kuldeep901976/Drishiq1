/**
 * R2 Storage Adapter for Cloudflare Workers
 * Uses native R2 bindings for operations
 * For Node/Render version, see lib/storage/r2Adapter.ts
 */

import type {
  StorageAdapter,
  UploadIntentParams,
  UploadIntentResult,
} from '../../../lib/storage/storage.interface';
import { generateStorageKey } from './keyGenerator';

// Note: For presigned URLs, we'll use a server-side proxy approach initially
// In production, you can implement proper AWS Signature v4 presigned URLs
// or use a library like @aws-sdk/s3-request-presigner (if compatible with Workers)

/**
 * WorkerR2Adapter - Cloudflare Workers implementation
 * Uses env.DRISHIQ_UPLOADS R2 binding and env.R2_PUBLIC_BASE_URL
 */
export class WorkerR2Adapter implements StorageAdapter {
  private bucket: R2Bucket;
  private publicBaseUrl: string;
  private bucketName: string;

  constructor(
    bucket: R2Bucket,
    publicBaseUrl: string,
    bucketName: string
  ) {
    this.bucket = bucket;
    this.publicBaseUrl = publicBaseUrl.replace(/\/$/, '');
    this.bucketName = bucketName;

    if (!bucket) {
      throw new Error('R2 bucket binding is required');
    }
  }

  async generateUploadIntent(
    params: UploadIntentParams,
    workerBaseUrl?: string
  ): Promise<UploadIntentResult> {
    const {
      fileName,
      fileSize,
      mimeType,
      category,
      userId,
      expiresInSeconds = 60 * 5, // 5 minutes default
    } = params;

    // Generate key using shared utility
    const key = generateStorageKey(category, userId, fileName || 'file');

    // Enforce size limit (10MB)
    const maxBytes = 10 * 1024 * 1024;
    if (fileSize && fileSize > maxBytes) {
      throw new Error(`File too large. Max allowed is ${maxBytes} bytes.`);
    }

    const cdnUrl = `${this.publicBaseUrl}/${key}`;
    const expiresAt = new Date(
      Date.now() + expiresInSeconds * 1000
    ).toISOString();

    // Generate Worker proxy URL for upload
    // If workerBaseUrl is provided, use it; otherwise use relative path
    const uploadUrl = workerBaseUrl
      ? `${workerBaseUrl}/api/upload-proxy?key=${encodeURIComponent(key)}`
      : `/api/upload-proxy?key=${encodeURIComponent(key)}`;
    
    return {
      uploadUrl,
      cdnUrl,
      key,
      expiresAt,
    };
  }

  async getPublicUrl(key: string): Promise<string> {
    return `${this.publicBaseUrl}/${key}`;
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.bucket.delete(key);
      return true;
    } catch (error) {
      console.error('WorkerR2Adapter.delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const object = await this.bucket.head(key);
      return !!object;
    } catch (error: any) {
      return false;
    }
  }
}

