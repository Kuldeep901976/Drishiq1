/**
 * Monitoring & Metrics
 * 
 * Tracks key metrics for thread persistence, errors, and RAG operations.
 * 
 * Usage:
 *   metrics.increment('thread_not_found');
 *   metrics.timing('rag.similarity_search_time', duration);
 */

interface MetricData {
  count: number;
  lastUpdated: Date;
}

class MetricsCollector {
  private metrics: Map<string, MetricData> = new Map();

  /**
   * Increment a counter
   */
  increment(metric: string, value: number = 1): void {
    const existing = this.metrics.get(metric) || { count: 0, lastUpdated: new Date() };
    this.metrics.set(metric, {
      count: existing.count + value,
      lastUpdated: new Date()
    });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Metric: ${metric} = ${existing.count + value}`);
    }
  }

  /**
   * Record a timing measurement
   */
  timing(metric: string, durationMs: number): void {
    this.increment(`${metric}.count`);
    this.increment(`${metric}.total_ms`, durationMs);
    
    // Calculate average (simplified - in production, use proper stats)
    const countMetric = this.metrics.get(`${metric}.count`);
    const totalMetric = this.metrics.get(`${metric}.total_ms`);
    if (countMetric && totalMetric) {
      const avg = totalMetric.count / countMetric.count;
      console.log(`⏱️  Timing: ${metric} = ${durationMs}ms (avg: ${avg.toFixed(2)}ms)`);
    }
  }

  /**
   * Get metric value
   */
  get(metric: string): number {
    return this.metrics.get(metric)?.count || 0;
  }

  /**
   * Get all metrics
   */
  getAll(): Record<string, number> {
    const result: Record<string, number> = {};
    this.metrics.forEach((data, key) => {
      result[key] = data.count;
    });
    return result;
  }

  /**
   * Reset metrics (for testing)
   */
  reset(): void {
    this.metrics.clear();
  }
}

export const metrics = new MetricsCollector();

/**
 * Metric names
 */
export const MetricNames = {
  // Thread errors
  THREAD_NOT_FOUND: 'thread_not_found',
  THREAD_PERSIST_QUEUED: 'thread_persist_queued',
  THREAD_PERSIST_FAILED: 'thread_persist_failed',
  UUID_TYPE_ERROR: 'uuid_type_error',
  
  // Handler errors
  HANDLER_API_MISMATCH: 'handler_api_mismatch',
  MODULE_IMPORT_ERROR: 'module_import_error',
  
  // RAG operations
  RAG_MEMORY_WRITES: 'rag.memory_writes',
  RAG_RETRIEVALS: 'rag.retrievals',
  RAG_EMBEDDING_GENERATION_TIME: 'rag.embedding_generation_time',
  RAG_SIMILARITY_SEARCH_TIME: 'rag.similarity_search_time',
  RAG_CONTEXT_SIZE: 'rag.context_size',
  
  // Request tracking
  REQUESTS_TOTAL: 'requests.total',
  REQUESTS_ERRORS: 'requests.errors',
  REQUESTS_SUCCESS: 'requests.success'
} as const;

/**
 * Alert thresholds
 */
export const AlertThresholds = {
  [MetricNames.THREAD_NOT_FOUND]: 10, // Alert if > 10 per hour
  [MetricNames.THREAD_PERSIST_FAILED]: 5, // Alert if > 5 per hour
  [MetricNames.HANDLER_API_MISMATCH]: 1, // Alert if any occur
  [MetricNames.RAG_SIMILARITY_SEARCH_TIME]: 500, // Alert if > 500ms
  [MetricNames.RAG_EMBEDDING_GENERATION_TIME]: 2000 // Alert if > 2s
} as const;

/**
 * Check if metrics exceed thresholds (for alerting)
 */
export function checkAlerts(): Array<{ metric: string; value: number; threshold: number }> {
  const alerts: Array<{ metric: string; value: number; threshold: number }> = [];

  Object.entries(AlertThresholds).forEach(([metric, threshold]) => {
    const value = metrics.get(metric);
    if (value > threshold) {
      alerts.push({ metric, value, threshold });
    }
  });

  return alerts;
}


