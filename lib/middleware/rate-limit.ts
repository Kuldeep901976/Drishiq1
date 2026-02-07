// lib/middleware/rate-limit.ts
/**
 * Simple in-memory rate limiter using leaky bucket algorithm
 * 
 * For production with multiple instances, use Redis-based rate limiting
 * (e.g., @upstash/ratelimit or ioredis with rate-limit-redis)
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

type Bucket = { tokens: number; lastRefill: number };

// In-memory bucket storage
// TODO: Replace with Redis for multi-instance deployments
const buckets = new Map<string, Bucket>();

/**
 * Check if a request should be allowed based on rate limit
 * 
 * @param key Unique key for rate limiting (e.g., `tenant:${tenantId}:provider:${providerName}`)
 * @param capacity Maximum number of tokens (requests) allowed
 * @param refillPerSec Number of tokens to refill per second
 * @returns true if request is allowed, false if rate limit exceeded
 */
export function allowRequest(
  key: string,
  capacity = 60,
  refillPerSec = 1
): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Calculate elapsed time and refill tokens
  const elapsed = (now - bucket.lastRefill) / 1000;
  const refill = Math.floor(elapsed * refillPerSec);

  if (refill > 0) {
    bucket.tokens = Math.min(capacity, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  // Check if we have tokens available
  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return true;
  }

  return false;
}

/**
 * Get current token count for a key (for monitoring/debugging)
 */
export function getTokenCount(key: string): number {
  const bucket = buckets.get(key);
  return bucket?.tokens ?? 0;
}

/**
 * Reset a bucket (useful for testing or manual overrides)
 */
export function resetBucket(key: string): void {
  buckets.delete(key);
}

/**
 * Clear all buckets (useful for testing)
 */
export function clearAllBuckets(): void {
  buckets.clear();
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  constructor(
    public readonly key: string,
    public readonly retryAfter?: number
  ) {
    super(`Rate limit exceeded for key: ${key}`);
    this.name = 'RateLimitError';
  }
}

/**
 * Check rate limit and throw if exceeded
 * 
 * @throws RateLimitError if rate limit is exceeded
 */
export function checkRateLimit(
  key: string,
  capacity = 60,
  refillPerSec = 1
): void {
  if (!allowRequest(key, capacity, refillPerSec)) {
    // Calculate retry after (approximate seconds until next token available)
    const refillInterval = 1 / refillPerSec;
    throw new RateLimitError(key, Math.ceil(refillInterval));
  }
}

/**
 * Wrapper function for API route handlers with rate limiting
 * 
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @param handler - Handler function to execute if rate limit passes
 * @returns NextResponse from handler or rate limit error response
 */
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Generate rate limit key from request
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
  const key = `${config.keyPrefix || 'rate-limit'}:${clientIp}`;
  
  // Calculate capacity and refill rate from config
  const capacity = config.maxRequests;
  const windowSeconds = config.windowMs / 1000;
  const refillPerSec = capacity / windowSeconds;
  
  // Check rate limit
  if (!allowRequest(key, capacity, refillPerSec)) {
    const retryAfter = Math.ceil(windowSeconds / capacity);
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        retryAfter 
      },
      { 
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': capacity.toString(),
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }
  
  // Rate limit passed, execute handler
  return await handler(request);
}
