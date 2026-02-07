/**
 * R2 Storage Adapter
 * Node/Render version using AWS SDK v3 (@aws-sdk/client-s3, @aws-sdk/s3-request-presigner)
 * For Cloudflare Workers version, see functions/storage/r2Adapter.worker.ts (Phase 4)
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  StorageAdapter,
  UploadIntentParams,
  UploadIntentResult,
} from './storage.interface';
import { generateStorageKey } from './keyGenerator';

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_BUCKET, // Alternative name
  R2_ENDPOINT, // Optional override
  R2_PUBLIC_BASE_URL,
} = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  // We'll still export the class, but it will throw if called without env configured.
  console.warn('[R2Adapter] Missing R2 env vars; adapter will throw if used until configured.');
}

const endpoint = R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

const r2Client = new S3Client({
  region: 'auto',
  endpoint,
  forcePathStyle: false,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
});

// Key generation now uses shared utility from functions/storage/keyGenerator.ts
// Keeping this for backward compatibility, but should use generateStorageKey() instead
function sanitizeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, '_');
}

export class R2Adapter implements StorageAdapter {
  private bucket: string;
  private publicBaseUrl: string;

  constructor() {
    this.bucket = R2_BUCKET_NAME || R2_BUCKET || '';
    this.publicBaseUrl = (R2_PUBLIC_BASE_URL || 'https://cdn.drishiq.com').replace(/\/$/, '');

    if (!this.bucket) {
      throw new Error('R2_BUCKET_NAME or R2_BUCKET environment variable is required');
    }

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error('R2 adapter not configured - missing env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
    }
  }

  async generateUploadIntent(
    params: UploadIntentParams
  ): Promise<UploadIntentResult> {
    const {
      fileName,
      fileSize,
      mimeType,
      category,
      userId,
      expiresInSeconds = 60 * 5, // 5 minutes default
    } = params;

    // Use shared key generation utility for consistency with Worker adapter
    const key = generateStorageKey(category, userId, fileName || 'file');

    // Enforce size limit (10MB)
    const maxBytes = 10 * 1024 * 1024;
    if (fileSize && fileSize > maxBytes) {
      throw new Error(`File too large. Max allowed is ${maxBytes} bytes.`);
    }

    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
      // Optionally set ACL or metadata here if needed
    });

    const uploadUrl = await getSignedUrl(r2Client, cmd, { expiresIn: expiresInSeconds });

    const cdnUrl = `${this.publicBaseUrl}/${key}`;
    const expiresAt = new Date(
      Date.now() + expiresInSeconds * 1000
    ).toISOString();

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

  /**
   * Generate a presigned GET URL for downloading objects (optional)
   */
  async generateGetSignedUrl(key: string, ttlSeconds: number = 3600): Promise<string> {
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(r2Client, cmd, { expiresIn: ttlSeconds });
  }

  async delete(key: string): Promise<boolean> {
    try {
      await r2Client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch (error) {
      console.error('R2Adapter.delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await r2Client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      // For other errors, log and return false
      console.error('R2Adapter.exists error:', error);
      return false;
    }
  }
}
