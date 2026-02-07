/**
 * PostgreSQL Connection Pool
 * Direct PostgreSQL connection pool for operations requiring session-level variables
 * Use this when you need to set app.tenant_id via set_config() for RLS
 * 
 * ⚠️ IMPORTANT: Only use this for operations that require session variables.
 * For regular Supabase operations, use the Supabase client with per-query tenant filters.
 */

import { Pool, PoolClient } from 'pg';

// Load dotenv if database connection variables are not set (for standalone scripts)
if (!process.env.DATABASE_URL && 
    !process.env.SUPABASE_DB_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_POOLER_URL &&
    !process.env.SUPABASE_POOLER_URL &&
    !process.env.DB_HOST && !process.env.PG_HOST) {
  try {
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env.local' });
    dotenv.config(); // Also try .env
  } catch (e) {
    // dotenv might not be available, that's okay if env vars are set elsewhere
  }
}

// Initialize connection pool
let pool: Pool | null = null;

/**
 * Get database connection string from various environment variable sources
 */
function getConnectionString(): string {
  // 1. Try DATABASE_URL (direct connection string)
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    
    // Check if it's using the old db.*.supabase.co format and warn
    if (dbUrl.includes('db.') && dbUrl.includes('.supabase.co') && !dbUrl.includes('pooler')) {
      console.warn('⚠️  [Postgres Pool] DATABASE_URL appears to use old direct connection format (db.*.supabase.co).');
      console.warn('   This may not work. Consider using the connection pooler instead:');
      console.warn('   Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres');
      console.warn('   Get it from: Supabase Dashboard > Settings > Database > Connection string > Transaction mode');
    }
    
    return dbUrl;
  }

  // 2. Try Supabase pooler URL (connection pooler, not API URL)
  // Check both NEXT_PUBLIC_SUPABASE_POOLER_URL and SUPABASE_POOLER_URL
  const poolerUrl = process.env.NEXT_PUBLIC_SUPABASE_POOLER_URL || process.env.SUPABASE_POOLER_URL;
  if (poolerUrl) {
    const dbPassword = process.env.SUPABASE_DB_PASSWORD;
    
    // If pooler URL is already a full connection string (starts with postgresql://), use it directly
    if (poolerUrl.startsWith('postgresql://') || poolerUrl.startsWith('postgres://')) {
      return poolerUrl;
    }
    
    // If it's a hostname/URL, construct the connection string
    if (dbPassword) {
      try {
        const url = new URL(poolerUrl.startsWith('http') ? poolerUrl : `https://${poolerUrl}`);
        const projectRef = url.hostname.split('.')[0];
        // Use transaction mode (port 6543) for connection pooling
        return `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@${url.hostname}:${url.port || '6543'}/postgres`;
      } catch (e) {
        // If URL parsing fails, try using it as hostname directly
        const projectRef = poolerUrl.split('.')[0];
        return `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@${poolerUrl}:6543/postgres`;
      }
    }
    
    // If no password but pooler URL provided, return helpful error
    throw new Error(
      `Found Supabase pooler URL but missing SUPABASE_DB_PASSWORD.\n` +
      `Please set SUPABASE_DB_PASSWORD in .env.local.\n` +
      `You can find it in Supabase Dashboard > Project Settings > Database > Connection string`
    );
  }

  // 3. Try SUPABASE_DB_URL
  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }

  // 4. Try individual DB variables
  const dbHost = process.env.DB_HOST || process.env.PG_HOST;
  const dbPort = process.env.DB_PORT || process.env.PG_PORT || '5432';
  const dbUser = process.env.DB_USER || process.env.PG_USER || 'postgres';
  const dbPass = process.env.DB_PASSWORD || process.env.DB_PASS || process.env.PG_PASSWORD || process.env.PG_PASS;
  const dbName = process.env.DB_NAME || process.env.PG_DATABASE || process.env.PG_DB || 'postgres';

  if (dbHost && dbUser && dbPass && dbName) {
    return `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPass)}@${dbHost}:${dbPort}/${dbName}`;
  }

  // 5. Try to construct from Supabase URL (if available)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    // Extract project ref from Supabase URL
    // Format: https://[project-ref].supabase.co
    const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (match) {
      const projectRef = match[1];
      
      // Try SUPABASE_DB_PASSWORD first
      const dbPassword = process.env.SUPABASE_DB_PASSWORD || dbPass;
      
      if (dbPassword) {
        // Use Supabase connection pooler (transaction mode, port 6543)
        // Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
        // Try common regions
        const regions = ['us-east-1', 'us-west-1', 'eu-west-1', 'ap-southeast-1'];
        for (const region of regions) {
          const poolerUrl = `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
          // Return the first one - user can override with explicit DATABASE_URL if region is wrong
          return poolerUrl;
        }
      }
      
      // If we have the project ref but no password, provide helpful error
      throw new Error(
        `Found Supabase project (${projectRef}) but missing database password.\n` +
        `Please set SUPABASE_DB_PASSWORD in .env.local.\n` +
        `You can find it in Supabase Dashboard > Project Settings > Database > Connection string > URI`
      );
    }
  }

  throw new Error(
    'Database connection string not found. Please set one of:\n' +
    '  - DATABASE_URL (direct PostgreSQL connection string)\n' +
    '  - NEXT_PUBLIC_SUPABASE_POOLER_URL or SUPABASE_POOLER_URL + SUPABASE_DB_PASSWORD\n' +
    '  - SUPABASE_DB_URL (full connection string)\n' +
    '  - DB_HOST + DB_USER + DB_PASSWORD + DB_NAME (or PG_* variants)\n' +
    '  - NEXT_PUBLIC_SUPABASE_URL (API URL) + SUPABASE_DB_PASSWORD\n' +
    '\nNote: NEXT_PUBLIC_SUPABASE_URL is the API endpoint, not the database connection.\n' +
    'For direct database access, use the pooler URL or DATABASE_URL from Supabase Dashboard.\n' +
    'Make sure .env.local exists and contains one of these configurations.'
  );
}

/**
 * Get or create PostgreSQL connection pool
 */
function getPool(): Pool {
  if (!pool) {
    const connectionString = getConnectionString();
    
    // Log connection info (without password) for debugging
    try {
      const url = new URL(connectionString);
      const hasPassword = url.password && url.password.length > 0;
      const hasUsername = url.username && url.username.length > 0;
      const safeUrl = `${url.protocol}//${url.username}@${url.hostname}:${url.port}${url.pathname}`;
      console.log(`🔌 [Postgres Pool] Connecting to: ${safeUrl}`);
      
      if (!hasUsername) {
        console.error('❌ [Postgres Pool] ERROR: No username found in connection string!');
        console.error('   Expected format: postgresql://postgres.[ref]:[password]@...');
      }
      
      if (!hasPassword) {
        console.error('❌ [Postgres Pool] ERROR: No password found in connection string!');
        console.error('   Make sure your DATABASE_URL includes the password between : and @');
        console.error('   Format: postgresql://postgres.[ref]:YOUR_PASSWORD@aws-0-[region].pooler.supabase.com:6543/postgres');
        console.error('   If password has special characters, they may need URL encoding');
      } else {
        console.log(`✅ [Postgres Pool] Password detected (${url.password.length} characters)`);
      }
    } catch (e) {
      // If URL parsing fails, just log that we're using a connection string
      console.error('❌ [Postgres Pool] Failed to parse connection string:', e);
      console.error('   Make sure DATABASE_URL is a valid PostgreSQL connection string');
    }
    
    pool = new Pool({
      connectionString,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Increased to 5 seconds for better error messages
    });
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('❌ [Postgres Pool] Unexpected error on idle client:', err);
    });
  }
  
  return pool;
}

