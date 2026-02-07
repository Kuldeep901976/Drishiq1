// Multiple API Keys Management Component
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Button, Input, Select } from '@/components/ui';

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

interface Provider {
  id: string;
  provider_name: string;
  provider_type: 'openai' | 'anthropic' | 'grok';
  api_keys: APIKey[];
}

export default function MultipleAPIKeysManager() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [newKey, setNewKey] = useState({
    key_name: '',
    api_key: '',
    priority: 1,
    rate_limit_per_minute: 60,
    rate_limit_per_hour: 1000,
    cost_per_token: 0.00002
  });
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const loadProviders = async () => {
    // Load providers with their API keys
    // Implementation would fetch from the new schema
  };

  const addAPIKey = async (providerId: string) => {
    // Add new API key to provider
    const envVarName = getEnvVarName(providers.find(p => p.id === providerId)?.provider_type || '');
    
    alert(`🔐 Add API Key to Environment Variables

To add this API key:

1. Open your .env.local file
2. Add this line:
   ${envVarName}_${newKey.key_name.toUpperCase().replace(/\s+/g, '_')}=${newKey.api_key}

3. Restart your development server

Key Details:
- Name: ${newKey.key_name}
- Priority: ${newKey.priority}
- Rate Limit: ${newKey.rate_limit_per_minute}/min, ${newKey.rate_limit_per_hour}/hour
- Cost: $${newKey.cost_per_token}/token`);
  };

  const getEnvVarName = (providerType: string) => {
    switch (providerType) {
      case 'openai': return 'OPENAI_API_KEY';
      case 'anthropic': return 'ANTHROPIC_API_KEY';
      case 'grok': return 'GROK_API_KEY';
      default: return 'API_KEY';
    }
  };

  const getLoadBalancingStrategy = (provider: Provider) => {
    const activeKeys = provider.api_keys.filter(key => key.is_active);
    
    if (activeKeys.length === 0) return 'No active keys';
    if (activeKeys.length === 1) return 'Single key';
    
    const priorities = activeKeys.map(key => key.priority);
    const uniquePriorities = [...new Set(priorities)];
    
    if (uniquePriorities.length === 1) {
      return 'Round Robin';
    } else {
      return 'Priority-based';
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Select Provider</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providers.map(provider => (
            <Card 
              key={provider.id}
              className={`cursor-pointer transition-all ${
                selectedProvider === provider.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedProvider(provider.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{provider.provider_name}</h4>
                    <p className="text-sm text-gray-600">
                      {provider.api_keys.length} key(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {getLoadBalancingStrategy(provider)}
                    </div>
                    <div className="text-xs text-green-600">
                      {provider.api_keys.filter(k => k.is_active).length} active
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* API Keys Management */}
      {selectedProvider && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">
              API Keys for {providers.find(p => p.id === selectedProvider)?.provider_name}
            </h3>
            <Button 
              onClick={() => setNewKey({...newKey, key_name: '', api_key: '', priority: 1})}
              className="bg-green-600 hover:bg-green-700"
            >
              + Add New Key
            </Button>
          </div>

          {/* Existing Keys */}
          <div className="space-y-4 mb-6">
            {providers.find(p => p.id === selectedProvider)?.api_keys.map(key => (
              <Card key={key.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <h4 className="font-medium">{key.key_name}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${
                          key.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {key.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          Priority: {key.priority}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>Usage: {key.usage_count}</div>
                          <div>Rate: {key.rate_limit_per_minute}/min</div>
                          <div>Cost: ${key.cost_per_token}/token</div>
                          <div>
                            Last used: {key.last_used_at 
                              ? new Date(key.last_used_at).toLocaleDateString()
                              : 'Never'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm"
                        variant={key.is_active ? "outline" : "primary"}
                        onClick={() => {/* Toggle active */}}
                      >
                        {key.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingKey(key.id)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => {/* Test key */}}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add New Key Form */}
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-4">
              <h4 className="font-medium mb-4">Add New API Key</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Key Name</label>
                  <Input
                    placeholder="e.g., Primary, Backup, Load Balancer 1"
                    value={newKey.key_name}
                    onChange={(e) => setNewKey({...newKey, key_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <Select
                    value={newKey.priority}
                    onChange={(e) => setNewKey({...newKey, priority: parseInt(e.target.value)})}
                  >
                    <option value={1}>1 (Highest)</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5 (Lowest)</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">API Key</label>
                  <Input
                    type="password"
                    placeholder="Enter API key..."
                    value={newKey.api_key}
                    onChange={(e) => setNewKey({...newKey, api_key: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rate Limit (per minute)</label>
                  <Input
                    type="number"
                    value={newKey.rate_limit_per_minute}
                    onChange={(e) => setNewKey({...newKey, rate_limit_per_minute: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setNewKey({...newKey, key_name: '', api_key: '', priority: 1})}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => addAPIKey(selectedProvider)}
                  disabled={!newKey.key_name || !newKey.api_key}
                >
                  Add Key
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Load Balancing Configuration */}
      {selectedProvider && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Load Balancing Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Strategy</label>
              <Select>
                <option value="priority">Priority-based (use highest priority first)</option>
                <option value="round_robin">Round Robin (distribute evenly)</option>
                <option value="least_used">Least Used (use key with lowest usage)</option>
                <option value="cost_optimized">Cost Optimized (use cheapest key)</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Failover</label>
              <Select>
                <option value="enabled">Enabled (auto-switch on failure)</option>
                <option value="disabled">Disabled (stop on failure)</option>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





