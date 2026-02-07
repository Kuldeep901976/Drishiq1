/**
 * PATCH: app/api/chat/route.ts - Error Helper Fallback
 * 
 * This patch adds a fallback mechanism for createErrorResponse import
 * to handle webpack bundling issues.
 * 
 * Changes:
 * - Add dynamic import fallback if static import fails
 * - Add runtime validation
 */

// =====================================================
// PATCH LOCATION: At top of file (around line 23)
// =====================================================

// REPLACE THIS:
// import { createErrorResponse, getStatusCodeForErrorCode } from "@/lib/errors";
// import { resolveSimpleChatHandler } from "@/packages/handlers/simple-chat-handler.adapter";

// WITH THIS:
import { createErrorResponse as _createErrorResponse, getStatusCodeForErrorCode as _getStatusCodeForErrorCode } from "@/lib/errors";
import { resolveSimpleChatHandler } from "@/packages/handlers/simple-chat-handler.adapter";

// Fallback for error helpers if webpack doesn't import correctly
let createErrorResponse = _createErrorResponse;
let getStatusCodeForErrorCode = _getStatusCodeForErrorCode;

// Runtime validation and fallback
if (typeof createErrorResponse !== 'function') {
  console.warn('⚠️ createErrorResponse not found in static import, will use dynamic import');
  // Will be loaded dynamically in POST handler
}

// Helper to ensure error helpers are available
async function ensureErrorHelpers() {
  if (typeof createErrorResponse === 'function' && typeof getStatusCodeForErrorCode === 'function') {
    return { createErrorResponse, getStatusCodeForErrorCode };
  }

  // Dynamic import fallback
  try {
    const errorsModule = await import('@/lib/errors');
    createErrorResponse = errorsModule.createErrorResponse || errorsModule.default?.createErrorResponse;
    getStatusCodeForErrorCode = errorsModule.getStatusCodeForErrorCode || errorsModule.default?.getStatusCodeForErrorCode;

    if (!createErrorResponse || typeof createErrorResponse !== 'function') {
      throw new Error('createErrorResponse not found in errors module');
    }

    return { createErrorResponse, getStatusCodeForErrorCode };
  } catch (e: any) {
    console.error('❌ Failed to load error helpers:', e);
    // Ultimate fallback
    return {
      createErrorResponse: (payload: any, httpStatus: number = 500) => {
        return NextResponse.json({
          status: 'error',
          code: payload.code || 'INTERNAL_SERVER_ERROR',
          message: payload.message || 'Unexpected error',
          requestId: payload.requestId,
          details: payload.details
        }, { status: httpStatus });
      },
      getStatusCodeForErrorCode: (code: string) => {
        const statusMap: Record<string, number> = {
          'INVALID_CONTENT_TYPE': 415,
          'INVALID_REQUEST_BODY': 400,
          'MISSING_MESSAGE': 400,
          'VALIDATION_ERROR': 400,
          'INVALID_FEEDBACK_FORMAT': 400,
          'INVALID_THREAD_ID': 400,
          'INVALID_ASSISTANT_THREAD_ID': 400,
          'INVALID_UUID_FORMAT': 400,
          'AUTHENTICATION_ERROR': 401,
          'UNAUTHORIZED': 401,
          'AUTHORIZATION_ERROR': 403,
          'THREAD_FORBIDDEN': 403,
          'THREAD_NOT_FOUND': 404,
          'SESSION_ALREADY_EXISTS': 409,
          'EXTERNAL_API_ERROR': 502,
          'DATABASE_ERROR': 503,
          'DATABASE_NOT_INITIALIZED': 503,
          'DATABASE_QUERY_ERROR': 503,
          'TIMEOUT_ERROR': 504
        };
        return statusMap[code] || 500;
      }
    };
  }
}

// =====================================================
// PATCH LOCATION: At start of POST handler (around line 711)
// =====================================================

// ADD AT THE START OF POST HANDLER:
export async function POST(req: NextRequest) {
  // Generate request ID for tracking
  const requestId = crypto.randomUUID?.() || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  // Ensure error helpers are available
  const errorHelpers = await ensureErrorHelpers();
  const createErrorResponse = errorHelpers.createErrorResponse;
  const getStatusCodeForErrorCode = errorHelpers.getStatusCodeForErrorCode;

  // ... rest of existing code ...


