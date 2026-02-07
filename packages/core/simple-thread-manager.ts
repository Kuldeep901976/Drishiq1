// =====================================================
// SIMPLE THREAD MANAGER
// =====================================================
// Single-table approach: Uses ONLY conversation_sessions
// No legacy code, no complexity, just one table handled properly
// =====================================================

import { createClient } from '@supabase/supabase-js';

const isBrowser = typeof window !== 'undefined';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = isBrowser 
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  : process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase environment variables not found. Thread persistence will be disabled.');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// =====================================================
// INTERFACES
// =====================================================

export interface ConversationSession {
  id: string;
  userId: string;
  assistantThreadId?: string; // OpenAI thread ID (thread_xxx format)
  sessionTitle?: string;
  sessionType: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  isCurrentSession: boolean;
  currentDdsaStage?: string;
  ddsaStagesCompleted: string[];
  metadata: Record<string, any>;
  startedAt: Date;
  lastActivityAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id?: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageType?: 'text' | 'mcq' | 'code' | 'structure' | 'phase';
  tags?: any[];
  metadata?: any;
  createdAt?: Date;
  processingTimeMs?: number;
}

// =====================================================
// SIMPLE THREAD MANAGER
// =====================================================

// =====================================================
// ERROR CLASSES
// =====================================================

export class ThreadPersistenceError extends Error {
  code: string;
  statusCode: number;
  
  constructor(message: string, code: string = 'THREAD_PERSIST_FAILED', statusCode: number = 500) {
    super(message);
    this.name = 'ThreadPersistenceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ThreadNotFoundError extends Error {
  code: string;
  statusCode: number;
  
  constructor(message: string = 'Thread not found') {
    super(message);
    this.name = 'ThreadNotFoundError';
    this.code = 'THREAD_NOT_FOUND';
    this.statusCode = 404;
  }
}

export class ThreadOwnershipError extends Error {
  code: string;
  statusCode: number;
  
  constructor(message: string = 'Thread does not belong to user') {
    super(message);
    this.name = 'ThreadOwnershipError';
    this.code = 'THREAD_FORBIDDEN';
    this.statusCode = 403;
  }
}

// =====================================================
// SIMPLE THREAD MANAGER
// =====================================================

export class SimpleThreadManager {
  // Cache for performance (NOT a fallback - DB is source of truth)
  private sessions: Map<string, ConversationSession> = new Map();
  private messages: Map<string, Message[]> = new Map();

  /**
   * Validate UUID format
   */
  private validateUUID(id: string, fieldName: string = 'ID'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new ThreadPersistenceError(
        `Invalid ${fieldName} format: expected UUID, got ${id.substring(0, 20)}...`,
        'INVALID_UUID_FORMAT',
        400
      );
    }
  }

