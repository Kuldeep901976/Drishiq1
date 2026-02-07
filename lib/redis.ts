// lib/redis.ts
// Redis client for rate limiting and caching

import Redis from 'ioredis';

let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 */
export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn('REDIS_URL not set, rate limiting will be disabled');
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return null;
  }
}

/**
 * Rate limit check using token bucket algorithm
 * @param key - Unique key for rate limiting (e.g., IP address)
 * @param limit - Maximum number of requests
 * @param windowSeconds - Time window in seconds
 * @returns Object with allowed status and remaining requests
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = getRedisClient();
  
  if (!redis) {
    // If Redis is not available, allow the request (fail open)
    return {
      allowed: true,
      remaining: limit,
      resetAt: Date.now() + windowSeconds * 1000
    };
  }

  try {
    const rateLimitKey = `rate_limit:${key}`;
    
    // Increment counter
    const count = await redis.incr(rateLimitKey);
    
    // Set expiry on first request
    if (count === 1) {
      await redis.expire(rateLimitKey, windowSeconds);
    }
    
    // Get TTL for reset time
    const ttl = await redis.ttl(rateLimitKey);
    const resetAt = Date.now() + (ttl > 0 ? ttl : windowSeconds) * 1000;
    
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open - allow request if Redis fails
    return {
      allowed: true,
      remaining: limit,
      resetAt: Date.now() + windowSeconds * 1000
    };
  }
}

/**
 * Check if key exists in Redis
 */
export async function exists(key: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    console.error('Redis exists error:', error);
    return false;
  }
}

/**
 * Set key with expiry
 */
export async function setWithExpiry(
  key: string,
  value: string,
  seconds: number
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  
  try {
    await redis.setex(key, seconds, value);
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

/**
 * Get value from Redis
 */
export async function get(key: string): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  
  try {
    return await redis.get(key);
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/** TTL for API response caches (seconds) */
export const CACHE_TTL = {
  blog: 60,
  currencyRates: 300,
};

/**
 * Get cached JSON or compute and store. Returns null if Redis unavailable or cache miss.
 */
export async function getCachedJson<T>(key: string): Promise<T | null> {
  const raw = await get(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Cache a JSON-serializable value with TTL. No-op if Redis unavailable.
 */
export async function setCachedJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Redis setCachedJson error:', error);
  }
}



