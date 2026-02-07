// Worker orchestrator and streaming glue — uses PersistentThreadManager (phase-based threads only).

import { EventEmitter } from 'events';
import {
  ChatRequest,
  ChatResponse,
  AssistantTurn,
  UserResponse,
  UsageMetrics,
  Lang,
  User,
  UserType,
  AgeBand,
} from '../contracts/types';
import { TagProtocolParser, UsageAccountant } from '../core/chat';
import { PersistentThreadManager, type Thread } from '../core/persistent-thread-manager';
import { CrossChatIntelligenceManager } from '../core/cross-chat-intelligence';
import { InspectorPass, HallucinationControls } from '../policy/validator';
import { ProviderRouter } from '../llm/providers';
import { PolicyEngine } from '../policy/engine';

const DEFAULT_DOMAIN_FOR_POLICY = 'personal-growth' as const;

export interface StreamingOptions {
  enableStreaming: boolean;
  chunkSize: number;
  delay: number;
}

export interface WorkerConfig {
  enableStreaming: boolean;
  maxRetries: number;
  timeout: number;
  chunkSize: number;
  delay: number;
}

export class ChatWorker extends EventEmitter {
  private threadManager: PersistentThreadManager;
  private crossChatIntelligence: CrossChatIntelligenceManager;
  private usageAccountant: UsageAccountant;
  private providerRouter: ProviderRouter;
  private config: WorkerConfig;
  private activeSessions: Map<string, unknown> = new Map();

  constructor(config: Partial<WorkerConfig> = {}) {
    super();

    this.config = {
      enableStreaming: true,
      maxRetries: 3,
      timeout: 30000,
      chunkSize: 50,
      delay: 100,
      ...config,
    };

    this.threadManager = new PersistentThreadManager();
    this.crossChatIntelligence = new CrossChatIntelligenceManager();
    this.usageAccountant = new UsageAccountant();
    this.providerRouter = new ProviderRouter();
  }

  async processChatRequest(
    request: ChatRequest,
    user: User | { id: string; name?: string; age?: number; ageBand?: string },
    policies: unknown,
    featureFlags: unknown
  ): Promise<ChatResponse> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const validation = PolicyEngine.processUserInput(
        request.message || '',
        user as User,
        policies,
        featureFlags
      );

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      let thread: Thread | null = null;
      if (request.threadId) {
        thread = await this.threadManager.getThread(request.threadId);
      }
      if (!thread) {
        thread = await this.threadManager.createThread('main_chat', {
          userId: request.userId,
          language: request.language,
        });
      }

      const prompt = await this.buildPrompt(request, user, thread);
      const context = {
        domainOfLife: DEFAULT_DOMAIN_FOR_POLICY,
        language: request.language,
        userType: ((user as User).userType || 'other') as UserType,
        ageBand: ((user as User).ageBand || 'adult') as AgeBand,
      };

      const { provider, response, model } = await this.providerRouter.routeRequest(
        prompt,
        context,
        {
          temperature: 0.7,
          maxTokens: 4000,
          timeout: this.config.timeout,
        }
      );

