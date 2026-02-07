// LLM provider adapters and routing

import { 
  ProviderType, 
  ModelType, 
  ProviderConfig, 
  RoutingRule,
  Lang,
  UserType,
  AgeBand,
  DomainOfLife
} from '../contracts/types';

// Base provider interface
export interface LLMProvider {
  id: string;
  type: ProviderType;
  name: string;
  models: ModelType[];
  defaultModel: ModelType;
  temperature: number;
  maxTokens: number;
  timeout: number;
  active: boolean;
  fallbackOrder: number;
  generateResponse(prompt: string, model?: ModelType, options?: { temperature?: number; maxTokens?: number; language?: Lang }): Promise<string>;
}

// OpenAI provider
export class OpenAIProvider implements LLMProvider {
  id: string;
  type: ProviderType = 'openai';
  name: string;
  models: ModelType[] = ['gpt-4', 'gpt-3.5-turbo'];
  defaultModel: ModelType = 'gpt-4';
  temperature: number = 0.7;
  maxTokens: number = 4000;
  timeout: number = 30000;
  active: boolean = true;
  fallbackOrder: number = 1;

  constructor(config: Partial<LLMProvider> = {}) {
    this.id = config.id || 'openai-default';
    this.name = config.name || 'OpenAI';
    Object.assign(this, config);
  }

