/**
 * ConversationDO Client
 * Helper functions to interact with ConversationDO Durable Object
 * 
 * Usage:
 *   const doId = env.CONVERSATION_SESSIONS.idFromName(threadId);
 *   const stub = env.CONVERSATION_SESSIONS.get(doId);
 *   const client = new ConversationDOClient(stub);
 *   await client.init(threadId, userId, tenantId);
 */

export class ConversationDOClient {
  private stub: DurableObjectStub;

  constructor(stub: DurableObjectStub) {
    this.stub = stub;
  }

  /**
   * Initialize conversation state
   */
  async init(threadId: string, userId: string, tenantId?: string): Promise<any> {
    const response = await this.stub.fetch('https://do/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, userId, tenantId }),
    });
    return await response.json();
  }

  /**
   * Append a message
   */
  async appendMessage(role: 'user' | 'assistant' | 'system', content: string): Promise<any> {
    const response = await this.stub.fetch('https://do/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, content }),
    });
    return await response.json();
  }

  /**
   * Get recent messages
   */
  async getRecentMessages(limit: number = 20): Promise<any> {
    const response = await this.stub.fetch(`https://do/messages?limit=${limit}`, {
      method: 'GET',
    });
    const data = await response.json();
    return data.messages || [];
  }

  /**
   * Record token usage
   */
  async recordUsage(promptTokens: number, completionTokens: number): Promise<any> {
    const response = await this.stub.fetch('https://do/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptTokens, completionTokens }),
    });
    return await response.json();
  }

  /**
   * Get token usage
   */
  async getTokenUsage(): Promise<any> {
    const response = await this.stub.fetch('https://do/usage', {
      method: 'GET',
    });
    const data = await response.json();
    return data.usage || { prompt: 0, completion: 0, total: 0 };
  }

  /**
   * Get full state
   */
  async getState(): Promise<any> {
    const response = await this.stub.fetch('https://do/state', {
      method: 'GET',
    });
    const data = await response.json();
    return data.state || null;
  }

  /**
   * Reset session
   */
  async resetSession(): Promise<any> {
    const response = await this.stub.fetch('https://do/reset', {
      method: 'POST',
    });
    return await response.json();
  }
}

/**
 * Helper to get ConversationDO stub from environment
 */
export function getConversationDO(
  env: { CONVERSATION_SESSIONS?: DurableObjectNamespace },
  threadId: string
): DurableObjectStub | null {
  if (!env.CONVERSATION_SESSIONS) {
    return null;
  }

  // Create deterministic ID from threadId
  const id = env.CONVERSATION_SESSIONS.idFromName(threadId);
  return env.CONVERSATION_SESSIONS.get(id);
}




