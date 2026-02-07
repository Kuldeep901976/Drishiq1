// =====================================================
// NEXT.JS INSTRUMENTATION
// =====================================================
// Instrumentation hook for Next.js
// This file is compiled for both Node.js and Edge runtimes
// The simple-chat-handler is validated at runtime when first used
// =====================================================

/**
 * Register instrumentation hook
 * Called by Next.js during server startup for both Node.js and Edge runtimes
 * 
 * IMPORTANT: This function must be compatible with both runtimes:
 * - Node.js runtime: Full Node.js APIs available
 * - Edge runtime: Limited APIs (no Node.js modules like 'fs', 'path', etc.)
 */
export async function register() {
  const runtime = process.env.NEXT_RUNTIME || 'unknown';
  
  try {
    // Handle Node.js runtime
    if (runtime === 'nodejs') {
      // Module startup checks removed - webpack export issues make them unreliable
      // Validation happens at runtime when the handler is first used in /api/chat
      // This is more reliable and doesn't block server startup
      
      // Optional: Add Node.js-specific initialization here
      // Example: Database connection pooling, file system checks, etc.
    } 
    // Handle Edge runtime
    else if (runtime === 'edge') {
      // Edge runtime - no initialization needed
      // This ensures edge-instrumentation.js is generated correctly
      // Edge runtime has limited APIs, so keep this minimal
      
      // Optional: Add Edge-specific initialization here
      // Note: Cannot use Node.js modules (fs, path, etc.) in Edge runtime
    }
    // Unknown runtime - log warning but don't fail
    else {
      // This should not happen in normal Next.js operation
      // But we handle it gracefully to prevent build failures
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(`[instrumentation] Unknown runtime: ${runtime}`);
      }
    }
  } catch (error) {
    // Gracefully handle any errors during instrumentation
    // Don't block server startup if instrumentation fails
    if (typeof console !== 'undefined' && console.error) {
      console.error('[instrumentation] Error during registration:', error);
    }
    // Re-throw only in development to catch issues early
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
  }
}

