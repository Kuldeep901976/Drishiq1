/**
 * Audit Database Module
 * Provides audit logging functionality with database persistence
 */

import { supabase } from '@/lib/supabase';

interface AuditData {
  [key: string]: any;
}

/**
 * Log an audit event to database
 */
async function log(event: string, data: AuditData = {}): Promise<void> {
  try {
    // Try to log to database if audit table exists
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        event_type: event,
        event_data: data,
        created_at: new Date().toISOString()
      });

    if (error) {
      // Fallback to console if database insert fails
      console.log(`[AUDIT] ${event}:`, JSON.stringify(data, null, 2));
      console.warn('[AUDIT] Database logging failed, using console fallback:', error.message);
    }
  } catch (error) {
    // Fallback to console on any error
    console.log(`[AUDIT] ${event}:`, JSON.stringify(data, null, 2));
    console.error(`[AUDIT] Failed to log event ${event}:`, error);
  }
}

export default {
  log
};




