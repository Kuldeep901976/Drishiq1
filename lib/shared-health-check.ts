/**
 * Shared Health Check Service
 * Checks once and caches result - all components share the same status
 * Prevents multiple polling requests
 */

interface HealthCheckResult {
  status: 'ok' | 'unavailable' | 'checking' | 'error';
  message?: string;
  timestamp: number;
}

class SharedHealthCheckService {
  private cache: Map<string, HealthCheckResult> = new Map();
  private pendingChecks: Map<string, Promise<HealthCheckResult>> = new Map();
  private checkingFlags: Map<string, boolean> = new Map(); // Track if check is in progress
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check health status for a service
   * Returns cached result if available and fresh, otherwise checks once
   */
  async checkHealth(serviceName: string, endpoint: string): Promise<HealthCheckResult> {
    // Check cache first
    const cached = this.cache.get(serviceName);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`✅ [Health Check] Using cached result for ${serviceName}:`, cached.status);
      return cached;
    }

    // CRITICAL: Check if there's already a pending check - return the same promise
    const pending = this.pendingChecks.get(serviceName);
    if (pending) {
      console.log(`⏳ [Health Check] Waiting for pending check for ${serviceName} (preventing duplicate request)`);
      return pending;
    }

    // CRITICAL: Check if a check is already in progress (double-check with flag)
    if (this.checkingFlags.get(serviceName)) {
      console.log(`⏳ [Health Check] Check already in progress for ${serviceName}, waiting for existing check...`);
      // Wait a bit and check for pending promise (should exist now)
      await new Promise(resolve => setTimeout(resolve, 50));
      const pendingAfterWait = this.pendingChecks.get(serviceName);
      if (pendingAfterWait) {
        return pendingAfterWait;
      }
      // If still no pending promise, something went wrong - allow new check
      console.warn(`⚠️ [Health Check] Pending check not found after wait, starting new check for ${serviceName}`);
    }

    // Set checking flag IMMEDIATELY to prevent concurrent calls
    this.checkingFlags.set(serviceName, true);

    // Start new check
    console.log(`🚀 [Health Check] Starting NEW check for ${serviceName} at ${endpoint}`);
    const checkPromise = this.performCheck(serviceName, endpoint);
    this.pendingChecks.set(serviceName, checkPromise);

    try {
      const result = await checkPromise;
      this.cache.set(serviceName, result);
      console.log(`✅ [Health Check] Check completed for ${serviceName}, result cached`);
      return result;
    } catch (error) {
      console.error(`❌ [Health Check] Check failed for ${serviceName}:`, error);
      throw error;
    } finally {
      // Always clean up
      this.pendingChecks.delete(serviceName);
      this.checkingFlags.delete(serviceName);
      console.log(`🧹 [Health Check] Cleaned up check state for ${serviceName}`);
    }
  }

  private async performCheck(serviceName: string, endpoint: string): Promise<HealthCheckResult> {
    console.log(`🔍 [Health Check] Checking ${serviceName} at ${endpoint}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store' // Don't cache the fetch itself
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        let data;
        try {
          const text = await response.text();
          console.log(`📥 [Health Check] ${serviceName} raw response:`, text.substring(0, 200));
          if (!text || text.trim() === '') {
            data = { status: 'unavailable' };
          } else {
            data = JSON.parse(text);
          }
        } catch (parseError) {
          console.warn(`⚠️ [Health Check] Failed to parse response for ${serviceName}:`, parseError);
          data = { status: 'unavailable' };
        }

        // Check for 'ok' status (case-insensitive check for robustness)
        const statusValue = data?.status?.toLowerCase();
        const isOk = statusValue === 'ok';
        
        const result: HealthCheckResult = {
          status: isOk ? 'ok' : 'unavailable',
          message: data?.message || (isOk ? undefined : `Service returned status: ${data?.status || 'unknown'}`),
          timestamp: Date.now()
        };

        console.log(`✅ [Health Check] ${serviceName} status:`, result.status, result.message ? `(${result.message})` : '');
        return result;
      } else {
        const result: HealthCheckResult = {
          status: 'unavailable',
          message: `HTTP ${response.status}`,
          timestamp: Date.now()
        };
        console.log(`❌ [Health Check] ${serviceName} unavailable:`, result.message);
        return result;
      }
    } catch (error: any) {
      const result: HealthCheckResult = {
        status: error.name === 'AbortError' ? 'error' : 'unavailable',
        message: error.message || 'Connection failed',
        timestamp: Date.now()
      };
      console.log(`❌ [Health Check] ${serviceName} error:`, result.message);
      return result;
    }
  }

  /**
   * Invalidate cache for a service (force re-check on next call)
   */
  invalidateCache(serviceName: string): void {
    this.cache.delete(serviceName);
    console.log(`🔄 [Health Check] Cache invalidated for ${serviceName}`);
  }

  /**
   * Get cached result without checking
   */
  getCachedResult(serviceName: string): HealthCheckResult | null {
    const cached = this.cache.get(serviceName);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached;
    }
    return null;
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.cache.clear();
    this.pendingChecks.clear();
    console.log('🧹 [Health Check] All caches cleared');
  }
}

// Singleton instance - shared across all components
export const sharedHealthCheck = new SharedHealthCheckService();

/**
 * Convenience function for admin-auth health check
 */
export async function checkAdminAuthHealth(): Promise<HealthCheckResult> {
  return sharedHealthCheck.checkHealth('admin-auth', '/api/admin-auth/health');
}

/**
 * Get cached admin-auth status without checking
 */
export function getCachedAdminAuthStatus(): HealthCheckResult | null {
  return sharedHealthCheck.getCachedResult('admin-auth');
}

