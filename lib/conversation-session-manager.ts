/**
 * Conversation Session Manager
 * Wrapper around SimpleThreadManager for conversation session management
 */

import { SimpleThreadManager, ConversationSession } from '@/packages/core/simple-thread-manager';
import { supabase } from '@/lib/supabase';

// Singleton instance
let sessionManagerInstance: ConversationSessionManager | null = null;

export interface SessionFilters {
  status?: 'active' | 'paused' | 'completed' | 'archived';
  category?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface SessionStats {
  total: number;
  active: number;
  paused: number;
  completed: number;
  archived: number;
}

export interface CreateSessionOptions {
  userId: string;
  threadId: string;
  sessionTitle?: string;
  sessionType?: string;
  tags?: string[];
  category?: string;
  priority?: string;
  metadata?: Record<string, any>;
  isCurrentSession?: boolean;
}

class ConversationSessionManager {
  private threadManager: SimpleThreadManager;

  constructor() {
    this.threadManager = new SimpleThreadManager();
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ConversationSession | null> {
    return await this.threadManager.getSession(sessionId);
  }

  /**
   * Create a new session
   */
  async createSession(options: CreateSessionOptions): Promise<ConversationSession> {
    const { userId, threadId, sessionTitle, sessionType, tags, category, priority, metadata, isCurrentSession } = options;

    // If this is the current session, mark others as not current
    if (isCurrentSession) {
      await this.clearCurrentSession(userId);
    }

    // Store additional fields in metadata
    const sessionMetadata = {
      ...metadata,
      threadId,
      tags,
      category,
      priority
    };

    // Create session using thread manager
    const session = await this.threadManager.getOrCreateCurrentSession(userId, {
      sessionType: sessionType || 'general',
      metadata: sessionMetadata
    });

    // Update title if provided (using updateSessionMetadata)
    if (sessionTitle) {
      await this.threadManager.updateSessionMetadata(session.id, {
        sessionTitle
      });
      // Reload session to get updated title
      return await this.getSession(session.id) || session;
    }

    return session;
  }

  /**
   * List sessions for a user with filters
   */
  async listSessions(userId: string, filters: SessionFilters = {}): Promise<{ sessions: ConversationSession[]; total: number }> {
    try {
      let query = supabase
        .from('conversation_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Category and tags are stored in metadata, so filter by metadata
      if (filters.category) {
        query = query.eq('metadata->>category', filters.category);
      }

      if (filters.tags && filters.tags.length > 0) {
        // Tags are stored as array in metadata
        query = query.contains('metadata->tags', filters.tags);
      }

      // Ordering
      const orderBy = filters.orderBy || 'last_activity_at';
      const order = filters.order || 'desc';
      query = query.order(orderBy, { ascending: order === 'asc' });

      // Pagination
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error listing sessions:', error);
        return { sessions: [], total: 0 };
      }

      const sessions = (data || []).map((row: any) => this.mapDbToSession(row));

      return {
        sessions,
        total: count || 0
      };
    } catch (error) {
      console.error('Error listing sessions:', error);
      return { sessions: [], total: 0 };
    }
  }

  /**
   * Search sessions
   */
  async searchSessions(userId: string, searchTerm: string, options: { limit?: number; offset?: number } = {}): Promise<{ sessions: ConversationSession[]; total: number }> {
    try {
      const { data, error, count } = await supabase
        .from('conversation_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .or(`session_title.ilike.%${searchTerm}%,metadata->>threadId.ilike.%${searchTerm}%`)
        .order('last_activity_at', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);

      if (error) {
        console.error('Error searching sessions:', error);
        return { sessions: [], total: 0 };
      }

      const sessions = (data || []).map((row: any) => this.mapDbToSession(row));

      return {
        sessions,
        total: count || 0
      };
    } catch (error) {
      console.error('Error searching sessions:', error);
      return { sessions: [], total: 0 };
    }
  }

  /**
   * Update session
   */
  async updateSession(sessionId: string, updates: Partial<CreateSessionOptions>): Promise<ConversationSession> {
    try {
      const updateData: any = {};

      // Use thread manager's updateSessionMetadata for title
      if (updates.sessionTitle !== undefined) {
        await this.threadManager.updateSessionMetadata(sessionId, {
          sessionTitle: updates.sessionTitle
        });
      }
      
      // Store other fields in metadata
      if (updates.tags !== undefined || updates.category !== undefined || updates.priority !== undefined || updates.metadata !== undefined) {
        const currentSession = await this.getSession(sessionId);
        const currentMetadata = currentSession?.metadata || {};
        
        const newMetadata = {
          ...currentMetadata,
          ...(updates.metadata || {}),
          ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
          ...(updates.category !== undefined ? { category: updates.category } : {}),
          ...(updates.priority !== undefined ? { priority: updates.priority } : {})
        };
        
        await this.threadManager.updateSessionMetadata(sessionId, {
          metadata: newMetadata
        });
      }
      
      if (updates.sessionType !== undefined) {
        updateData.session_type = updates.sessionType;
      }
      if (updates.isCurrentSession !== undefined) {
        updateData.is_current_session = updates.isCurrentSession;
        // If setting as current, clear others
        if (updates.isCurrentSession) {
          const session = await this.getSession(sessionId);
          if (session) {
            await this.clearCurrentSession(session.userId);
          }
        }
      }

      updateData.last_activity_at = new Date().toISOString();
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('conversation_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update session: ${error.message}`);
      }

      return this.mapDbToSession(data);
    } catch (error: any) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  /**
   * Archive session
   */
  async archiveSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversation_sessions')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        throw new Error(`Failed to archive session: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error archiving session:', error);
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(userId: string): Promise<SessionStats> {
    try {
      const { data, error } = await supabase
        .from('conversation_sessions')
        .select('status')
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting session stats:', error);
        return { total: 0, active: 0, paused: 0, completed: 0, archived: 0 };
      }

      const stats: SessionStats = {
        total: data?.length || 0,
        active: data?.filter(s => s.status === 'active').length || 0,
        paused: data?.filter(s => s.status === 'paused').length || 0,
        completed: data?.filter(s => s.status === 'completed').length || 0,
        archived: data?.filter(s => s.status === 'archived').length || 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting session stats:', error);
      return { total: 0, active: 0, paused: 0, completed: 0, archived: 0 };
    }
  }

  /**
   * Clear current session flag for user
   */
  private async clearCurrentSession(userId: string): Promise<void> {
    try {
      await supabase
        .from('conversation_sessions')
        .update({ is_current_session: false })
        .eq('user_id', userId)
        .eq('is_current_session', true);
    } catch (error) {
      console.error('Error clearing current session:', error);
    }
  }

  /**
   * Map database row to ConversationSession
   */
  private mapDbToSession(row: any): ConversationSession {
    return {
      id: row.id,
      userId: row.user_id,
      assistantThreadId: row.assistant_thread_id,
      sessionTitle: row.session_title,
      sessionType: row.session_type,
      status: row.status,
      isCurrentSession: row.is_current_session,
      currentDdsaStage: row.current_ddsa_stage,
      ddsaStagesCompleted: row.ddsa_stages_completed || [],
      metadata: row.metadata || {},
      startedAt: new Date(row.started_at),
      lastActivityAt: new Date(row.last_activity_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

/**
 * Get conversation session manager instance (singleton)
 */
export function getConversationSessionManager(): ConversationSessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new ConversationSessionManager();
  }
  return sessionManagerInstance;
}

