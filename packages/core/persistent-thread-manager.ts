/**
 * Persistent Thread Manager — Clean architecture.
 * Only 3 phases: pre_chat | analysis_chat | main_chat.
 * chat_threads is a container of messages for a phase.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export type ThreadPhase = 'pre_chat' | 'analysis_chat' | 'main_chat';

export interface CreateThreadParams {
  visitorId?: string | null;
  tempUserId?: string | null;
  userId?: string | null;
  language?: string;
}

export interface Thread {
  id: string;
  thread_phase: ThreadPhase;
  visitor_id: string | null;
  temp_user_id: string | null;
  user_id: string | null;
  language: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AddMessageParams {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class PersistentThreadManager {
  /**
   * Create a thread for a phase. Inserts into chat_threads.
   */
  async createThread(
    phase: ThreadPhase,
    params: CreateThreadParams
  ): Promise<Thread> {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('chat_threads')
      .insert({
        thread_phase: phase,
        visitor_id: params.visitorId ?? null,
        temp_user_id: params.tempUserId ?? null,
        user_id: params.userId ?? null,
        language: params.language ?? 'en',
        status: 'active',
        metadata: {},
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return this.rowToThread(data);
  }

  /**
   * Get a thread by id.
   */
  async getThread(threadId: string): Promise<Thread | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('id', threadId)
      .maybeSingle();
    if (error || !data) return null;
    return this.rowToThread(data);
  }

  /**
   * Get the latest active thread for a visitor in a phase.
   */
  async getActiveThreadByVisitor(
    phase: ThreadPhase,
    visitorId: string
  ): Promise<Thread | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('thread_phase', phase)
      .eq('visitor_id', visitorId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return this.rowToThread(data);
  }

  /**
   * Get messages for a thread (for history/context).
   */
  async getMessages(
    threadId: string,
    limit: number = 50
  ): Promise<Array<{ role: string; content: string }>> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) return [];
    return (data || []).map((row) => ({
      role: row.role ?? 'user',
      content: row.content ?? '',
    }));
  }

  /**
   * Add a message to a thread. Inserts into chat_messages.
   */
  async addMessage(threadId: string, params: AddMessageParams): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }
    const { error } = await supabase.from('chat_messages').insert({
      thread_id: threadId,
      role: params.role,
      content: params.content,
      message_type: 'text',
    });
    if (error) throw error;

    await supabase
      .from('chat_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId);
  }

  private rowToThread(row: Record<string, unknown>): Thread {
    return {
      id: row.id as string,
      thread_phase: row.thread_phase as ThreadPhase,
      visitor_id: (row.visitor_id as string) ?? null,
      temp_user_id: (row.temp_user_id as string) ?? null,
      user_id: (row.user_id as string) ?? null,
      language: (row.language as string) ?? 'en',
      status: (row.status as string) ?? 'active',
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }
}