/**
 * Get a client from the connection pool
 * Caller is responsible for releasing the client with client.release()
 * 
 * @returns PoolClient from the connection pool
 * 
 * @example
 * ```typescript
 * const client = await getPgClient();
 * try {
 *   const result = await client.query('SELECT * FROM ai_jobs WHERE id = $1', [jobId]);
 *   return result.rows;
 * } finally {
 *   client.release();
 * }
 * ```
 */
export async function getPgClient(): Promise<PoolClient> {
  return await getPool().connect();
}

/**
 * Execute a callback with tenant context set in PostgreSQL session
 * This sets app.tenant_id session variable for RLS policies
 * 
 * @param tenantId - Tenant ID to set in session
 * @param callback - Function to execute with tenant context
 * @returns Result of callback execution
 * 
 * @example
 * ```typescript
 * await withTenantContext('tenant-123', async (client) => {
 *   const result = await client.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
 *   return result.rows;
 * });
 * ```
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  if (!tenantId) {
    throw new Error('tenantId is required for withTenantContext');
  }
  
  const client = await getPool().connect();
  
  try {
    // Set tenant ID in session (local = true means it persists for the connection)
    await client.query('SELECT set_config($1, $2, true)', ['app.tenant_id', tenantId]);
    
    // Execute callback with tenant context
    return await callback(client);
  } catch (error: any) {
    console.error('❌ [Postgres Pool] Error in withTenantContext:', error);
    throw error;
  } finally {
    // Always release the client back to the pool
    client.release();
  }
}

/**
 * Execute a query with tenant context
 * Convenience wrapper around withTenantContext
 * 
 * @example
 * ```typescript
 * const rows = await queryWithTenantContext('tenant-123', 'SELECT * FROM sessions WHERE id = $1', [sessionId]);
 * ```
 */
export async function queryWithTenantContext(
  tenantId: string,
  query: string,
  params?: any[]
): Promise<any[]> {
  return withTenantContext(tenantId, async (client) => {
    const result = await client.query(query, params);
    return result.rows;
  });
}

/**
 * Close the connection pool (useful for testing or graceful shutdown)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Test connection to database
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await getPool().connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ [Postgres Pool] Connection test failed:', error);
    return false;
  }
}

