/**
 * Debug endpoint for UPIM classification
 * POST /api/debug/upim
 * 
 * Use case: Paste exact user message, confirm it returns correct category and tags
 */

import { NextRequest, NextResponse } from 'next/server';
import { classifyIntent } from '@/lib/ddsa/upim/intent_classifier';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, tenantId, useLLMFallback = false } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'text (string) is required' },
        { status: 400 }
      );
    }

    const signal = await classifyIntent({
      tenantId,
      text,
      useLLMFallback,
    });

    return NextResponse.json({
      signal,
      input: {
        text: text.substring(0, 200), // Preview
        tenantId,
        useLLMFallback,
      },
    });
  } catch (error: any) {
    console.error('[DEBUG][UPIM] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to classify intent',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/debug/upim',
    method: 'POST',
    body: {
      text: 'string (required)',
      tenantId: 'string (optional)',
      useLLMFallback: 'boolean (optional, default: false)',
    },
  });
}







