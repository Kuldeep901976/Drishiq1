// =====================================================
// ANTHROPIC API INTEGRATION
// =====================================================
// Real Anthropic API integration for production use
// =====================================================

import Anthropic from '@anthropic-ai/sdk';

export interface AnthropicConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export class RealAnthropicProvider {
  private anthropic: Anthropic;
  private config: AnthropicConfig;

  constructor(config: AnthropicConfig) {
    this.config = {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 4000,
      timeout: 30000,
      ...config
    };

    this.anthropic = new Anthropic({
      apiKey: this.config.apiKey,
    });
  }

  async generateResponse(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      language?: string;
    } = {}
  ): Promise<string> {
    try {
      const { temperature = this.config.temperature, maxTokens = this.config.maxTokens } = options;

      const response = await this.anthropic.messages.create({
        model: this.config.model!,
        max_tokens: maxTokens || 4000,
        temperature: temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Extract the text content from the response
      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }

      throw new Error('Unexpected response format from Anthropic');
    } catch (error: any) {
      console.error('Anthropic API error:', error);
      throw new Error(`Anthropic API failed: ${error.message}`);
    }
  }
}




