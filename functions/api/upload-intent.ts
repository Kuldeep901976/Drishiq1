/**
 * Upload Intent Endpoint (Cloudflare Workers)
 * Returns upload intent with R2 key and CDN URL
 * Mirrors the contract from app/api/upload-intent/route.ts
 * 
 * POST /api/upload-intent
 */

import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../types/env';
import { WorkerR2Adapter } from '../storage/r2Adapter.worker';

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const { env, request } = ctx;

    // Parse request body
    const body = await request.json();
    const { fileName, fileSize, mimeType, category, userId, tenantId } = body;

    // Validation
    if (!fileName || !fileSize || !mimeType || !category || !userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: fileName, fileSize, mimeType, category, userId',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate file size (10MB default limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate category
    const validCategories = ['avatars', 'blog-images', 'reports', 'testimonials', 'media'];
    if (!validCategories.includes(category)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check R2 bucket binding
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

    // Check per-tenant quota (via Supabase REST API)
    if (tenantId) {
      try {
        const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseServiceKey) {
          // Get current usage
          const usageResponse = await fetch(
            `${supabaseUrl}/rest/v1/file_uploads?tenant_id=eq.${tenantId}&deleted_at=is.null&select=size_bytes`,
            {
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Prefer': 'count=exact',
              },
            }
          );

          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            const currentUsage = Array.isArray(usageData)
              ? usageData.reduce((sum: number, row: any) => sum + (row.size_bytes || 0), 0)
              : 0;
            
            const defaultQuotaMB = 1000; // 1GB default per tenant
            const quotaBytes = defaultQuotaMB * 1024 * 1024;
            const newUsage = currentUsage + fileSize;

            if (newUsage > quotaBytes) {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: `Storage quota exceeded. Current: ${(currentUsage / 1024 / 1024).toFixed(2)}MB, Limit: ${defaultQuotaMB}MB`,
                }),
                {
                  status: 403,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            }
          }
        }
      } catch (quotaError: any) {
        console.warn('⚠️ Quota check error:', quotaError);
        // Fail open - allow upload if quota check fails
      }
    }

    // Initialize R2 adapter
    const publicBaseUrl = env.R2_PUBLIC_BASE_URL || 'https://cdn.drishiq.com';
    const bucketName = env.R2_BUCKET_NAME || 'drishiq-uploads';
    const adapter = new WorkerR2Adapter(
      env.DRISHIQ_UPLOADS,
      publicBaseUrl,
      bucketName
    );

    // Determine Worker base URL for upload-proxy
    // In production, this should be the actual Worker domain
    // For now, use relative path (will work with same-origin requests)
    const workerBaseUrl = env.NEXT_PUBLIC_APP_URL || 
                         (request.headers.get('Origin') || '').replace(/\/$/, '') ||
                         undefined;

    // Generate upload intent
    const intent = await adapter.generateUploadIntent({
      fileName,
      fileSize,
      mimeType,
      category,
      userId,
      tenantId,
    }, workerBaseUrl);

    // Save to database (file_uploads table) via Supabase REST API
    // We use the Supabase REST API directly since we're in a Worker
    try {
      const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        const dbResponse = await fetch(
          `${supabaseUrl}/rest/v1/file_uploads`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              tenant_id: tenantId ?? null,
              user_id: userId,
              category,
              storage_provider: 'r2',
              key: intent.key,
              cdn_url: intent.cdnUrl,
              size_bytes: fileSize,
              mime_type: mimeType,
              file_name: fileName,
            }),
          }
        );

        if (!dbResponse.ok) {
          const errorText = await dbResponse.text();
          console.warn('file_uploads insert failed:', errorText);
          // Don't fail the whole flow for analytics error
        }
      } else {
        console.warn('Supabase credentials not configured, skipping file_uploads insert');
      }
    } catch (dbError: any) {
      console.warn('⚠️ file_uploads table insert error:', dbError.message);
      // Continue anyway - this is expected during migration
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: 'proxy', // Indicates Worker proxy mode (vs presigned)
        uploadUrl: intent.uploadUrl,
        cdnUrl: intent.cdnUrl,
        key: intent.key,
        expiresAt: intent.expiresAt,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('upload-intent error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'UPLOAD_INTENT_FAILED',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

