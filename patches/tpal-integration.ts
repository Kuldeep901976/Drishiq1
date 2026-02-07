/**
 * PATCH: Thread Persistence Assurance Layer (TPAL) Integration
 * 
 * This patch adds TPAL queue integration to simple-thread-manager.ts
 * to handle failed thread persistence with retry mechanism.
 * 
 * Changes:
 * - Add queue insertion on failure
 * - Return THREAD_SYNC_PENDING status
 * - Add ensureThread helper
 */

// =====================================================
// PATCH LOCATION: packages/core/simple-thread-manager.ts
// =====================================================

// ADD NEW METHOD: ensureThread (around line 260, after updateAssistantThreadId)

/**
 * Ensure thread exists in DB, or enqueue for retry
 * Returns session if exists, creates new if not, or enqueues if creation fails
 */
async ensureThread(
  userId: string,
  options?: {
    sessionType?: string;
    assistantThreadId?: string;
    metadata?: Record<string, any>;
  }
): Promise<{ session: ConversationSession; status: 'created' | 'existing' | 'queued' }> {
  if (!supabase) {
    throw new ThreadPersistenceError(
      'Supabase not initialized',
      'DATABASE_NOT_INITIALIZED',
      503
    );
  }

  this.validateUUID(userId, 'user_id');

  try {
    // Try to get existing session
    const existing = await this.getOrCreateCurrentSession(userId, options);
    return { session: existing, status: 'existing' };
  } catch (error: any) {
    // If error is UUID type mismatch or DB error, enqueue for retry
    if (error instanceof ThreadPersistenceError && 
        (error.code === 'UUID_TYPE_ERROR' || error.code === 'SESSION_CREATE_FAILED')) {
      
      // Enqueue for retry
      await this.enqueueThreadPersistence({
        userId,
        sessionData: {
          sessionType: options?.sessionType || 'general',
          assistantThreadId: options?.assistantThreadId,
          metadata: options?.metadata || {}
        },
        errorMessage: error.message,
        errorCode: error.code
      });

      // Return queued status (caller should handle THREAD_SYNC_PENDING)
      throw new ThreadPersistenceError(
        'Thread persistence queued for retry',
        'THREAD_SYNC_PENDING',
        202 // Accepted - will be processed asynchronously
      );
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Enqueue thread persistence job
 */
private async enqueueThreadPersistence(job: {
  userId: string;
  sessionData: any;
  errorMessage?: string;
  errorCode?: string;
}): Promise<void> {
  if (!supabase) {
    console.error('❌ Cannot enqueue: Supabase not initialized');
    return;
  }

  try {
    const { error } = await supabase
      .from('thread_persistence_queue')
      .insert({
        user_id: job.userId,
        session_data: job.sessionData,
        assistant_thread_id: job.sessionData.assistantThreadId || null,
        error_message: job.errorMessage || null,
        error_code: job.errorCode || null,
        status: 'pending',
        retry_count: 0,
        max_retries: 3
      });

    if (error) {
      console.error('❌ Failed to enqueue thread persistence:', error);
      // Don't throw - logging is enough, original error was already thrown
    } else {
      console.log('✅ Thread persistence queued for retry:', job.userId);
    }
  } catch (e: any) {
    console.error('❌ Exception enqueueing thread persistence:', e);
    // Don't throw - original error is more important
  }
}

// =====================================================
// UPDATE getOrCreateCurrentSession to use ensureThread (optional)
// =====================================================

// Optionally, update getOrCreateCurrentSession to call ensureThread:
// async getOrCreateCurrentSession(...) {
//   try {
//     return await this.ensureThread(userId, options);
//   } catch (error: any) {
//     if (error.code === 'THREAD_SYNC_PENDING') {
//       // Return a temporary session object with queued status
//       // Or throw to let route handle it
//       throw error;
//     }
//     throw error;
//   }
// }


