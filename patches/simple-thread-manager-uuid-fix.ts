/**
 * PATCH: packages/core/simple-thread-manager.ts - UUID Validation & Casting
 * 
 * This patch adds explicit UUID validation and ensures proper type handling.
 * 
 * Changes:
 * - Add explicit UUID validation before DB operations
 * - Ensure user_id is properly cast (Supabase should handle, but validate)
 * - Add better error messages for UUID type mismatches
 */

// =====================================================
// PATCH LOCATION: In getOrCreateCurrentSession (around line 129)
// =====================================================

// ADD AT THE START OF getOrCreateCurrentSession:
async getOrCreateCurrentSession(
  userId: string,
  options?: {
    sessionType?: string;
    assistantThreadId?: string;
    metadata?: Record<string, any>;
  }
): Promise<ConversationSession> {
  if (!supabase) {
    throw new ThreadPersistenceError(
      'Supabase not initialized - cannot get or create session',
      'DATABASE_NOT_INITIALIZED',
      503
    );
  }

  // VALIDATE UUID FORMAT (already exists, but ensure it's called)
  this.validateUUID(userId, 'user_id');

  // ... rest of existing code ...

  // IN THE INSERT (around line 200), ensure sessionData is properly typed:
  const sessionData: any = {
    user_id: userId, // Supabase client should handle UUID casting, but ensure DB column is UUID type
    session_type: options?.sessionType || 'general',
    status: 'active',
    is_current_session: true,
    metadata: options?.metadata || {},
    started_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString()
  };

  // Add assistant_thread_id if provided
  if (options?.assistantThreadId) {
    // Validate assistant thread ID format
    if (!options.assistantThreadId.startsWith('thread_')) {
      throw new ThreadPersistenceError(
        `Invalid assistant thread ID format: must start with "thread_", got ${options.assistantThreadId.substring(0, 20)}...`,
        'INVALID_ASSISTANT_THREAD_ID',
        400
      );
    }
    sessionData.assistant_thread_id = options.assistantThreadId;
  }

  // ... rest of existing insert code ...

  // ENHANCE ERROR HANDLING (around line 206):
  if (createError) {
    // Check for specific error codes
    if (createError.code === '23505') { // Unique violation
      throw new ThreadPersistenceError(
        `Session already exists: ${createError.message}`,
        'SESSION_ALREADY_EXISTS',
        409
      );
    }
    if (createError.code === '42883' || createError.message?.includes('operator does not exist')) {
      // Enhanced error message with suggestion
      throw new ThreadPersistenceError(
        `UUID type mismatch: ${createError.message}. Ensure migration 20250122_fix_uuid_types_and_defaults.sql has been run and conversation_sessions.user_id is UUID type.`,
        'UUID_TYPE_ERROR',
        500
      );
    }
    if (createError.code === 'PGRST116') {
      throw new ThreadPersistenceError(
        `Table not found: conversation_sessions. Ensure database migrations have been run.`,
        'SCHEMA_ERROR',
        500
      );
    }
    throw new ThreadPersistenceError(
      `Failed to create session: ${createError.message}`,
      'SESSION_CREATE_FAILED',
      500
    );
  }

  // ... rest of existing code ...
}

// =====================================================
// ENSURE validateUUID METHOD EXISTS (around line 100-120)
// =====================================================

// ADD IF NOT EXISTS:
private validateUUID(id: string, fieldName: string = 'ID'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ThreadPersistenceError(
      `Invalid ${fieldName} format: expected UUID, got ${id.substring(0, 20)}...`,
      'INVALID_UUID_FORMAT',
      400
    );
  }
}


