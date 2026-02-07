/**
 * Memory Writer
 * 
 * Extracts key information from conversations and stores as memories with embeddings.
 * 
 * Usage:
 *   const writer = new MemoryWriter();
 *   await writer.writeMemory(userId, sessionId, content, { type: 'preference' });
 */

import { createServiceClient } from '@/lib/supabase';
import OpenAI from 'openai';

interface WriteMemoryOptions {
  sessionId?: string;
  contentType?: 'conversation' | 'insight' | 'preference' | 'fact' | 'goal' | 'challenge';
  metadata?: Record<string, any>;
  relevanceScore?: number;
  expiresAt?: Date;
}

export class MemoryWriter {
  private supabase = createServiceClient();
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Write a memory with embedding
   */
  async writeMemory(
    userId: string,
    content: string,
    options: WriteMemoryOptions = {}
  ): Promise<string> {
    // Generate embedding
    const embedding = await this.generateEmbedding(content);

    // Insert memory
    const { data: memory, error: memoryError } = await this.supabase
      .from('memories')
      .insert({
        user_id: userId,
        session_id: options.sessionId || null,
        content: content.trim(),
        content_type: options.contentType || 'conversation',
        metadata: options.metadata || {},
        relevance_score: options.relevanceScore || 1.0,
        expires_at: options.expiresAt?.toISOString() || null,
        source: 'chat'
      })
      .select()
      .single();

    if (memoryError) {
      throw new Error(`Failed to insert memory: ${memoryError.message}`);
    }

    // Insert embedding
    const { error: vectorError } = await this.supabase
      .from('memory_vectors')
      .insert({
        memory_id: memory.id,
        embedding: `[${embedding.join(',')}]`, // pgvector format
        model: 'text-embedding-3-small'
      });

    if (vectorError) {
      // Clean up memory if embedding insert fails
      await this.supabase.from('memories').delete().eq('id', memory.id);
      throw new Error(`Failed to insert embedding: ${vectorError.message}`);
    }

    return memory.id;
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.trim()
      });

      return response.data[0].embedding;
    } catch (error: any) {
      throw new Error(`Failed to generate embedding: ${error?.message || String(error)}`);
    }
  }

  /**
   * Batch write memories (for efficiency)
   */
  async writeMemoriesBatch(
    userId: string,
    memories: Array<{ content: string; options?: WriteMemoryOptions }>
  ): Promise<string[]> {
    // Generate embeddings in batch
    const texts = memories.map(m => m.content.trim());
    const embeddings = await this.generateEmbeddingsBatch(texts);

    // Insert memories
    const memoryInserts = memories.map((m, i) => ({
      user_id: userId,
      session_id: m.options?.sessionId || null,
      content: m.content.trim(),
      content_type: m.options?.contentType || 'conversation',
      metadata: m.options?.metadata || {},
      relevance_score: m.options?.relevanceScore || 1.0,
      expires_at: m.options?.expiresAt?.toISOString() || null,
      source: 'chat'
    }));

    const { data: insertedMemories, error: memoryError } = await this.supabase
      .from('memories')
      .insert(memoryInserts)
      .select();

    if (memoryError) {
      throw new Error(`Failed to insert memories: ${memoryError.message}`);
    }

    // Insert embeddings
    const vectorInserts = insertedMemories.map((memory, i) => ({
      memory_id: memory.id,
      embedding: `[${embeddings[i].join(',')}]`,
      model: 'text-embedding-3-small'
    }));

    const { error: vectorError } = await this.supabase
      .from('memory_vectors')
      .insert(vectorInserts);

    if (vectorError) {
      // Clean up memories if embedding insert fails
      const memoryIds = insertedMemories.map(m => m.id);
      await this.supabase.from('memories').delete().in('id', memoryIds);
      throw new Error(`Failed to insert embeddings: ${vectorError.message}`);
    }

    return insertedMemories.map(m => m.id);
  }

  /**
   * Generate embeddings in batch
   */
  private async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts
      });

      return response.data.map(d => d.embedding);
    } catch (error: any) {
      throw new Error(`Failed to generate embeddings: ${error?.message || String(error)}`);
    }
  }

  /**
   * Extract and write memories from conversation
   * TODO: Implement extraction logic (use AI to identify key information)
   */
  async extractAndWriteMemories(
    userId: string,
    sessionId: string,
    conversation: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string[]> {
    // TODO: Use AI to extract:
    // - User preferences ("I prefer X", "I don't like Y")
    // - Key facts ("My birthday is...", "I work at...")
    // - Goals ("I want to...", "My goal is...")
    // - Challenges ("I'm struggling with...")
    
    // For now, placeholder implementation
    const memories: string[] = [];
    
    // Simple extraction: look for preference statements
    for (const msg of conversation) {
      if (msg.role === 'user') {
        const content = msg.content.toLowerCase();
        if (content.includes('i prefer') || content.includes('i like')) {
          memories.push(msg.content);
        }
      }
    }

    // Write extracted memories
    if (memories.length > 0) {
      return await this.writeMemoriesBatch(userId, memories.map(content => ({
        content,
        options: {
          sessionId,
          contentType: 'preference'
        }
      })));
    }

    return [];
  }
}