      let finalResponse = response;
      const jsonPattern = /^\s*[{[]/;
      if (jsonPattern.test(finalResponse)) {
        console.error('❌ JSON detected in LLM response - rejecting');
        const correctedPrompt = `${prompt}\n\nIMPORTANT: You must respond in plain text only. Do not use JSON, XML, or any structured format. Use only Markdown and the patterns I showed you.`;
        const correctedResponse = await provider.generateResponse(
          correctedPrompt,
          model,
          { temperature: 0.7, maxTokens: 4000 }
        );
        if (jsonPattern.test(correctedResponse)) {
          throw new Error('LLM continues to output JSON despite instructions. Please check system prompt.');
        }
        finalResponse = correctedResponse;
      }

      let assistantTurn = TagProtocolParser.parseAssistantResponse(finalResponse);

      const inspectorResult = InspectorPass.inspect(
        assistantTurn,
        request.language,
        ((user as User).ageBand || 'adult') as AgeBand
      );

      if (inspectorResult.result === 'REVISE' && !inspectorResult.repaired) {
        const correctiveTurn: AssistantTurn = {
          message: `I need to clarify something. ${inspectorResult.errors[0].suggestion || 'Please provide more information.'}`,
          questionBlocks: [
            {
              id: 'clarify',
              questions: [
                {
                  id: 'clarify_q1',
                  text: 'Can you help me understand this better?',
                  type: 'single',
                  options: ['Yes', 'No'],
                },
              ],
              progress: '1/1',
              type: 'single',
            },
          ],
          flowState: 'OK',
          structIntent: 'NONE',
          language: request.language,
        };

        return {
          threadId: thread.id,
          turn: correctiveTurn,
          sessionId,
          usage: {
            sessionId,
            providerId: provider.id,
            model,
            tokensIn: this.estimateTokens(prompt),
            tokensOut: this.estimateTokens(response),
            bytesIn: new Blob([prompt]).size,
            bytesOut: new Blob([response]).size,
            processingTime: Date.now(),
            timestamp: new Date(),
          },
        };
      }

      assistantTurn = HallucinationControls.addEvidenceMode(
        assistantTurn,
        DEFAULT_DOMAIN_FOR_POLICY
      );
      assistantTurn = HallucinationControls.moderateClaims(
        assistantTurn,
        DEFAULT_DOMAIN_FOR_POLICY
      );

      const processedTurn = this.processAssistantTurn(assistantTurn, user, policies);

      const usage: UsageMetrics = {
        sessionId,
        providerId: provider.id,
        model,
        tokensIn: this.estimateTokens(prompt),
        tokensOut: this.estimateTokens(response),
        bytesIn: new Blob([prompt]).size,
        bytesOut: new Blob([response]).size,
        processingTime: Date.now(),
        timestamp: new Date(),
      };

      this.usageAccountant.recordUsage(sessionId, usage);

      await this.threadManager.addMessage(thread.id, {
        role: 'assistant',
        content: response,
      });

      try {
        const shouldUpdate = await this.crossChatIntelligence.shouldUpdateProfile(user.id);
        if (shouldUpdate) {
          await this.crossChatIntelligence.updateUserProfile(user.id);
        }
      } catch (error) {
        console.warn('Could not update user profile:', error);
      }

      this.emit('message', { content: processedTurn.message, isComplete: true });
      this.emit('questions', { questionBlocks: processedTurn.questionBlocks });
      this.emit('complete', {
        flowState: processedTurn.flowState,
        structIntent: processedTurn.structIntent,
        sessionId,
      });

      return {
        threadId: thread.id,
        turn: processedTurn,
        sessionId,
        usage,
      };
    } catch (error) {
      this.emit('error', { error, retryable: true });
      throw error;
    }
  }

  async streamChatResponse(
    request: ChatRequest,
    user: unknown,
    policies: unknown,
    featureFlags: unknown
  ): Promise<void> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.emit('streaming:start', { sessionId });

      const response = await this.processChatRequest(
        request,
        user as User,
        policies,
        featureFlags
      );

      if (this.config.enableStreaming) {
        await this.streamContent(
          response.turn.message,
          this.config.chunkSize,
          this.config.delay
        );
      }

