/**
 * Avatar Upload Endpoint
 * Uses storage abstraction (R2 or Supabase)
 * For direct uploads, use /api/upload-intent instead
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/lib/storage/storageService';
import { createServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    const userId = formData.get('userId') as string;
    const tenantId = formData.get('tenantId') as string | undefined;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get storage service
    const supabase = createServiceClient();
    const storage = getStorageService(supabase);

    // Generate upload intent
    const intent = await storage.generateUploadIntent({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      category: 'avatars',
      userId,
      tenantId,
    });

    // For Supabase Storage, the uploadUrl is a special format
    // Client should use supabase.storage.from(bucket).upload() directly
    // For R2, client uploads directly to the signed URL
    
    if (intent.uploadUrl.startsWith('supabase://')) {
      // Extract bucket and path from special format
      const [bucket, ...pathParts] = intent.uploadUrl.replace('supabase://', '').split('/');
      const path = pathParts.join('/');
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }
    } else {
      // For R2, return the signed URL for client-side upload
      // Client will upload directly to R2
      return NextResponse.json({
        url: intent.cdnUrl,
        uploadUrl: intent.uploadUrl, // Client uses this for direct upload
        key: intent.key,
      });
    }

    // Save to database
    try {
      await supabase
        .from('file_uploads')
        .insert({
          tenant_id: tenantId || null,
          user_id: userId,
          category: 'avatars',
          storage_provider: process.env.STORAGE_PROVIDER?.toLowerCase() === 'r2' ? 'r2' : 'supabase',
          key: intent.key,
          cdn_url: intent.cdnUrl,
          size_bytes: file.size,
          mime_type: file.type,
          file_name: file.name,
        });
    } catch (dbError: any) {
      console.warn('⚠️ Failed to save file_uploads record:', dbError.message);
      // Continue anyway
    }

    return NextResponse.json({
      url: intent.cdnUrl,
      key: intent.key,
    });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Avatar upload failed' },
      { status: 500 }
    );
  }
}

