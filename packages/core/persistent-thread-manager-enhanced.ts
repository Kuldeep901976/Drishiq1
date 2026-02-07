// =====================================================
// ENHANCED PERSISTENT THREAD MANAGER
// =====================================================
// Supports parent/sub-thread model while maintaining backward compatibility
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

export interface ParentThread {
  id: string;
  userId: string;
  createdAt: Date;
  lastActivityAt: Date;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SubThread {
  id: string;
  parentThreadId: string;
  conversationSessionId?: string; // Link to existing conversation_sessions
  createdAt: Date;
  endedAt?: Date;
  meta?: Record<string, any>; // Includes DDSA state
  sensitivity?: 'low' | 'medium' | 'high';
  priority?: number;
  pinned?: boolean;
  status?: 'active' | 'paused' | 'completed' | 'archived';
  currentDdsaStage?: string;
  ddsaStagesCompleted?: string[];
}

export interface Message {
  id?: string;
  subThreadId: string; // Changed from threadId
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageType?: 'text' | 'mcq' | 'code' | 'structure' | 'phase';
  tags?: any[];
  metadata?: any;
  createdAt?: Date;
  processingTimeMs?: number;
}

// =====================================================
// ENHANCED THREAD MANAGER
// =====================================================

export class EnhancedPersistentThreadManager {
  private parentThreads: Map<string, ParentThread> = new Map();
  private subThreads: Map<string, SubThread> = new Map();
  private messages: Map<string, Message[]> = new Map();

  // =====================================================
  // PARENT THREAD OPERATIONS
  // =====================================================