      this.emit('streaming:complete', { sessionId, response });
    } catch (error) {
      this.emit('streaming:error', { sessionId, error });
      throw error;
    }
  }

  async processUserResponses(
    threadId: string,
    responses: UserResponse[],
    user: User | { id: string; ageBand?: string },
    policies: unknown,
    featureFlags: unknown
  ): Promise<ChatResponse> {
    const thread = await this.threadManager.getThread(threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    for (const response of responses) {
      const content = this.formatUserResponse(response);
      await this.threadManager.addMessage(threadId, { role: 'user', content });
    }

    const followUpRequest: ChatRequest = {
      threadId,
      userId: user.id,
      responses,
      language: (thread.language as Lang) || 'en',
    };

    return this.processChatRequest(
      followUpRequest,
      user as User,
      policies,
      featureFlags
    );
  }

  async getThreadHistory(threadId: string): Promise<Array<{ role: string; content: string }>> {
    return await this.threadManager.getMessages(threadId);
  }

  getUsageMetrics(sessionId: string): unknown[] {
    return this.usageAccountant.getSessionUsage(sessionId);
  }

  private async buildPrompt(
    request: ChatRequest,
    user: { id: string; name?: string; age?: number },
    thread: Thread
  ): Promise<string> {
    const history = await this.threadManager.getMessages(thread.id);

    let contextSummary = '';
    let personalizedPrompt = '';
    try {
      const enhancedContext = await this.crossChatIntelligence.getEnhancedContext(
        user.id,
        request.threadId
      );
      if (enhancedContext.userProfile) {
        personalizedPrompt = this.crossChatIntelligence.buildPersonalizedPrompt(
          enhancedContext.userProfile,
          enhancedContext.threadContext,
          DEFAULT_DOMAIN_FOR_POLICY
        );
      }
      if (enhancedContext.threadContext) {
        const ctx = enhancedContext.threadContext;
        contextSummary = `
CONVERSATION CONTEXT:
- Summary: ${ctx.conversation_summary || 'No summary available'}
- Current Focus: ${ctx.current_focus || 'General conversation'}
- Key Insights: ${(ctx.key_insights || []).join(', ') || 'None yet'}
- User Patterns: ${(ctx.user_patterns || []).join(', ') || 'None yet'}
- Goals & Challenges: ${(ctx.goals_and_challenges || []).join(', ') || 'None yet'}
- Action Items: ${(ctx.action_items || []).join(', ') || 'None yet'}
- AI Confidence: ${ctx.ai_confidence ?? 0.5}
`;
      }
      if (enhancedContext.userProfile) {
        contextSummary += `
CROSS-CHAT INTELLIGENCE:
- Relationship Depth: ${enhancedContext.userProfile.relationshipDepth}
- Overall Confidence: ${enhancedContext.userProfile.overallConfidence}
- Personalization Level: ${enhancedContext.userProfile.personalizationLevel}/5
- Preferred Language: ${enhancedContext.userProfile.preferredLanguage}
- Interaction Frequency: ${enhancedContext.userProfile.interactionFrequency}
`;
      }
    } catch (error) {
      console.warn('Could not retrieve enhanced context:', error);
    }

    let prompt =
      personalizedPrompt ||
      `You are DrishiQ, an AI assistant that helps users navigate life challenges with clarity and wisdom. You are warm, empathetic, and professional. You provide thoughtful guidance while being encouraging and supportive. Always respond as DrishiQ, not as a generic AI assistant.`;

    prompt += `

You are embedded in a web app. Never output JSON or XML.
Only produce plain text using Markdown and the exact patterns below.
Reply in the user's selected language: ${request.language}

QUESTION blocks (UI parses these)
### QUESTION
Type: single-choice  <-- or: multi-choice
Prompt: <your question>

Options:
( ) Option A         <-- single-choice uses ( )
( ) Option B

For multi-choice, use [ ]:

### QUESTION
Type: multi-choice
Prompt: <your question>

Options:
[ ] Option A
[ ] Option C

Rich text (rendered nicely by the UI)

Use normal Markdown:

Headings: #, ##, ###

Emphasis: *italic*, **bold**

Lists: - item

Tables (pipe syntax)

Blockquotes: > note

Code: fenced \`\`\` blocks

Callouts (styled cards)
:::info
Short helpful tip.
:::

:::warning
Risk or caveat.
:::

Charts (plain text → UI will chart the table below)
Chart: line   <-- line|bar|pie
Title: Weekly Signups

| Week | Signups |
|------|---------|
| W1   | 120     |
| W2   | 180     |

When user replies with:

My answer:
- Option: Option B

or

My answers:
- Selected: Option A
- Selected: Option C

acknowledge and continue.

Use provided summaries to avoid re-asking covered facts. Never output JSON.

User: ${user.name ?? 'User'}, Age: ${user.age ?? 'unknown'}, Language: ${request.language}${contextSummary}`;

    if (history.length > 0) {
      prompt += `\n\nRecent conversation:\n`;
      for (const msg of history.slice(-10)) {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      }
    }

    if (request.message) {
      prompt += `\n\nUser message: ${request.message}`;
    }

    if (request.responses && request.responses.length > 0) {
      prompt += `\n\nUser responses:`;
      for (const r of request.responses) {
        prompt += `\nQ${r.questionId}: ${r.selected.join(', ')}`;
        if (r.extra) prompt += ` (${r.extra})`;
      }
    }

    prompt += `\n\nRespond using the Markdown patterns above. Use the conversation context to provide personalized responses.`;

    return prompt;
  }

  private processAssistantTurn(
    turn: AssistantTurn,
    user: User | { id: string; name?: string; age?: number; ageBand?: string },
    policies: unknown
  ): AssistantTurn {
    const processedMessage = PolicyEngine.processAssistantOutput(
      turn.message,
      user as User,
      policies,
      DEFAULT_DOMAIN_FOR_POLICY
    );
    return { ...turn, message: processedMessage };
  }

  private async streamContent(
    content: string,
    chunkSize: number,
    delay: number
  ): Promise<void> {
    const chunks = this.chunkText(content, chunkSize);
    for (let i = 0; i < chunks.length; i++) {
      this.emit('streaming:chunk', {
        chunk: chunks[i],
        index: i,
        total: chunks.length,
      });
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    const words = text.split(' ');
    for (const word of words) {
      if (currentChunk.length + word.length + 1 <= chunkSize) {
        currentChunk += (currentChunk ? ' ' : '') + word;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = word;
      }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  }

  private formatUserResponse(response: UserResponse): string {
    let formatted = `Q${response.questionId}: ${response.selected.join(', ')}`;
    if (response.extra) formatted += ` (${response.extra})`;
    if (response.transcript) formatted += ` [Transcript: ${response.transcript}]`;
    return formatted;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
