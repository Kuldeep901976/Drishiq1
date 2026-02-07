/**
 * Upload Intent Endpoint
 * Returns signed upload URL and CDN URL for direct client upload
 * Uses storage abstraction (R2 or Supabase)
 * Includes per-tenant quota checks and audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/lib/storage/storageService';
import { createServiceClient } from '@/lib/supabase';
import { resolveTenantId } from '@/app/api/middleware/tenant';
import audit from '@/lib/audit';

/**
 * Check per-tenant storage quota
 * Returns { allowed: boolean, reason?: string, currentUsage?: number, limit?: number }
 */
async function checkTenantQuota(
  supabase: any,
  tenantId: string | undefined,
  fileSize: number
): Promise<{ allowed: boolean; reason?: string; currentUsage?: number; limit?: number }> {
  if (!tenantId) {
    // No tenant = no quota check (single-tenant mode)
    return { allowed: true };
  }

  try {
    // Get tenant config for quota limits
    // TODO: Add storage_quota_mb to tenant_config table in future
    // For now, use default limit
    const defaultQuotaMB = 1000; // 1GB default per tenant
    const quotaBytes = defaultQuotaMB * 1024 * 1024;

    // Calculate current usage for this tenant
    const { data: usageData, error: usageError } = await supabase
      .from('file_uploads')
      .select('size_bytes')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (usageError) {
      console.warn('⚠️ Failed to check tenant quota:', usageError);
      // Allow upload if quota check fails (fail open)
      return { allowed: true };
    }

    const currentUsage = usageData?.reduce((sum: number, row: any) => sum + (row.size_bytes || 0), 0) || 0;
    const newUsage = currentUsage + fileSize;

    if (newUsage > quotaBytes) {
      return {
        allowed: false,
        reason: `Storage quota exceeded. Current: ${(currentUsage / 1024 / 1024).toFixed(2)}MB, Limit: ${defaultQuotaMB}MB`,
        currentUsage,
        limit: quotaBytes,
      };
    }

    return {
      allowed: true,
      currentUsage,
      limit: quotaBytes,
    };
  } catch (error: any) {
    console.warn('⚠️ Quota check error:', error);
    // Fail open - allow upload if quota check fails
    return { allowed: true };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let tenantId: string | undefined;
  let userId: string | undefined;

  try {
    const body = await request.json();
    const { fileName, fileSize, mimeType, category, userId: bodyUserId, tenantId: bodyTenantId } = body;

    userId = bodyUserId;
    tenantId = bodyTenantId || resolveTenantId(request);

    // Validation
    if (!fileName || !fileSize || !mimeType || !category || !userId) {
      const error = 'Missing required fields: fileName, fileSize, mimeType, category, userId';
      await audit.log('UPLOAD_INTENT_FAILED', {
        error,
        userId,
        tenantId,
        category,
      }, tenantId);
      
      return NextResponse.json(
        { success: false, error },
        { status: 400 }
      );
    }

    // Validate file size (10MB default limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      const error = `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`;
      await audit.log('UPLOAD_INTENT_FAILED', {
        error,
        userId,
        tenantId,
        category,
        fileSize,
        maxSize,
      }, tenantId);
      
      return NextResponse.json(
        { success: false, error },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['avatars', 'blog-images', 'reports', 'testimonials', 'media'];
    if (!validCategories.includes(category)) {
      const error = `Invalid category. Must be one of: ${validCategories.join(', ')}`;
      await audit.log('UPLOAD_INTENT_FAILED', {
        error,
        userId,
        tenantId,
        category,
      }, tenantId);
      
      return NextResponse.json(
        { success: false, error },
        { status: 400 }
      );
    }

    // Get storage service
    const supabase = createServiceClient();
    
    // Check per-tenant quota
    const quotaCheck = await checkTenantQuota(supabase, tenantId, fileSize);
    if (!quotaCheck.allowed) {
      await audit.log('UPLOAD_INTENT_QUOTA_EXCEEDED', {
        userId,
        tenantId,
        category,
        fileSize,
        currentUsage: quotaCheck.currentUsage,
        limit: quotaCheck.limit,
        reason: quotaCheck.reason,
      }, tenantId);
      
      return NextResponse.json(
        { success: false, error: quotaCheck.reason || 'Storage quota exceeded' },
        { status: 403 }
      );
    }

    const storage = getStorageService(supabase);

    // Generate upload intent
    const intent = await storage.generateUploadIntent({
      fileName,
      fileSize,
      mimeType,
      category,
      userId,
      tenantId,
    });

    // Determine storage provider
    const provider = process.env.STORAGE_PROVIDER?.toLowerCase() === 'r2' ? 'r2' : 'supabase';

    // Save to database (file_uploads table)
    try {
      const { error: dbError } = await supabase
        .from('file_uploads')
        .insert({
          tenant_id: tenantId ?? null,
          user_id: userId,
          category,
          storage_provider: provider,
          key: intent.key,
          cdn_url: intent.cdnUrl,
          size_bytes: fileSize,
          mime_type: mimeType,
          file_name: fileName,
        });

      if (dbError) {
        console.error('file_uploads insert failed:', dbError);
        // Don't fail the whole flow for analytics error, but log it
      }
    } catch (dbError: any) {
      console.warn('⚠️ file_uploads table may not exist yet:', dbError.message);
      // Continue anyway - this is expected during migration
    }

    // Audit log successful upload intent
    const latencyMs = Date.now() - startTime;
    await audit.log('UPLOAD_INTENT_CREATED', {
      userId,
      tenantId,
      category,
      fileName,
      fileSize,
      mimeType,
      storageProvider: provider,
      key: intent.key,
      cdnUrl: intent.cdnUrl,
      expiresAt: intent.expiresAt,
      quotaUsage: quotaCheck.currentUsage,
      quotaLimit: quotaCheck.limit,
      latencyMs,
    }, tenantId);

    return NextResponse.json({
      success: true,
      uploadUrl: intent.uploadUrl,
      cdnUrl: intent.cdnUrl,
      key: intent.key,
      expiresAt: intent.expiresAt,
    }, { status: 200 });
  } catch (error: any) {
    console.error('upload-intent error:', error);
    
    // Audit log error
    await audit.log('UPLOAD_INTENT_FAILED', {
      error: error.message || 'UPLOAD_INTENT_FAILED',
      userId,
      tenantId,
      latencyMs: Date.now() - startTime,
    }, tenantId);
    
    return NextResponse.json(
      { success: false, error: error.message || 'UPLOAD_INTENT_FAILED' },
      { status: 500 }
    );
  }
}