  async generateResponse(
    prompt: string,
    model: ModelType = this.defaultModel,
    options: {
      temperature?: number;
      maxTokens?: number;
      language?: Lang;
    } = {}
  ): Promise<string> {
    // Simulate API call - in production, this would call OpenAI API
    const { temperature = this.temperature, maxTokens = this.maxTokens } = options;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate response based on prompt
    const responses = [
      `<MSG>I understand your question about ${this.extractTopic(prompt)}. Let me help you with that.</MSG>
<QT type=single progress="1/3">
<Q id="q1">What is your main concern?</Q>
<O>Option A</O>
<O>Option B</O>
<O>Option C</O>
</QT>
<CODE>OK</CODE>
<STRUCT>NONE</STRUCT>`,
      `<MSG>That's an interesting perspective. Let me ask you a few questions to better understand your situation.</MSG>
<QT type=multi progress="2/5">
<Q id="q2">Which of these apply to you?</Q>
<O>Option 1</O>
<O>Option 2</O>
<O>Option 3</O>
<O>Option 4</O>
</QT>
<CODE>OK</CODE>
<STRUCT>NONE</STRUCT>`,
      `<MSG>Based on your responses, I can see this is important to you. Let me provide some guidance.</MSG>
<QT type=single progress="3/3">
<Q id="q3">How would you like to proceed?</Q>
<O>Get more information</O>
<O>Take action now</O>
<O>Think about it</O>
</QT>
<CODE>DONE</CODE>
<STRUCT>REPORT</STRUCT>`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private extractTopic(prompt: string): string {
    // Simple topic extraction
    const words = prompt.toLowerCase().split(' ');
    const topics = ['career', 'relationships', 'health', 'finance', 'education', 'personal growth'];
    const foundTopic = topics.find(topic => words.some(word => word.includes(topic)));
    return foundTopic || 'your situation';
  }
}

// Anthropic provider
export class AnthropicProvider implements LLMProvider {
  id: string;
  type: ProviderType = 'anthropic';
  name: string;
  models: ModelType[] = ['claude-3', 'claude-3.5'];
  defaultModel: ModelType = 'claude-3.5';
  temperature: number = 0.7;
  maxTokens: number = 4000;
  timeout: number = 30000;
  active: boolean = true;
  fallbackOrder: number = 2;

  constructor(config: Partial<LLMProvider> = {}) {
    this.id = config.id || 'anthropic-default';
    this.name = config.name || 'Anthropic Claude';
    Object.assign(this, config);
  }

  async generateResponse(
    prompt: string,
    model: ModelType = this.defaultModel,
    options: {
      temperature?: number;
      maxTokens?: number;
      language?: Lang;
    } = {}
  ): Promise<string> {
    // Simulate API call - in production, this would call Anthropic API
    const { temperature = this.temperature, maxTokens = this.maxTokens } = options;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
    
    // Simulate response
    const responses = [
      `<MSG>I appreciate you sharing this with me. Let me help you work through this step by step.</MSG>
<QT type=single progress="1/4">
<Q id="q1">What's your primary goal here?</Q>
<O>Achieve success</O>
<O>Find balance</O>
<O>Learn something new</O>
<O>Solve a problem</O>
</QT>
<CODE>OK</CODE>
<STRUCT>NONE</STRUCT>`,
      `<MSG>That makes sense. I can see this is a complex situation that requires careful consideration.</MSG>
<QT type=multi progress="2/4">
<Q id="q2">What factors are most important to you?</Q>
<O>Time</O>
<O>Resources</O>
<O>Support</O>
<O>Flexibility</O>
</QT>
<CODE>OK</CODE>
<STRUCT>NONE</STRUCT>`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Grok provider
export class GrokProvider implements LLMProvider {
  id: string;
  type: ProviderType = 'grok';
  name: string;
  models: ModelType[] = ['grok-1'];
  defaultModel: ModelType = 'grok-1';
  temperature: number = 0.8;
  maxTokens: number = 4000;
  timeout: number = 30000;
  active: boolean = true;
  fallbackOrder: number = 3;

  constructor(config: Partial<LLMProvider> = {}) {
    this.id = config.id || 'grok-default';
    this.name = config.name || 'Grok';
    Object.assign(this, config);
  }

  async generateResponse(
    prompt: string,
    model: ModelType = this.defaultModel,
    options: {
      temperature?: number;
      maxTokens?: number;
      language?: Lang;
    } = {}
  ): Promise<string> {
    // Simulate API call - in production, this would call Grok API
    const { temperature = this.temperature, maxTokens = this.maxTokens } = options;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    // Simulate response
    const responses = [
      `<MSG>Interesting question! Let me break this down for you in a way that makes sense.</MSG>
<QT type=single progress="1/2">
<Q id="q1">What's your current situation?</Q>
<O>Just starting out</O>
<O>In the middle of it</O>
<O>Near the end</O>
<O>Not sure</O>
</QT>
<CODE>OK</CODE>
<STRUCT>NONE</STRUCT>`,
      `<MSG>Got it! Now let me help you figure out the best path forward.</MSG>
<QT type=single progress="2/2">
<Q id="q2">What would success look like for you?</Q>
<O>Complete understanding</O>
<O>Practical solution</O>
<O>Clear next steps</O>
<O>All of the above</O>
</QT>
<CODE>DONE</CODE>
<STRUCT>REPORT</STRUCT>`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Provider router
export class ProviderRouter {
  private providers: Map<string, LLMProvider> = new Map();
  private routingRules: RoutingRule[] = [];

  constructor() {
    // Initialize with default providers
    this.addProvider(new OpenAIProvider());
    this.addProvider(new AnthropicProvider());
    this.addProvider(new GrokProvider());
  }

  addProvider(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
  }

  removeProvider(providerId: string): void {
    this.providers.delete(providerId);
  }

  getProvider(providerId: string): LLMProvider | undefined {
    return this.providers.get(providerId);
  }

  getAllProviders(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  addRoutingRule(rule: RoutingRule): void {
    this.routingRules.push(rule);
    // Sort by priority (higher priority first)
    this.routingRules.sort((a, b) => b.priority - a.priority);
  }

  removeRoutingRule(ruleId: string): void {
    this.routingRules = this.routingRules.filter(rule => rule.id !== ruleId);
  }

  getRoutingRules(): RoutingRule[] {
    return [...this.routingRules];
  }

  // Route request to appropriate provider
  async routeRequest(
    prompt: string,
    context: {
      domainOfLife?: DomainOfLife;
      language?: Lang;
      userType?: UserType;
      ageBand?: AgeBand;
    },
    options: {
      temperature?: number;
      maxTokens?: number;
      timeout?: number;
    } = {}
  ): Promise<{ provider: LLMProvider; response: string; model: ModelType }> {
    // Find matching routing rule
    const matchingRule = this.findMatchingRule(context);
    
    if (matchingRule) {
      const provider = this.providers.get(matchingRule.providerId);
      if (provider && provider.active) {
        try {
          const response = await this.callProviderWithTimeout(
            provider,
            prompt,
            matchingRule.model,
            options
          );
          return { provider, response, model: matchingRule.model };
        } catch (error) {
          console.warn(`Provider ${provider.id} failed, trying fallback`);
        }
      }
    }

    // Fallback to default provider
    const fallbackProvider = this.getFallbackProvider();
    if (fallbackProvider) {
      const response = await this.callProviderWithTimeout(
        fallbackProvider,
        prompt,
        fallbackProvider.defaultModel,
        options
      );
      return { provider: fallbackProvider, response, model: fallbackProvider.defaultModel };
    }

    throw new Error('No available providers');
  }

  private findMatchingRule(context: {
    domainOfLife?: DomainOfLife;
    language?: Lang;
    userType?: UserType;
    ageBand?: AgeBand;
  }): RoutingRule | undefined {
    return this.routingRules.find(rule => {
      if (!rule.active) return false;
      
      const { condition } = rule;
      
      if (condition.domainOfLife && !condition.domainOfLife.includes(context.domainOfLife!)) {
        return false;
      }
      
      if (condition.language && !condition.language.includes(context.language!)) {
        return false;
      }
      
      if (condition.userType && !condition.userType.includes(context.userType!)) {
        return false;
      }
      
      if (condition.ageBand && !condition.ageBand.includes(context.ageBand!)) {
        return false;
      }
      
      return true;
    });
  }

  private getFallbackProvider(): LLMProvider | undefined {
    const activeProviders = Array.from(this.providers.values())
      .filter(p => p.active)
      .sort((a, b) => a.fallbackOrder - b.fallbackOrder);
    
    return activeProviders[0];
  }

  private async callProviderWithTimeout(
    provider: LLMProvider,
    prompt: string,
    model: ModelType,
    options: { temperature?: number; maxTokens?: number; timeout?: number }
  ): Promise<string> {
    const timeout = options.timeout || provider.timeout;
    
    return Promise.race([
      provider.generateResponse(prompt, model, options),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Provider timeout')), timeout)
      )
    ]);
  }
}

