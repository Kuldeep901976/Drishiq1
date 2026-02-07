/**
 * Upload Proxy Endpoint (Cloudflare Workers)
 * Accepts file uploads and writes them to R2
 * 
 * PUT /api/upload-proxy?key=<storage-key>
 * POST /api/upload-proxy?key=<storage-key>
 * 
 * Headers:
 *   Content-Type: <mime-type>
 *   X-User-Id: <userId> (optional, for validation)
 *   X-Tenant-Id: <tenantId> (optional, for validation)
 * 
 * Body: File bytes
 */

import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../types/env';
import { validateStorageKey, parseStorageKey } from '../storage/keyGenerator';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed content types by category
const ALLOWED_CONTENT_TYPES: Record<string, string[]> = {
  avatars: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  'blog-images': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  reports: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
  testimonials: ['image/jpeg', 'image/png', 'text/plain'],
  media: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'],
};

export const onRequestPut: PagesFunction<Env> = async (ctx) => {
  return handleUpload(ctx);
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  return handleUpload(ctx);
};

async function handleUpload(ctx: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = ctx;

  try {
    // 1. Validate R2 bucket binding
    if (!env.DRISHIQ_UPLOADS) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'R2 bucket not configured',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Extract and validate key from query parameter
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing key query parameter',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!validateStorageKey(key)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid storage key format',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Parse key to extract metadata
    const keyMetadata = parseStorageKey(key);
    if (!keyMetadata) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse storage key',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Validate Content-Type
    const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
    const allowedTypes = ALLOWED_CONTENT_TYPES[keyMetadata.category] || ['application/octet-stream'];
    
    if (!allowedTypes.includes(contentType) && !allowedTypes.includes('application/octet-stream')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Content-Type ${contentType} not allowed for category ${keyMetadata.category}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. Validate file size
    const contentLength = request.headers.get('Content-Length');
    if (contentLength) {
      const fileSize = parseInt(contentLength, 10);
      if (fileSize > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          }),
          {
            status: 413,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 6. Optional: Validate userId matches key (if provided)
    const userIdHeader = request.headers.get('X-User-Id');
    if (userIdHeader && userIdHeader !== keyMetadata.userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User ID mismatch',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 7. Read file body
    const fileBytes = await request.arrayBuffer();
    
    // Validate actual file size (if Content-Length was missing)
    if (fileBytes.byteLength > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 8. Write to R2
    try {
      await env.DRISHIQ_UPLOADS.put(key, fileBytes, {
        httpMetadata: {
          contentType,
        },
        customMetadata: {
          userId: keyMetadata.userId,
          category: keyMetadata.category,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (r2Error: any) {
      console.error('R2 put error:', r2Error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to upload file to R2',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 9. Build CDN URL
    const publicBaseUrl = env.R2_PUBLIC_BASE_URL || 'https://cdn.drishiq.com';
    const cdnUrl = `${publicBaseUrl.replace(/\/$/, '')}/${key}`;

    // 10. Return success
    return new Response(
      JSON.stringify({
        success: true,
        key,
        cdnUrl,
        size: fileBytes.byteLength,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('upload-proxy error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Upload proxy failed',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}






