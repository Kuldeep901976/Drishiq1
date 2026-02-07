/**
 * Thread Persistence Worker
 * 
 * Processes pending jobs from thread_persistence_queue table.
 * Retries failed thread persistence with exponential backoff.
 * 
 * Usage:
 * - Run as cron job (every 5 minutes)
 * - Or use BullMQ/other job queue
 * - Or run as background worker process
 */

import { createServiceClient } from '@/lib/supabase';
import { getSimpleThreadManager } from '@/packages/core/simple-thread-manager';

interface ThreadPersistenceJob {
  id: string;
  user_id: string;
  session_data: any;
  assistant_thread_id?: string;
  retry_count: number;
  max_retries: number;
  metadata?: any;
}

/**
 * Process a single pending job
 */
async function processJob(job: ThreadPersistenceJob): Promise<{ success: boolean; error?: string }> {
  const tenantId = (job.metadata as any)?.tenantId;
  const supabase = createServiceClient();
  const manager = getSimpleThreadManager();

  try {
    // Set tenant context if available
    if (tenantId) {
      const { withTenantContext } = await import('@/lib/db/postgres-pool');
      return await withTenantContext(tenantId, async (client) => {
        // Mark as processing
        await client.query('SELECT mark_thread_job_processing($1)', [job.id]);

        // Try to create session
        const session = await manager.getOrCreateCurrentSession(job.user_id, {
          sessionType: job.session_data.sessionType || 'general',
          assistantThreadId: job.session_data.assistantThreadId,
          metadata: job.session_data.metadata || {}
        });

        // Mark as succeeded
        await client.query('SELECT mark_thread_job_succeeded($1)', [job.id]);

        console.log(`✅ Processed thread persistence job ${job.id} for user ${job.user_id}, session ${session.id}`);
        return { success: true };
      });
    }

    // Fallback for jobs without tenantId
    // Mark as processing
    await supabase.rpc('mark_thread_job_processing', { job_id: job.id });

    // Try to create session
    const session = await manager.getOrCreateCurrentSession(job.user_id, {
      sessionType: job.session_data.sessionType || 'general',
      assistantThreadId: job.session_data.assistantThreadId,
      metadata: job.session_data.metadata || {}
    });

    // Mark as succeeded
    await supabase.rpc('mark_thread_job_succeeded', { job_id: job.id });

    console.log(`✅ Processed thread persistence job ${job.id} for user ${job.user_id}, session ${session.id}`);
    return { success: true };
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    const errorCode = error?.code || 'UNKNOWN_ERROR';

    // Mark as failed (or pending for retry if retries remaining)
    if (tenantId) {
      try {
        const { withTenantContext } = await import('@/lib/db/postgres-pool');
        await withTenantContext(tenantId, async (client) => {
          await client.query('SELECT mark_thread_job_failed($1, $2, $3)', [job.id, errorMessage, errorCode]);
        });
      } catch (rlsError) {
        // Fallback to Supabase if RLS fails
        await supabase.rpc('mark_thread_job_failed', {
          job_id: job.id,
          error_msg: errorMessage,
          error_code: errorCode
        });
      }
    } else {
      await supabase.rpc('mark_thread_job_failed', {
        job_id: job.id,
        error_msg: errorMessage,
        error_code: errorCode
      });
    }

    console.error(`❌ Failed to process thread persistence job ${job.id}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get next pending job from queue
 */
async function getNextPendingJob(): Promise<ThreadPersistenceJob | null> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase.rpc('get_next_pending_thread_job');

    if (error) {
      console.error('❌ Error getting next pending job:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0] as ThreadPersistenceJob;
  } catch (error: any) {
    console.error('❌ Exception getting next pending job:', error);
    return null;
  }
}

/**
 * Process all pending jobs (up to maxJobs limit)
 */
export async function processPendingJobs(maxJobs: number = 10): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  while (processed < maxJobs) {
    const job = await getNextPendingJob();

    if (!job) {
      break; // No more pending jobs
    }

    const result = await processJob(job);
    processed++;

    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }

    // Small delay between jobs to avoid overwhelming DB
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { processed, succeeded, failed };
}

/**
 * Main worker function (for cron/background process)
 */
export async function runWorker(): Promise<void> {
  console.log('🔄 Starting thread persistence worker...');

  const result = await processPendingJobs(50); // Process up to 50 jobs per run

  console.log('✅ Worker completed:', {
    processed: result.processed,
    succeeded: result.succeeded,
    failed: result.failed
  });
}

// If running as standalone script
if (require.main === module) {
  runWorker()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Worker failed:', error);
      process.exit(1);
    });
}


