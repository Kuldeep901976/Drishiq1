// API Key Selection and Load Balancing Utilities
import { createClient } from '@supabase/supabase-js';

interface APIKey {
  id: string;
  key_name: string;
  api_key_encrypted: string;
  is_active: boolean;
  priority: number;
  usage_count: number;
  last_used_at: string | null;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  cost_per_token: number;
}

interface LoadBalancingConfig {
  strategy: 'priority' | 'round_robin' | 'least_used' | 'cost_optimized';
  failover_enabled: boolean;
  max_retries: number;
}

export class APIKeyManager {
  private supabase: any;
  private keyCache: Map<string, APIKey[]> = new Map();
  private lastUsedIndex: Map<string, number> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get the best API key for a provider based on load balancing strategy
   */
  async getBestAPIKey(
    providerId: string, 
    config: LoadBalancingConfig = {
      strategy: 'priority',
      failover_enabled: true,
      max_retries: 3
    }
  ): Promise<APIKey | null> {
    try {
      // Get active API keys for the provider
      const { data: keys, error } = await this.supabase
        .from('chat_provider_keys_with_stats')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('load_balance_score', { ascending: true });

      if (error) {
        console.error('Error fetching API keys:', error);
        return null;
      }

      if (!keys || keys.length === 0) {
        console.warn(`No active API keys found for provider ${providerId}`);
        return null;
      }

      // Select key based on strategy
      let selectedKey: APIKey;
      
      switch (config.strategy) {
        case 'priority':
          selectedKey = keys[0]; // Already sorted by priority
          break;
          
        case 'round_robin':
          const lastIndex = this.lastUsedIndex.get(providerId) || 0;
          const nextIndex = (lastIndex + 1) % keys.length;
          selectedKey = keys[nextIndex];
          this.lastUsedIndex.set(providerId, nextIndex);
          break;
          
        case 'least_used':
          selectedKey = keys.reduce((min: APIKey, key: APIKey) => 
            key.usage_count < min.usage_count ? key : min
          );
          break;
          
        case 'cost_optimized':
          selectedKey = keys.reduce((min: APIKey, key: APIKey) => 
            key.cost_per_token < min.cost_per_token ? key : min
          );
          break;
          
        default:
          selectedKey = keys[0];
      }

      return selectedKey;
      
    } catch (error) {
      console.error('Error in getBestAPIKey:', error);
      return null;
    }
  }

  /**
   * Update API key usage statistics
   */
  async updateKeyUsage(keyId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .rpc('update_api_key_usage', { key_uuid: keyId });

      if (error) {
        console.error('Error updating key usage:', error);
      }
    } catch (error) {
      console.error('Error in updateKeyUsage:', error);
    }
  }

  /**
   * Get API key from environment variables (fallback)
   */
  getAPIKeyFromEnv(providerType: string, keyName?: string): string | null {
    const baseVarName = this.getEnvVarName(providerType);
    const envVarName = keyName ? `${baseVarName}_${keyName.toUpperCase().replace(/\s+/g, '_')}` : baseVarName;
    
    return process.env[envVarName] || null;
  }

  /**
   * Test API key connectivity
   */
  async testAPIKey(key: APIKey, providerType: string): Promise<boolean> {
    try {
      const apiKey = key.api_key_encrypted;
      
      // Basic format validation
      const isValidFormat = this.validateAPIKeyFormat(apiKey, providerType);
      if (!isValidFormat) {
        return false;
      }

      // Make a test request to the provider
      const testResult = await this.makeTestRequest(apiKey, providerType);
      return testResult.success;
      
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  /**
   * Get all API keys for a provider with statistics
   */
  async getProviderKeys(providerId: string): Promise<APIKey[]> {
    try {
      const { data: keys, error } = await this.supabase
        .from('chat_provider_api_keys')
        .select('*')
        .eq('provider_id', providerId)
        .order('priority', { ascending: true });

      if (error) {
        console.error('Error fetching provider keys:', error);
        return [];
      }

      return keys || [];
      
    } catch (error) {
      console.error('Error in getProviderKeys:', error);
      return [];
    }
  }

  /**
   * Add new API key to provider
   */
  async addAPIKey(
    providerId: string, 
    keyData: Omit<APIKey, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'last_used_at'>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('chat_provider_api_keys')
        .insert({
          provider_id: providerId,
          ...keyData
        });

      if (error) {
        console.error('Error adding API key:', error);
        return false;
      }

      return true;
      
    } catch (error) {
      console.error('Error in addAPIKey:', error);
      return false;
    }
  }

  /**
   * Update API key configuration
   */
  async updateAPIKey(keyId: string, updates: Partial<APIKey>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('chat_provider_api_keys')
        .update(updates)
        .eq('id', keyId);

      if (error) {
        console.error('Error updating API key:', error);
        return false;
      }

      return true;
      
    } catch (error) {
      console.error('Error in updateAPIKey:', error);
      return false;
    }
  }

  /**
   * Delete API key
   */
  async deleteAPIKey(keyId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('chat_provider_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) {
        console.error('Error deleting API key:', error);
        return false;
      }

      return true;
      
    } catch (error) {
      console.error('Error in deleteAPIKey:', error);
      return false;
    }
  }

  // Private helper methods
  private getEnvVarName(providerType: string): string {
    switch (providerType) {
      case 'openai': return 'OPENAI_API_KEY';
      case 'anthropic': return 'ANTHROPIC_API_KEY';
      case 'grok': return 'GROK_API_KEY';
      default: return 'API_KEY';
    }
  }

  private validateAPIKeyFormat(apiKey: string, providerType: string): boolean {
    switch (providerType) {
      case 'openai':
        return apiKey.startsWith('sk-') && apiKey.length > 20;
      case 'anthropic':
        return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
      case 'grok':
        return apiKey.startsWith('gsk_') && apiKey.length > 20;
      default:
        return apiKey.length > 10;
    }
  }

  private async makeTestRequest(apiKey: string, providerType: string): Promise<{success: boolean}> {
    // This would make actual API calls to test the key
    // For now, just return success if format is valid
    return { success: this.validateAPIKeyFormat(apiKey, providerType) };
  }
}

// Usage example:
export const apiKeyManager = new APIKeyManager(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);





