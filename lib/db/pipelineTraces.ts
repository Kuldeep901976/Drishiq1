// lib/db/pipelineTraces.ts
/**
 * Pipeline traces persistence adapter
 * Writes pipeline execution traces to pipeline_traces table
 */

import type { PoolClient } from 'pg';
import { getPgClient, withTenantContext } from '@/lib/db/postgres-pool';
import { createServiceClient } from '@/lib/supabase';

export interface PipelineTraceInsert {
  traceId: string;
  threadId: string;
  tenantId?: string | null;
  stageId?: string | null;
  startTime: Date;
  endTime: Date;
  latencyMs: number;
  status: 'started' | 'completed' | 'failed';
  outputDelta?: any | null;
  error?: any | null;
}

/**
 * Insert a pipeline trace entry
 * Uses PostgreSQL with RLS if tenantId is provided, falls back to Supabase
 */
export async function insertPipelineTrace(payload: PipelineTraceInsert): Promise<any | null> {
  const {
    traceId,
    threadId,
    tenantId,
    stageId,
    startTime,
    endTime,
    latencyMs,
    status,
    outputDelta,
    error
  } = payload;

  try {
    if (tenantId) {
      // Use PostgreSQL with RLS context
      return await withTenantContext(tenantId, async (client: PoolClient) => {
        const q = `
          INSERT INTO pipeline_traces (
            trace_id, thread_id, tenant_id, stage_id,
            start_ts, end_ts, latency_ms, status,
            output_delta
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *;
        `;
        const params = [
          traceId,
          threadId,
          tenantId,
          stageId || null,
          startTime.toISOString(),
          endTime.toISOString(),
          latencyMs,
          status,
          outputDelta ? JSON.stringify(outputDelta) : null
        ];
        const r = await client.query(q, params);
        return r.rows[0];
      });
    } else {
      // Use direct PostgreSQL connection (no RLS)
      const client = await getPgClient();
      try {
        const q = `
          INSERT INTO pipeline_traces (
            trace_id, thread_id, tenant_id, stage_id,
            start_ts, end_ts, latency_ms, status,
            output_delta
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *;
        `;
        const params = [
          traceId,
          threadId,
          tenantId || null,
          stageId || null,
          startTime.toISOString(),
          endTime.toISOString(),
          latencyMs,
          status,
          outputDelta ? JSON.stringify(outputDelta) : null
        ];
        const r = await client.query(q, params);
        return r.rows[0];
      } finally {
        client.release();
      }
    }
  } catch (pgErr: any) {
    // Fallback to Supabase
    try {
      const supabase = createServiceClient();
      const { data, error: supabaseError } = await supabase
        .from('pipeline_traces')
        .insert({
          trace_id: traceId,
          thread_id: threadId,
          tenant_id: tenantId || null,
          stage_id: stageId || null,
          start_ts: startTime.toISOString(),
          end_ts: endTime.toISOString(),
          latency_ms: latencyMs,
          status,
          output_delta: outputDelta || null
        })
        .select()
        .single();

      if (supabaseError) {
        console.warn('⚠️ insertPipelineTrace supabase fallback error:', supabaseError);
        return null;
      }
      return data;
    } catch (supabaseErr) {
      console.error('❌ insertPipelineTrace fallback failed:', supabaseErr);
      return null;
    }
  }
}