  /**
   * Get or create current session for user
   * NO IN-MEMORY FALLBACK - always persists to DB
   */
  async getOrCreateCurrentSession(
    userId: string,
    options?: {
      sessionType?: string;
      assistantThreadId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<ConversationSession> {
    if (!supabase) {
      throw new ThreadPersistenceError(
        'Supabase not initialized - cannot get or create session',
        'DATABASE_NOT_INITIALIZED',
        503
      );
    }

    // Validate userId is UUID
    this.validateUUID(userId, 'user_id');

    try {
      // Try to get existing current session (with explicit UUID cast)
      const { data: existing, error: findError } = await supabase!
        .from('conversation_sessions')
        .select('*')
        .eq('user_id', userId) // Supabase client handles UUID casting
        .eq('is_current_session', true)
        .eq('status', 'active')
        .order('last_activity_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError) {
        // Check for specific error codes
        if (findError.code === 'PGRST116' || findError.message?.includes('does not exist')) {
          // Table doesn't exist - this is a schema issue
          throw new ThreadPersistenceError(
            `Database schema error: ${findError.message}`,
            'SCHEMA_ERROR',
            500
          );
        }
        throw new ThreadPersistenceError(
          `Failed to query session: ${findError.message}`,
          'DATABASE_QUERY_ERROR',
          500
        );
      }

      if (existing) {
        const session = this.mapDbToSession(existing);
        // Update cache (performance only, not fallback)
        this.sessions.set(session.id, session);
        return session;
      }

      // Create new session - DB generates UUID via default
      const sessionData: any = {
        user_id: userId, // Supabase client will handle UUID casting
        session_type: options?.sessionType || 'general',
        status: 'active',
        is_current_session: true,
        metadata: options?.metadata || {},
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      };

      // Add assistant_thread_id if provided
      if (options?.assistantThreadId) {
        sessionData.assistant_thread_id = options.assistantThreadId;
      }

      const { data: newData, error: createError } = await supabase!
        .from('conversation_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (createError) {
        // Check for specific error codes
        if (createError.code === '23505') { // Unique violation
          throw new ThreadPersistenceError(
            `Session already exists: ${createError.message}`,
            'SESSION_ALREADY_EXISTS',
            409
          );
        }
        if (createError.code === '42883' || createError.message?.includes('operator does not exist')) {
          throw new ThreadPersistenceError(
            `UUID type mismatch: ${createError.message}. Ensure migration has been run.`,
            'UUID_TYPE_ERROR',
            500
          );
        }
        throw new ThreadPersistenceError(
          `Failed to create session: ${createError.message}`,
          'SESSION_CREATE_FAILED',
          500
        );
      }

      if (!newData || !newData.id) {
        throw new ThreadPersistenceError(
          'Session created but no ID returned from database',
          'SESSION_ID_MISSING',
          500
        );
      }

      const session = this.mapDbToSession(newData);
      // Update cache (performance only, not fallback)
      this.sessions.set(session.id, session);
      console.log('✅ Created new session:', session.id);
      return session;
    } catch (error: any) {
      // Re-throw structured errors as-is
      if (error instanceof ThreadPersistenceError || 
          error instanceof ThreadNotFoundError || 
          error instanceof ThreadOwnershipError) {
        throw error;
      }
      
      // Wrap unknown errors
      console.error('❌ Error getting or creating session:', error);
      throw new ThreadPersistenceError(
        `Failed to get or create session: ${error?.message || String(error)}`,
        'UNKNOWN_ERROR',
        500
      );
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ConversationSession | null> {
    if (!supabase) return null;

    // Check cache
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    try {
      const { data, error } = await supabase!
        .from('conversation_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (error || !data) return null;

      const session = this.mapDbToSession(data);
      this.sessions.set(session.id, session);
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Get session by assistant_thread_id (OpenAI thread ID)
   */
  async getSessionByAssistantThreadId(assistantThreadId: string): Promise<ConversationSession | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase!
        .from('conversation_sessions')
        .select('*')
        .eq('assistant_thread_id', assistantThreadId)
        .maybeSingle();

      if (error || !data) return null;

      const session = this.mapDbToSession(data);
      this.sessions.set(session.id, session);
      return session;
    } catch (error) {
      console.error('Error getting session by assistant thread ID:', error);
      return null;
    }
  }

  /**
   * Update session assistant_thread_id
   * NO IN-MEMORY FALLBACK - always persists to DB
   */
  async updateAssistantThreadId(sessionId: string, assistantThreadId: string): Promise<void> {
    if (!supabase) {
      throw new ThreadPersistenceError(
        'Supabase not initialized',
        'DATABASE_NOT_INITIALIZED',
        503
      );
    }

    // Validate inputs
    this.validateUUID(sessionId, 'session_id');
    
    if (!assistantThreadId || !assistantThreadId.startsWith('thread_')) {
      throw new ThreadPersistenceError(
        `Invalid assistant thread ID format: must start with "thread_", got ${assistantThreadId?.substring(0, 20)}...`,
        'INVALID_ASSISTANT_THREAD_ID',
        400
      );
    }

    try {
      const { error, data } = await supabase!
        .from('conversation_sessions')
        .update({
          assistant_thread_id: assistantThreadId,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new ThreadNotFoundError(`Session not found: ${sessionId}`);
        }
        if (error.code === '42883' || error.message?.includes('operator does not exist')) {
          throw new ThreadPersistenceError(
            `UUID type mismatch: ${error.message}. Ensure migration has been run.`,
            'UUID_TYPE_ERROR',
            500
          );
        }
        throw new ThreadPersistenceError(
          `Failed to update assistant thread ID: ${error.message}`,
          'UPDATE_FAILED',
          500
        );
      }

      if (!data) {
        throw new ThreadNotFoundError(`Session not found: ${sessionId}`);
      }

      // Update cache (performance only)
      const session = this.sessions.get(sessionId);
      if (session) {
        session.assistantThreadId = assistantThreadId;
        session.lastActivityAt = new Date();
        this.sessions.set(sessionId, session);
      }

      console.log(`✅ Updated assistant_thread_id for session ${sessionId}`);
    } catch (error: any) {
      // Re-throw structured errors as-is
      if (error instanceof ThreadPersistenceError || 
          error instanceof ThreadNotFoundError) {
        throw error;
      }
      
      console.error('❌ Error updating assistant thread ID:', error);
      throw new ThreadPersistenceError(
        `Failed to update assistant thread ID: ${error?.message || String(error)}`,
        'UNKNOWN_ERROR',
        500
      );
    }
  }

  /**
   * Update session metadata (including DDSA state)
   */
  async updateSessionMetadata(
    sessionId: string,
    updates: {
      metadata?: Record<string, any>;
      currentDdsaStage?: string;
      ddsaStagesCompleted?: string[];
      sessionTitle?: string;
      status?: 'active' | 'paused' | 'completed' | 'archived';
    }
  ): Promise<void> {
    if (!supabase) return;

    try {
      const updateData: any = {
        last_activity_at: new Date().toISOString()
      };

      if (updates.metadata !== undefined) {
        updateData.metadata = updates.metadata;
      }

      if (updates.currentDdsaStage !== undefined) {
        updateData.current_ddsa_stage = updates.currentDdsaStage;
      }

      if (updates.ddsaStagesCompleted !== undefined) {
        updateData.ddsa_stages_completed = updates.ddsaStagesCompleted;
      }

      if (updates.sessionTitle !== undefined) {
        updateData.session_title = updates.sessionTitle;
      }

      if (updates.status !== undefined) {
        updateData.status = updates.status;
      }

      const { error } = await supabase!
        .from('conversation_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) throw error;

      // Update cache
      const session = this.sessions.get(sessionId);
      if (session) {
        if (updates.metadata !== undefined) {
          session.metadata = { ...session.metadata, ...updates.metadata };
        }
        if (updates.currentDdsaStage !== undefined) {
          session.currentDdsaStage = updates.currentDdsaStage;
        }
        if (updates.ddsaStagesCompleted !== undefined) {
          session.ddsaStagesCompleted = updates.ddsaStagesCompleted;
        }
        if (updates.sessionTitle !== undefined) {
          session.sessionTitle = updates.sessionTitle;
        }
        if (updates.status !== undefined) {
          session.status = updates.status;
        }
        session.lastActivityAt = new Date();
        this.sessions.set(sessionId, session);
      }
    } catch (error) {
      console.error('Error updating session metadata:', error);
      throw error;
    }
  }

  /**
   * Add message to session
   */
  async addMessage(sessionId: string, message: Message): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not initialized - cannot add message');
    }

    try {
      // Get session to find thread_id for backward compatibility with chat_messages table
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Save to chat_messages table (still using this table for messages)
      // Use session.id as thread_id for backward compatibility
      const { data, error } = await supabase!
        .from('chat_messages')
        .insert({
          thread_id: sessionId, // Use session ID as thread_id
          role: message.role,
          content: message.content,
          message_type: message.messageType || 'text',
          tags: message.tags || [],
          metadata: {
            ...(message.metadata || {}),
            session_id: sessionId // Store session ID in metadata
          },
          processing_time_ms: message.processingTimeMs || 0
        })
        .select()
        .single();

      if (error) throw error;

      // Update cache
      const messages = this.messages.get(sessionId) || [];
      const newMessage: Message = {
        ...message,
        id: data.id,
        createdAt: new Date(data.created_at)
      };
      messages.push(newMessage);
      this.messages.set(sessionId, messages);

      // Update session activity
      await this.updateSessionMetadata(sessionId, {});
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  /**
   * Get messages for session
   */
  async getMessages(sessionId: string): Promise<Message[]> {
    if (!supabase) return [];

    // Check cache
    if (this.messages.has(sessionId)) {
      return this.messages.get(sessionId)!;
    }

    try {
      const { data, error } = await supabase!
        .from('chat_messages')
        .select('*')
        .eq('thread_id', sessionId) // Use session ID as thread_id
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messages: Message[] = data.map(msg => ({
        id: msg.id,
        sessionId: sessionId,
        role: msg.role,
        content: msg.content,
        messageType: msg.message_type,
        tags: msg.tags,
        metadata: msg.metadata,
        createdAt: new Date(msg.created_at),
        processingTimeMs: msg.processing_time_ms
      }));

      this.messages.set(sessionId, messages);
      return messages;
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }

  /**
   * Get user's sessions
   */
  async getUserSessions(
    userId: string,
    options?: {
      status?: 'active' | 'paused' | 'completed' | 'archived';
      limit?: number;
    }
  ): Promise<ConversationSession[]> {
    if (!supabase) return [];

    try {
      let query = supabase!
        .from('conversation_sessions')
        .select('*')
        .eq('user_id', userId);

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      query = query.order('last_activity_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(row => this.mapDbToSession(row));
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Map database row to ConversationSession
   */
  private mapDbToSession(row: any): ConversationSession {
    return {
      id: row.id,
      userId: row.user_id,
      assistantThreadId: row.assistant_thread_id || undefined,
      sessionTitle: row.session_title || undefined,
      sessionType: row.session_type || 'general',
      status: row.status || 'active',
      isCurrentSession: row.is_current_session || false,
      currentDdsaStage: row.current_ddsa_stage || undefined,
      ddsaStagesCompleted: row.ddsa_stages_completed || [],
      metadata: row.metadata || {},
      startedAt: new Date(row.started_at),
      lastActivityAt: new Date(row.last_activity_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at || row.started_at),
      updatedAt: new Date(row.updated_at || row.last_activity_at)
    };
  }
}

// Export singleton instance
let simpleThreadManagerInstance: SimpleThreadManager | null = null;

export function getSimpleThreadManager(): SimpleThreadManager {
  if (!simpleThreadManagerInstance) {
    simpleThreadManagerInstance = new SimpleThreadManager();
  }
  return simpleThreadManagerInstance;
}

