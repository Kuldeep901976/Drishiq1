// lib/jobs/aiJobs.ts
import type { PoolClient } from 'pg';
import { getPgClient, withTenantContext } from '@/lib/db/postgres-pool';
import { createResponse } from '@/lib/responses/responsesClient';
import { insertAiResponse } from '@/lib/db/aiResponses';
import { createHash } from 'crypto';
import { PersistentThreadManager } from '@/packages/core/persistent-thread-manager';

export interface ScheduleJobOpts {
  jobType: string; // 'assistant-response'
  threadId: string;
  tenantId?: string | null;
  stageRef?: string | null;
  payload: any;
}

/**
 * Schedule a background job for Responses API call
 */
export async function scheduleJob(opts: ScheduleJobOpts) {
  const client = await getPgClient();
  try {
    const q = `
      INSERT INTO ai_jobs (job_type, thread_id, tenant_id, stage_ref, payload)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const params = [
      opts.jobType,
      opts.threadId,
      opts.tenantId || null,
      opts.stageRef || null,
      JSON.stringify(opts.payload)
    ];
    const r = await client.query(q, params);
    return r.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Get job status by ID
 */
export async function getJobStatus(jobId: string) {
  const client = await getPgClient();
  try {
    const r = await client.query('SELECT * FROM ai_jobs WHERE id = $1', [jobId]);
    return r.rows[0] ?? null;
  } finally {
    client.release();
  }
}

/**
 * Worker: pick pending jobs and execute them.
 * Keep idempotent - uses FOR UPDATE SKIP LOCKED to avoid duplicate work in concurrent workers.
 * 
 * @param limit Maximum number of jobs to process in this run
 */
export async function runPendingJobsOnce(limit = 10) {
  const client = await getPgClient();
  try {
    // Simple selection with row-level locking to prevent concurrent processing
    const sel = await client.query(`
      SELECT id, job_type, thread_id, tenant_id, stage_ref, payload
      FROM ai_jobs
      WHERE status = 'pending'
      ORDER BY created_at
      LIMIT $1
      FOR UPDATE SKIP LOCKED
    `, [limit]);

    for (const row of sel.rows) {
      const jobId = row.id;
      try {
        // Mark job as in progress
        await client.query(
          'UPDATE ai_jobs SET status=$1, started_at=NOW(), attempts = attempts + 1 WHERE id = $2',
          ['in_progress', jobId]
        );

        if (row.job_type === 'assistant-response') {
          const payload = row.payload;

          // Call Responses API
          const resp = await createResponse({
            model: payload.model || 'gpt-4-turbo',
            input: payload.input,
            // pass metadata so responsesClient can compute hashes if implemented
            metadata: { thread_id: row.thread_id, stage: row.stage_ref }
          }, row.tenant_id ?? undefined);

          // Compute or read hashes (responsesClient may already compute them)
          const promptHash = resp._prompt_hash ?? createHash('sha256')
            .update(JSON.stringify(payload.input))
            .digest('hex');
          const responseHash = resp._response_hash ?? createHash('sha256')
            .update(JSON.stringify(resp))
            .digest('hex');
          const providerResponseId = resp.id ?? (resp.output?.[0]?.id ?? null);

          // Persist ai_responses (observability)
          await insertAiResponse({
            responseId: providerResponseId ?? undefined,
            threadId: row.thread_id,
            tenantId: row.tenant_id ?? undefined,
            stageRef: row.stage_ref ?? undefined,
            model: payload.model ?? undefined,
            requestPayload: { input: payload.input },
            responsePayload: resp,
            promptHash,
            responseHash,
            tokensIn: resp?.usage?.prompt_tokens ?? null,
            tokensOut: resp?.usage?.completion_tokens ?? null,
            totalTokens: resp?.usage?.total_tokens ?? null,
            latencyMs: resp?._latency_ms ?? null
          });

          // Persist assistant message into chat_messages via threadManager
          const tm = new PersistentThreadManager();
          const content = (resp.output?.[0]?.content?.[0]?.text ?? resp.output_text ?? '').toString();
          
          await tm.addMessage(row.thread_id, {
            id: `assistant_${Date.now()}`,
            threadId: row.thread_id,
            role: 'assistant',
            content: content,
            messageType: 'text',
            tags: [],
            metadata: {
              provider_response_id: providerResponseId,
              prompt_hash: promptHash,
              response_hash: responseHash,
              model: payload.model
            },
            createdAt: new Date(),
            processingTimeMs: resp?._latency_ms ?? 0
          });

          // Mark job completed
          await client.query(
            `UPDATE ai_jobs 
             SET status=$1, completed_at=NOW(), result=$2, provider_response_id=$3, prompt_hash=$4, response_hash=$5 
             WHERE id=$6`,
            ['completed', JSON.stringify(resp), providerResponseId, promptHash, responseHash, jobId]
          );
        } else {
          // Unsupported job type
          await client.query(
            'UPDATE ai_jobs SET status=$1, error_text=$2 WHERE id=$3',
            ['failed', `unsupported job_type:${row.job_type}`, jobId]
          );
        }
      } catch (jobErr: any) {
        const errText = jobErr?.message?.substring(0, 1000) ?? 'unknown';
        await client.query(
          'UPDATE ai_jobs SET status=$1, error_text=$2 WHERE id=$3',
          ['failed', errText, row.id]
        );
        console.error('Job failed', row.id, errText);
      }
    }

    return sel.rows.length; // Return number of jobs processed
  } finally {
    client.release();
  }
}

/**
 * Poll job status with exponential backoff
 * 
 * @param jobId Job ID to poll
 * @param maxAttempts Maximum polling attempts
 * @param initialDelayMs Initial delay in milliseconds
 * @returns Job status or null if not found
 */
export async function pollJobStatus(
  jobId: string,
  maxAttempts = 12,
  initialDelayMs = 1000
): Promise<any | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const jobStatus = await getJobStatus(jobId);
    
    if (!jobStatus) {
      return null; // Job not found
    }
    
    if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
      return jobStatus; // Final state reached
    }
    
    // Exponential backoff: 1s, 2s, 4s, 5s, 5s, ...
    const delay = Math.min(initialDelayMs * Math.pow(2, attempt), 5000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  
  // Max attempts reached, return current status
  return await getJobStatus(jobId);
}

