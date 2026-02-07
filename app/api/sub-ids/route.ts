/**
 * Sub-Thread ID Signing Endpoint
 * 
 * Generates ephemeral signed sub-thread IDs for frontend use.
 * Frontend cannot create valid signatures - only server can.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSignedSubId } from '@/lib/hmac-signature';
import { getEnhancedThreadManager } from '@/packages/core/persistent-thread-manager-enhanced';
import { createServiceClient } from '@/lib/supabase';

// =====================================================
// POST /api/sub-ids
// =====================================================
// Generate signed sub-thread ID for frontend
// =====================================================

export async function POST(req: NextRequest) {
  try {
    // Get user ID from auth (should be from JWT in production)
    const userId = req.headers.get('x-user-id') || req.headers.get('authorization');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { parent_thread_id, purpose, ttl_seconds } = body;

    if (!parent_thread_id) {
      return NextResponse.json(
        { error: 'parent_thread_id is required' },
        { status: 400 }
      );
    }

    // Verify parent thread exists and belongs to user
    const supabase = createServiceClient();
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('user_id')
      .eq('id', parent_thread_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Parent thread not found or access denied' },
        { status: 403 }
      );
    }

    // Get or create sub-thread (conversation session)
    const threadManager = getEnhancedThreadManager();
    const { subThread } = await threadManager.getOrCreateThreadHierarchy(userId, {
      sessionType: purpose || 'chat',
      meta: {
        purpose: purpose || 'chat',
        requested_at: new Date().toISOString()
      }
    });

    // Generate signed sub-id
    const signedSubId = generateSignedSubId(
      parent_thread_id,
      subThread.id,
      ttl_seconds || 600 // Default 10 minutes
    );

    console.log('✅ Generated signed sub-id:', {
      parentThreadId: parent_thread_id,
      subId: subThread.id,
      expiresAt: signedSubId.expiresAt
    });

    return NextResponse.json({
      sub_id: signedSubId.subId,
      signature: signedSubId.signature,
      expires_at: signedSubId.expiresAt,
      timestamp: signedSubId.timestamp,
      nonce: signedSubId.nonce,
      parent_thread_id: parent_thread_id
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error generating signed sub-id:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate signed sub-id',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

// =====================================================
// GET /api/sub-ids?parent_thread_id=...
// =====================================================
// Get existing signed sub-id for a parent thread
// =====================================================

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const parentThreadId = searchParams.get('parent_thread_id');

    if (!parentThreadId) {
      return NextResponse.json(
        { error: 'parent_thread_id query parameter required' },
        { status: 400 }
      );
    }

    // Get active sub-thread for this parent
    const threadManager = getEnhancedThreadManager();
    const parentThread = await threadManager.getParentThread(userId);
    
    if (!parentThread || parentThread.id !== parentThreadId) {
      return NextResponse.json(
        { error: 'Parent thread not found or access denied' },
        { status: 403 }
      );
    }

    const subThread = await threadManager.getOrCreateSubThread(parentThreadId, userId);

    // Generate signed sub-id
    const signedSubId = generateSignedSubId(parentThreadId, subThread.id);

    return NextResponse.json({
      sub_id: signedSubId.subId,
      signature: signedSubId.signature,
      expires_at: signedSubId.expiresAt,
      timestamp: signedSubId.timestamp,
      nonce: signedSubId.nonce,
      parent_thread_id: parentThreadId
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error getting signed sub-id:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get signed sub-id',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

