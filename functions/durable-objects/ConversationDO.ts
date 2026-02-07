/**
 * Conversation Durable Object
 * Phase 3: Per-conversation session state management
 * 
 * This is a placeholder implementation. Full implementation will include:
 * - threadId, tenantId, userId tracking
 * - recentMessages storage
 * - tokensUsed tracking
 * - lastActivity, createdAt timestamps
 * - Methods: appendMessage, getRecentMessages, recordUsage, getTokenUsage, resetSession
 */

import { DurableObject } from 'cloudflare:workers';

export interface ConversationState {
  threadId: string;
  tenantId?: string;
  userId: string;
  recentMessages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  lastActivity: string; // ISO string
  createdAt: string; // ISO string
}

export class ConversationDO extends DurableObject {
  private state: ConversationState | null = null;

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
  }

  /**
   * Initialize or load conversation state
   */
  async init(threadId: string, userId: string, tenantId?: string): Promise<void> {
    // Load from storage if exists
    const stored = await this.ctx.storage.get<ConversationState>('state');
    
    if (stored) {
      this.state = stored;
    } else {
      // Create new state
      this.state = {
        threadId,
        userId,
        tenantId,
        recentMessages: [],
        tokensUsed: {
          prompt: 0,
          completion: 0,
          total: 0,
        },
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      
      // Persist to storage
      await this.ctx.storage.put('state', this.state);
    }
  }

  /**
   * Append a message to the conversation
   */
  async appendMessage(role: 'user' | 'assistant' | 'system', content: string): Promise<void> {
    if (!this.state) {
      throw new Error('Conversation not initialized. Call init() first.');
    }

    this.state.recentMessages.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 50 messages
    if (this.state.recentMessages.length > 50) {
      this.state.recentMessages = this.state.recentMessages.slice(-50);
    }

    this.state.lastActivity = new Date().toISOString();
    await this.ctx.storage.put('state', this.state);
  }

  /**
   * Get recent messages
   */
  async getRecentMessages(limit: number = 20): Promise<ConversationState['recentMessages']> {
    if (!this.state) {
      return [];
    }

    return this.state.recentMessages.slice(-limit);
  }

  /**
   * Record token usage
   */
  async recordUsage(promptTokens: number, completionTokens: number): Promise<void> {
    if (!this.state) {
      throw new Error('Conversation not initialized. Call init() first.');
    }

    this.state.tokensUsed.prompt += promptTokens;
    this.state.tokensUsed.completion += completionTokens;
    this.state.tokensUsed.total += promptTokens + completionTokens;
    this.state.lastActivity = new Date().toISOString();

    await this.ctx.storage.put('state', this.state);
  }

  /**
   * Get token usage
   */
  async getTokenUsage(): Promise<ConversationState['tokensUsed']> {
    if (!this.state) {
      return { prompt: 0, completion: 0, total: 0 };
    }

    return { ...this.state.tokensUsed };
  }

  /**
   * Reset session (clear messages, reset tokens)
   */
  async resetSession(): Promise<void> {
    if (!this.state) {
      return;
    }

    this.state.recentMessages = [];
    this.state.tokensUsed = {
      prompt: 0,
      completion: 0,
      total: 0,
    };
    this.state.lastActivity = new Date().toISOString();

    await this.ctx.storage.put('state', this.state);
  }

  /**
   * HTTP handler for Durable Object
   * Handles REST API requests for conversation state management
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // Initialize state if not already loaded
      if (!this.state) {
        // Try to load from storage first
        const stored = await this.ctx.storage.get<ConversationState>('state');
        if (stored) {
          this.state = stored;
        }
      }

      // Route requests
      if (method === 'GET' && path.endsWith('/messages')) {
        // GET /messages?limit=20
        const limit = parseInt(url.searchParams.get('limit') || '20', 10);
        const messages = await this.getRecentMessages(limit);
        return new Response(JSON.stringify({ messages }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (method === 'GET' && path.endsWith('/usage')) {
        // GET /usage
        const usage = await this.getTokenUsage();
        return new Response(JSON.stringify({ usage }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (method === 'GET' && path.endsWith('/state')) {
        // GET /state
        if (!this.state) {
          return new Response(JSON.stringify({ error: 'Conversation not initialized' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ state: this.state }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (method === 'POST' && path.endsWith('/init')) {
        // POST /init
        const body = await request.json();
        const { threadId, userId, tenantId } = body;
        
        if (!threadId || !userId) {
          return new Response(JSON.stringify({ error: 'threadId and userId required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        await this.init(threadId, userId, tenantId);
        return new Response(JSON.stringify({ success: true, state: this.state }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (method === 'POST' && path.endsWith('/message')) {
        // POST /message
        const body = await request.json();
        const { role, content } = body;

        if (!role || !content) {
          return new Response(JSON.stringify({ error: 'role and content required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (!['user', 'assistant', 'system'].includes(role)) {
          return new Response(JSON.stringify({ error: 'Invalid role' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        await this.appendMessage(role as 'user' | 'assistant' | 'system', content);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (method === 'POST' && path.endsWith('/usage')) {
        // POST /usage
        const body = await request.json();
        const { promptTokens, completionTokens } = body;

        if (typeof promptTokens !== 'number' || typeof completionTokens !== 'number') {
          return new Response(JSON.stringify({ error: 'promptTokens and completionTokens required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        await this.recordUsage(promptTokens, completionTokens);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (method === 'POST' && path.endsWith('/reset')) {
        // POST /reset
        await this.resetSession();
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      console.error('ConversationDO error:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
}

