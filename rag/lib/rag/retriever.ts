/**
 * Memory Retriever
 * 
 * Retrieves relevant memories using semantic similarity search.
 * 
 * Usage:
 *   const retriever = new MemoryRetriever();
 *   const memories = await retriever.retrieve(userId, queryText, { limit: 10 });
 */

import { createServiceClient } from '@/lib/supabase';
import OpenAI from 'openai';

interface RetrieveOptions {
  limit?: number;
  minSimilarity?: number;
  contentTypes?: Array<'conversation' | 'insight' | 'preference' | 'fact' | 'goal' | 'challenge'>;
  sessionId?: string;
  maxAge?: number; // Days
}

export interface RetrievedMemory {
  id: string;
  content: string;
  contentType: string;
  relevanceScore: number;
  similarity: number;
  createdAt: Date;
  metadata: Record<string, any>;
}

export class MemoryRetriever {
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
   * Retrieve relevant memories for a query
   */
  async retrieve(
    userId: string,
    queryText: string,
    options: RetrieveOptions = {}
  ): Promise<RetrievedMemory[]> {
    const limit = options.limit || 10;
    const minSimilarity = options.minSimilarity || 0.7;

    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(queryText);

    // Call database function for similarity search
    const { data, error } = await this.supabase.rpc('find_similar_memories', {
      p_user_id: userId,
      p_query_embedding: `[${queryEmbedding.join(',')}]`,
      p_limit: limit,
      p_min_similarity: minSimilarity,
      p_content_types: options.contentTypes || null
    });

    if (error) {
      throw new Error(`Failed to retrieve memories: ${error.message}`);
    }

    // Map to RetrievedMemory format
    return (data || []).map((m: any) => ({
      id: m.memory_id,
      content: m.content,
      contentType: m.content_type,
      relevanceScore: m.relevance_score,
      similarity: m.similarity,
      createdAt: new Date(m.created_at),
      metadata: m.metadata || {}
    }));
  }

  /**
   * Retrieve memories for context building (no query, just recent/relevant)
   */
  async retrieveForContext(
    userId: string,
    options: RetrieveOptions = {}
  ): Promise<RetrievedMemory[]> {
    const limit = options.limit || 20;

    // Get recent memories with high relevance
    const { data, error } = await this.supabase
      .from('memories')
      .select('*, memory_vectors!inner(embedding)')
      .eq('user_id', userId)
      .order('relevance_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to retrieve memories for context: ${error.message}`);
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      content: m.content,
      contentType: m.content_type,
      relevanceScore: m.relevance_score,
      similarity: 1.0, // No query, so similarity is not applicable
      createdAt: new Date(m.created_at),
      metadata: m.metadata || {}
    }));
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
}