  /**
   * Get or create parent thread (one per user)
   */
  async getOrCreateParentThread(userId: string): Promise<ParentThread> {
    if (!supabase) {
      throw new Error('Supabase not initialized - cannot get or create parent thread');
    }

    // Check cache
    const cached = Array.from(this.parentThreads.values()).find(t => t.userId === userId);
    if (cached) {
      return cached;
    }

    try {
      // Try to get existing parent thread
      const { data, error } = await supabase!
        .from('threads')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data && !error) {
        const parentThread: ParentThread = {
          id: data.id,
          userId: data.user_id,
          createdAt: new Date(data.created_at),
          lastActivityAt: new Date(data.last_activity_at),
          settings: data.settings || {},
          metadata: data.metadata || {}
        };
        this.parentThreads.set(parentThread.id, parentThread);
        return parentThread;
      }

      // Create new parent thread
      const { data: newData, error: createError } = await supabase!
        .from('threads')
        .insert({
          user_id: userId,
          created_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;

      const parentThread: ParentThread = {
        id: newData.id,
        userId: newData.user_id,
        createdAt: new Date(newData.created_at),
        lastActivityAt: new Date(newData.last_activity_at),
        settings: newData.settings || {},
        metadata: newData.metadata || {}
      };

      this.parentThreads.set(parentThread.id, parentThread);
      console.log('✅ Created parent thread:', parentThread.id);
      return parentThread;
    } catch (error: any) {
      console.error('❌ Error getting or creating parent thread:', error);
      throw new Error(`Failed to get or create parent thread: ${error?.message || String(error)}`);
    }
  }

  /**
   * Get parent thread by user ID
   */
  async getParentThread(userId: string): Promise<ParentThread | null> {
    if (!supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase!
        .from('threads')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;

      const parentThread: ParentThread = {
        id: data.id,
        userId: data.user_id,
        createdAt: new Date(data.created_at),
        lastActivityAt: new Date(data.last_activity_at),
        settings: data.settings || {},
        metadata: data.metadata || {}
      };

      this.parentThreads.set(parentThread.id, parentThread);
      return parentThread;
    } catch (error) {
      console.error('Error getting parent thread:', error);
      return null;
    }
  }

  /**
   * Update parent thread last activity
   */
  async updateParentThreadActivity(parentThreadId: string): Promise<void> {
    if (!supabase) return;

    try {
      await supabase!
        .from('threads')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', parentThreadId);

      const cached = this.parentThreads.get(parentThreadId);
      if (cached) {
        cached.lastActivityAt = new Date();
      }
    } catch (error) {
      console.error('Error updating parent thread activity:', error);
    }
  }

  // =====================================================
  // SUB-THREAD OPERATIONS (conversation_sessions)
  // =====================================================

  /**
   * Get or create sub-thread (conversation session)
   */
  async getOrCreateSubThread(
    parentThreadId: string,
    userId: string,
    options?: {
      sessionType?: string;
      meta?: Record<string, any>;
      sensitivity?: 'low' | 'medium' | 'high';
      priority?: number;
    }
  ): Promise<SubThread> {
    if (!supabase) {
      throw new Error('Supabase not initialized - cannot get or create sub-thread');
    }

    try {
      // Try to get existing active sub-thread for this parent
      const { data: existing, error: findError } = await supabase!
        .from('conversation_sessions')
        .select('*')
        .eq('parent_thread_id', parentThreadId)
        .eq('status', 'active')
        .eq('is_current_session', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing && !findError) {
        const subThread: SubThread = {
          id: existing.id,
          parentThreadId: existing.parent_thread_id,
          conversationSessionId: existing.id,
          createdAt: new Date(existing.started_at),
          endedAt: existing.completed_at ? new Date(existing.completed_at) : undefined,
          meta: existing.metadata || {},
          sensitivity: existing.sensitivity as 'low' | 'medium' | 'high' | undefined,
          priority: existing.priority_score || 0, // Use priority_score for INTEGER values
          pinned: existing.pinned || false,
          status: existing.status as 'active' | 'paused' | 'completed' | 'archived',
          currentDdsaStage: existing.current_ddsa_stage || undefined,
          ddsaStagesCompleted: existing.ddsa_stages_completed || []
        };
        this.subThreads.set(subThread.id, subThread);
        return subThread;
      }

      // Create new sub-thread (conversation session)
      const { data: newData, error: createError } = await supabase!
        .from('conversation_sessions')
        .insert({
          user_id: userId,
          parent_thread_id: parentThreadId,
          thread_id: parentThreadId, // Temporary: link to parent for backward compatibility
          session_type: options?.sessionType || 'general',
          status: 'active',
          is_current_session: true,
          metadata: options?.meta || {},
          sensitivity: options?.sensitivity || 'low',
          priority_score: options?.priority || 0, // Use priority_score for INTEGER, keep priority VARCHAR for categorization
          started_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;

      const subThread: SubThread = {
        id: newData.id,
        parentThreadId: newData.parent_thread_id,
        conversationSessionId: newData.id,
        createdAt: new Date(newData.started_at),
        meta: newData.metadata || {},
        sensitivity: newData.sensitivity as 'low' | 'medium' | 'high' | undefined,
        priority: newData.priority_score || 0, // Use priority_score for INTEGER values
        pinned: newData.pinned || false,
        status: 'active',
        currentDdsaStage: newData.current_ddsa_stage || undefined,
        ddsaStagesCompleted: newData.ddsa_stages_completed || []
      };

      this.subThreads.set(subThread.id, subThread);
      console.log('✅ Created sub-thread:', subThread.id);
      return subThread;
    } catch (error: any) {
      console.error('❌ Error getting or creating sub-thread:', error);
      throw new Error(`Failed to get or create sub-thread: ${error?.message || String(error)}`);
    }
  }

  /**
   * Get sub-thread by ID
   */
  async getSubThread(subThreadId: string): Promise<SubThread | null> {
    if (!supabase) return null;

    // Check cache
    if (this.subThreads.has(subThreadId)) {
      return this.subThreads.get(subThreadId)!;
    }

    try {
      const { data, error } = await supabase!
        .from('conversation_sessions')
        .select('*')
        .eq('id', subThreadId)
        .maybeSingle();

      if (error || !data) return null;

      const subThread: SubThread = {
        id: data.id,
        parentThreadId: data.parent_thread_id,
        conversationSessionId: data.id,
        createdAt: new Date(data.started_at),
        endedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        meta: data.metadata || {},
        sensitivity: data.sensitivity as 'low' | 'medium' | 'high' | undefined,
        priority: data.priority_score || 0, // Use priority_score for INTEGER values
        pinned: data.pinned || false,
        status: data.status as 'active' | 'paused' | 'completed' | 'archived',
        currentDdsaStage: data.current_ddsa_stage || undefined,
        ddsaStagesCompleted: data.ddsa_stages_completed || []
      };

      this.subThreads.set(subThread.id, subThread);
      return subThread;
    } catch (error) {
      console.error('Error getting sub-thread:', error);
      return null;
    }
  }

  /**
   * Update sub-thread meta (includes DDSA state)
   */
  async updateSubThreadMeta(
    subThreadId: string,
    meta: Record<string, any>
  ): Promise<void> {
    if (!supabase) return;

    try {
      // Get current meta
      const subThread = await this.getSubThread(subThreadId);
      const currentMeta = subThread?.meta || {};

      // Merge with new meta
      const updatedMeta = { ...currentMeta, ...meta };

      // Update in database
      await supabase!
        .from('conversation_sessions')
        .update({
          metadata: updatedMeta,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', subThreadId);

      // Update cache
      if (subThread) {
        subThread.meta = updatedMeta;
        this.subThreads.set(subThreadId, subThread);
      }

      // If meta contains ddsa_state, sync to current_ddsa_stage
      if (meta.ddsa_state?.stage) {
        await supabase!
          .from('conversation_sessions')
          .update({
            current_ddsa_stage: meta.ddsa_state.stage
          })
          .eq('id', subThreadId);
      }
    } catch (error) {
      console.error('Error updating sub-thread meta:', error);
      throw error;
    }
  }

  // =====================================================
  // MESSAGE OPERATIONS
  // =====================================================

  /**
   * Add message to sub-thread
   * Note: Messages are still stored in chat_messages table
   * but linked via conversation_sessions.thread_id for now
   */
  async addMessage(subThreadId: string, message: Message): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not initialized - cannot add message');
    }

    try {
      // Get sub-thread to find the thread_id (for backward compatibility)
      const subThread = await this.getSubThread(subThreadId);
      if (!subThread) {
        throw new Error(`Sub-thread not found: ${subThreadId}`);
      }

      // For now, use conversation_sessions.thread_id (which links to parent)
      // TODO: Create proper messages table with sub_thread_id
      const threadId = subThread.parentThreadId; // Temporary: use parent thread ID

      // Save to chat_messages (backward compatibility)
      const { data, error } = await supabase!
        .from('chat_messages')
        .insert({
          thread_id: threadId, // Temporary: will be sub_thread_id in future
          role: message.role,
          content: message.content,
          message_type: message.messageType || 'text',
          tags: message.tags || [],
          metadata: {
            ...(message.metadata || {}),
            sub_thread_id: subThreadId // Store sub-thread ID in metadata
          },
          processing_time_ms: message.processingTimeMs || 0
        })
        .select()
        .single();

      if (error) throw error;

      // Update cache
      const messages = this.messages.get(subThreadId) || [];
      const newMessage: Message = {
        ...message,
        id: data.id,
        createdAt: new Date(data.created_at)
      };
      messages.push(newMessage);
      this.messages.set(subThreadId, messages);

      // Update parent thread activity
      await this.updateParentThreadActivity(subThread.parentThreadId);

      // Update sub-thread activity
      await supabase!
        .from('conversation_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', subThreadId);
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  /**
   * Get messages for sub-thread
   */
  async getMessages(subThreadId: string): Promise<Message[]> {
    if (!supabase) return [];

    // Check cache
    if (this.messages.has(subThreadId)) {
      return this.messages.get(subThreadId)!;
    }

    try {
      // Get messages from chat_messages where metadata.sub_thread_id matches
      // TODO: When messages table has sub_thread_id column, use that directly
      const { data, error } = await supabase!
        .from('chat_messages')
        .select('*')
        .eq('metadata->>sub_thread_id', subThreadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messages: Message[] = data.map(msg => ({
        id: msg.id,
        subThreadId: subThreadId,
        role: msg.role,
        content: msg.content,
        messageType: msg.message_type,
        tags: msg.tags,
        metadata: msg.metadata,
        createdAt: new Date(msg.created_at),
        processingTimeMs: msg.processing_time_ms
      }));

      this.messages.set(subThreadId, messages);
      return messages;
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }

  // =====================================================
  // CONVENIENCE METHODS
  // =====================================================

  /**
   * Get or create parent thread and sub-thread in one call
   */
  async getOrCreateThreadHierarchy(
    userId: string,
    options?: {
      sessionType?: string;
      meta?: Record<string, any>;
    }
  ): Promise<{ parentThread: ParentThread; subThread: SubThread }> {
    const parentThread = await this.getOrCreateParentThread(userId);
    const subThread = await this.getOrCreateSubThread(parentThread.id, userId, options);
    return { parentThread, subThread };
  }
}

// Export singleton instance
let enhancedThreadManagerInstance: EnhancedPersistentThreadManager | null = null;

export function getEnhancedThreadManager(): EnhancedPersistentThreadManager {
  if (!enhancedThreadManagerInstance) {
    enhancedThreadManagerInstance = new EnhancedPersistentThreadManager();
  }
  return enhancedThreadManagerInstance;
}

