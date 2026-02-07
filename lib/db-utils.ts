/**
 * Database Utilities
 * Helper functions for database operations and migrations
 */

import { createServiceClient } from './supabase';

const supabase = createServiceClient();

/**
 * Check if a table exists in the database
 */
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    // Try to query the table's schema
    // If table doesn't exist, this will throw an error
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    // If error is about table not existing, return false
    if (error) {
      // Check if error is about table not existing
      const errorMessage = error.message?.toLowerCase() || '';
      if (
        errorMessage.includes('does not exist') ||
        errorMessage.includes('relation') ||
        errorMessage.includes('table') ||
        error.code === '42P01' // PostgreSQL error code for "relation does not exist"
      ) {
        return false;
      }
      // Other errors might indicate table exists but has other issues
      // For safety, assume table exists if error is not about missing table
      return true;
    }

    return true;
  } catch (error: any) {
    // If we get an exception, assume table doesn't exist
    const errorMessage = error.message?.toLowerCase() || '';
    if (
      errorMessage.includes('does not exist') ||
      errorMessage.includes('relation') ||
      errorMessage.includes('table')
    ) {
      return false;
    }
    // For other errors, log and return false to be safe
    console.warn(`Error checking table existence for ${tableName}:`, error);
    return false;
  }
}

/**
 * Get migration path for a table
 * Returns a suggested path to the migration file that should create this table
 */
export function getMigrationPath(tableName: string): string {
  // Common migration file patterns
  const migrationPatterns = [
    `database/${tableName}.sql`,
    `database/create-${tableName}.sql`,
    `database/${tableName}-migration.sql`,
    `database/migrations/${tableName}.sql`,
    `database/migrations/create-${tableName}.sql`
  ];

  // Return the first pattern as the suggested path
  // In a real scenario, you might want to check which file actually exists
  return migrationPatterns[0];
}

/**
 * Get table schema information
 */
export async function getTableSchema(tableName: string): Promise<{
  columns: Array<{ name: string; type: string; nullable: boolean }>;
  exists: boolean;
}> {
  const exists = await checkTableExists(tableName);
  
  if (!exists) {
    return { columns: [], exists: false };
  }

  try {
    // Query information_schema to get column information
    // Note: This requires direct SQL access, which Supabase client doesn't provide easily
    // For now, return empty array - this can be enhanced with a database function
    return {
      columns: [],
      exists: true
    };
  } catch (error) {
    console.error(`Error getting schema for ${tableName}:`, error);
    return {
      columns: [],
      exists: true // Assume exists if we can't check schema
    };
  }
}




