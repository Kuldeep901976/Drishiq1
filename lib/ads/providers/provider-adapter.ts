/**
 * Provider Adapter Interface
 * Defines contract for third-party ad provider integrations
 */

export interface ProviderConfig {
  id: string;
  name: string;
  type: 'JS' | 'VAST' | 'header_bid' | 'iframe' | 'custom';
  config: Record<string, any>;
  active: boolean;
  priority: number;
}

export interface ProviderContext {
  placement_code: string;
  placement_id: string;
  width?: number;
  height?: number;
  user_id?: string;
  anon_id: string;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  country?: string;
  page_url?: string;
}

export interface ProviderResponse {
  success: boolean;
  tag?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Provider Adapter Interface
 */
export interface IProviderAdapter {
  /**
   * Get provider name
   */
  getName(): string;

  /**
   * Check if provider is available/active
   */
  isAvailable(): boolean;

  /**
   * Fetch ad tag from provider
   */
  fetchTag(context: ProviderContext): Promise<ProviderResponse>;

  /**
   * Handle provider callback (for reporting, billing, etc.)
   */
  handleCallback(payload: any): Promise<void>;

  /**
   * Validate provider configuration
   */
  validateConfig(config: Record<string, any>): { valid: boolean; error?: string };
}

/**
 * Base Provider Adapter
 */
export abstract class BaseProviderAdapter implements IProviderAdapter {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  getName(): string {
    return this.config.name;
  }

  isAvailable(): boolean {
    return this.config.active;
  }

  abstract fetchTag(context: ProviderContext): Promise<ProviderResponse>;
  abstract handleCallback(payload: any): Promise<void>;
  abstract validateConfig(config: Record<string, any>): { valid: boolean; error?: string };
}

/**
 * JS Tag Provider Adapter (for standard JavaScript ad tags)
 */
export class JSTagProviderAdapter extends BaseProviderAdapter {
  async fetchTag(context: ProviderContext): Promise<ProviderResponse> {
    try {
      const tagTemplate = this.config.config.tag_template;
      if (!tagTemplate) {
        return { success: false, error: 'Tag template not configured' };
      }

      // Replace template variables
      let tag = tagTemplate
        .replace(/{placement_code}/g, context.placement_code)
        .replace(/{placement_id}/g, context.placement_id)
        .replace(/{width}/g, String(context.width || ''))
        .replace(/{height}/g, String(context.height || ''))
        .replace(/{anon_id}/g, context.anon_id)
        .replace(/{user_id}/g, context.user_id || '')
        .replace(/{device_type}/g, context.device_type || 'desktop')
        .replace(/{country}/g, context.country || '');

      return {
        success: true,
        tag,
        metadata: {
          provider: this.config.name,
          type: 'js',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleCallback(payload: any): Promise<void> {
    // Handle provider callbacks (reporting, billing, etc.)
    console.log(`Provider ${this.config.name} callback:`, payload);
  }

  validateConfig(config: Record<string, any>): { valid: boolean; error?: string } {
    if (!config.tag_template) {
      return { valid: false, error: 'tag_template is required' };
    }
    return { valid: true };
  }
}

/**
 * VAST Provider Adapter (for video ads)
 */
export class VASTProviderAdapter extends BaseProviderAdapter {
  async fetchTag(context: ProviderContext): Promise<ProviderResponse> {
    try {
      const vastUrl = this.config.config.vast_url;
      if (!vastUrl) {
        return { success: false, error: 'VAST URL not configured' };
      }

      // Build VAST URL with parameters
      const url = new URL(vastUrl);
      url.searchParams.set('placement', context.placement_code);
      url.searchParams.set('anon_id', context.anon_id);
      if (context.width) url.searchParams.set('width', String(context.width));
      if (context.height) url.searchParams.set('height', String(context.height));

      const vastTag = `<div class="vast-container" data-vast-url="${url.toString()}"></div>`;

      return {
        success: true,
        tag: vastTag,
        metadata: {
          provider: this.config.name,
          type: 'vast',
          vast_url: url.toString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleCallback(payload: any): Promise<void> {
    console.log(`VAST Provider ${this.config.name} callback:`, payload);
  }

  validateConfig(config: Record<string, any>): { valid: boolean; error?: string } {
    if (!config.vast_url) {
      return { valid: false, error: 'vast_url is required' };
    }
    return { valid: true };
  }
}

/**
 * Provider Factory
 */
export class ProviderFactory {
  static createAdapter(config: ProviderConfig): IProviderAdapter {
    switch (config.type) {
      case 'JS':
        return new JSTagProviderAdapter(config);
      case 'VAST':
        return new VASTProviderAdapter(config);
      default:
        throw new Error(`Unsupported provider type: ${config.type}`);
    }
  }
}

