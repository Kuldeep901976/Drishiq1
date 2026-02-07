'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, Button, Grid, Spinner, Input } from '@/components/ui';
import Link from 'next/link';

interface Provider {
  id: string;
  provider_name: string;
  provider_type: 'openai' | 'anthropic' | 'grok';
  api_key_encrypted?: string;
  is_active: boolean;
  priority: number;
  model_config?: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
    base_url?: string;
  };
}

interface RoutingRule {
  id: string;
  provider_id: string;
  condition: string;
  priority: number;
  is_active: boolean;
  description?: string;
}

export default function APIConfiguration() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRule, setNewRule] = useState({
    provider_id: '',
    condition: '',
    priority: 1,
    description: '',
    is_active: true
  });
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/admin/login');
        return;
      }

      setUser(session.user);

      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('user_type, is_active')
        .eq('id', session.user.id)
        .single();

      if (userData?.user_type === 'admin' && userData?.is_active) {
        setIsAdmin(true);
        loadAPIConfiguration();
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/admin/login');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadAPIConfiguration = async () => {
    try {
      setLoading(true);
      
      // Load providers
      const { data: providersData, error: providersError } = await supabase
        .from('chat_llm_providers')
        .select('*')
        .order('provider_name');

      if (providersError) {
        console.error('Error loading providers:', providersError);
        // Fallback: Create default providers if database access fails
        const fallbackProviders: Provider[] = [
          {
            id: 'openai-provider',
            provider_name: 'OpenAI GPT-4',
            provider_type: 'openai',
            is_active: true,
            priority: 1,
            model_config: {
              model: 'gpt-4',
              max_tokens: 4000,
              temperature: 0.7,
              base_url: 'https://api.openai.com/v1'
            }
          },
          {
            id: 'anthropic-provider',
            provider_name: 'Anthropic Claude',
            provider_type: 'anthropic',
            is_active: true,
            priority: 2,
            model_config: {
              model: 'claude-3-sonnet-20240229',
              max_tokens: 4000,
              temperature: 0.7,
              base_url: 'https://api.anthropic.com'
            }
          },
          {
            id: 'grok-provider',
            provider_name: 'Grok AI',
            provider_type: 'grok',
            is_active: true,
            priority: 3,
            model_config: {
              model: 'llama3-8b-8192',
              max_tokens: 8192,
              temperature: 0.7,
              base_url: 'https://api.groq.com/openai/v1'
            }
          }
        ];
        setProviders(fallbackProviders);
        
        // Initialize API keys (empty for fallback)
        const keys: Record<string, string> = {};
        fallbackProviders.forEach(provider => {
          keys[provider.id] = '';
        });
        setApiKeys(keys);
      } else if (providersData) {
        setProviders(providersData);
        
        // Initialize API keys (masked for security)
        const keys: Record<string, string> = {};
        providersData.forEach(provider => {
          keys[provider.id] = provider.api_key_encrypted ? '••••••••••••••••' : '';
        });
        setApiKeys(keys);
      }

      // Load routing rules with provider names
      const { data: rulesData, error: rulesError } = await supabase
        .from('chat_routing_rules')
        .select(`
          *,
          chat_llm_providers(provider_name)
        `)
        .order('priority');

      if (rulesError) {
        console.error('Error loading routing rules:', rulesError);
        // Fallback: Empty routing rules
        setRoutingRules([]);
      } else if (rulesData) {
        setRoutingRules(rulesData);
      }

    } catch (error) {
      console.error('Error loading API configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeyChange = (providerId: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [providerId]: value
    }));
  };

  const handleSaveApiKey = async (providerId: string) => {
    try {
      const apiKey = apiKeys[providerId];
      if (!apiKey || apiKey === '••••••••••••••••') {
        return; // Don't save if it's masked or empty
      }

      // Show instructions for adding to .env.local instead of saving to database
      const provider = providers.find(p => p.id === providerId);
      const envVarName = getEnvVarName(provider?.provider_type || '');
      
      alert(`🔐 API Key Configuration Required

To securely store your ${provider?.provider_name} API key:

1. Open your .env.local file
2. Add this line:
   ${envVarName}=${apiKey}

3. Restart your development server
4. The API key will be automatically loaded

This keeps your API keys secure and out of the database.`);

      // Mark as configured in database (without storing the actual key)
      const { error } = await supabase
        .from('chat_llm_providers')
        .update({ 
          api_key_configured: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);

      if (error) {
        console.error('Error updating provider status:', error);
        return;
      }

      // Mask the key after showing instructions
      setApiKeys(prev => ({
        ...prev,
        [providerId]: '••••••••••••••••'
      }));
      
      setEditingProvider(null);
      
      // Reload configuration
      await loadAPIConfiguration();

    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const getEnvVarName = (providerType: string) => {
    switch (providerType) {
      case 'openai': return 'OPENAI_API_KEY';
      case 'anthropic': return 'ANTHROPIC_API_KEY';
      case 'grok': return 'GROK_API_KEY';
      default: return 'API_KEY';
    }
  };

  const handleTestProvider = async (providerId: string) => {
    try {
      setTestingProvider(providerId);
      
      // Test API connection using environment variables
      const provider = providers.find(p => p.id === providerId);
      if (!provider) return;

      // Get API key from environment variables
      const envVarName = getEnvVarName(provider.provider_type);
      
      // Test API connection
      const testResponse = await fetch('/api/test-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          apiKey: apiKeys[providerId],
          envVarName
        })
      });

      const testResult = await testResponse.json();

      if (testResponse.ok && testResult.success) {
        alert(`✅ ${provider.provider_name} connection successful!`);
      } else {
        const errorMessage = testResult.error || 'Connection failed. Check your API key.';
        alert(`❌ ${provider.provider_name} connection failed: ${errorMessage}`);
      }

    } catch (error) {
      console.error('Error testing provider:', error);
      alert(`❌ Error testing ${providers.find(p => p.id === providerId)?.provider_name}`);
    } finally {
      setTestingProvider(null);
    }
  };

  const toggleProvider = async (providerId: string) => {
    try {
      const provider = providers.find(p => p.id === providerId);
      if (!provider) return;

      const { error } = await supabase
        .from('chat_llm_providers')
        .update({ 
          is_active: !provider.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);

      if (error) {
        console.error('Error toggling provider:', error);
        return;
      }

      // Reload configuration
      await loadAPIConfiguration();

    } catch (error) {
      console.error('Error toggling provider:', error);
    }
  };

  const handleCreateRule = async () => {
    try {
      if (!newRule.provider_id || !newRule.condition) {
        alert('Please fill in all required fields');
        return;
      }

      const { error } = await supabase
        .from('chat_routing_rules')
        .insert({
          provider_id: newRule.provider_id,
          condition: newRule.condition,
          priority: newRule.priority,
          description: newRule.description,
          is_active: newRule.is_active,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating rule:', error);
        alert('Error creating rule: ' + error.message);
        return;
      }

      // Reset form
      setNewRule({
        provider_id: '',
        condition: '',
        priority: 1,
        description: '',
        is_active: true
      });
      setShowRuleForm(false);

      // Reload rules
      await loadAPIConfiguration();

      alert('✅ Routing rule created successfully!');

    } catch (error) {
      console.error('Error creating rule:', error);
      alert('Error creating rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      if (!confirm('Are you sure you want to delete this routing rule?')) {
        return;
      }

      const { error } = await supabase
        .from('chat_routing_rules')
        .delete()
        .eq('id', ruleId);

      if (error) {
        console.error('Error deleting rule:', error);
        alert('Error deleting rule: ' + error.message);
        return;
      }

      // Reload rules
      await loadAPIConfiguration();

      alert('✅ Routing rule deleted successfully!');

    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Error deleting rule');
    }
  };

  const toggleRule = async (ruleId: string) => {
    try {
      const rule = routingRules.find(r => r.id === ruleId);
      if (!rule) return;

      const { error } = await supabase
        .from('chat_routing_rules')
        .update({ 
          is_active: !rule.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId);

      if (error) {
        console.error('Error toggling rule:', error);
        return;
      }

      // Reload rules
      await loadAPIConfiguration();

    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading API configuration...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access API configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-4 text-5xl">🔌</span>
                API Configuration
              </h1>
              <p className="text-xl text-gray-600">Configure OpenAI, Anthropic, and Grok providers with API keys and routing rules</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/admin/chat">
                <Button variant="secondary">
                  ← Back to Chat Management
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Environment Variables Status */}
        <div className="mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
                <span className="mr-2">🔐</span>
                Environment Variables Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <span className="text-sm font-medium">OPENAI_API_KEY</span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">Not configured</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <span className="text-sm font-medium">ANTHROPIC_API_KEY</span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">Not configured</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <span className="text-sm font-medium">GROK_API_KEY</span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">Not configured</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>📝 Instructions:</strong> Add your API keys to the .env.local file in your project root. 
                  After adding keys, restart your development server for changes to take effect.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Provider Configuration */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">🤖</span>
            AI Provider Configuration
          </h2>
          <Grid columns={1} className="gap-6">
            {providers.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        provider.provider_type === 'openai' ? 'bg-green-500' :
                        provider.provider_type === 'anthropic' ? 'bg-orange-500' :
                        'bg-purple-500'
                      }`}>
                        {provider.provider_type === 'openai' ? 'O' :
                         provider.provider_type === 'anthropic' ? 'A' : 'G'}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{provider.provider_name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{provider.provider_type} Provider</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        provider.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {provider.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <Button
                        variant={provider.is_active ? "outline" : "primary"}
                        onClick={() => toggleProvider(provider.id)}
                        className={provider.is_active ? "border-red-500 text-red-600 hover:bg-red-50" : ""}
                      >
                        {provider.is_active ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>

                  {/* API Key Configuration */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">API Key</label>
                      <div className="flex space-x-2">
                        {editingProvider === provider.id ? (
                          <>
                            <Button
                              onClick={() => handleSaveApiKey(provider.id)}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={() => setEditingProvider(null)}
                              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => setEditingProvider(provider.id)}
                            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          >
                            Configure
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {editingProvider === provider.id ? (
                      <div className="space-y-2">
                        <Input
                          type="password"
                          placeholder={`Enter ${provider.provider_name} API key...`}
                          value={apiKeys[provider.id] || ''}
                          onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500">
                          {provider.provider_type === 'openai' && 'Get your API key from: https://platform.openai.com/api-keys'}
                          {provider.provider_type === 'anthropic' && 'Get your API key from: https://console.anthropic.com/'}
                          {provider.provider_type === 'grok' && 'Get your API key from: https://console.groq.com/keys'}
                        </div>
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                          <strong>🔐 Security Note:</strong> API keys will be stored in your .env.local file, not in the database.
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-500">
                          {apiKeys[provider.id] ? '••••••••••••••••' : 'No API key configured'}
                        </div>
                        <Button
                          onClick={() => handleTestProvider(provider.id)}
                          disabled={testingProvider === provider.id || !apiKeys[provider.id]}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {testingProvider === provider.id ? 'Testing...' : 'Test'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Provider Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <div className="px-3 py-2 bg-gray-100 rounded text-sm">{provider.model_config?.model || 'Default'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                      <div className="px-3 py-2 bg-gray-100 rounded text-sm">{provider.model_config?.max_tokens || 'Default'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                      <div className="px-3 py-2 bg-gray-100 rounded text-sm">{provider.model_config?.temperature || 'Default'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </div>

        {/* Routing Rules */}
        <div className="mb-8">
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                  <span className="mr-3">🔄</span>
                  Provider Routing Rules
                </h2>
                <Button
                  onClick={() => setShowRuleForm(!showRuleForm)}
                  className="px-4 py-2"
                >
                  {showRuleForm ? 'Cancel' : '+ Add Rule'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {/* Rule Creation Form */}
              {showRuleForm && (
                <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Routing Rule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                      <select
                        value={newRule.provider_id}
                        onChange={(e) => setNewRule(prev => ({ ...prev, provider_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Provider</option>
                        {providers.map(provider => (
                          <option key={provider.id} value={provider.id}>
                            {provider.provider_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newRule.priority}
                        onChange={(e) => setNewRule(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Condition (SQL-like)</label>
                      <input
                        type="text"
                        placeholder="e.g., domain_of_life = 'personal-growth'"
                        value={newRule.condition}
                        onChange={(e) => setNewRule(prev => ({ ...prev, condition: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Examples: domain_of_life = 'business', language = 'hi', user_type = 'admin'
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <input
                        type="text"
                        placeholder="Brief description of this rule"
                        value={newRule.description}
                        onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newRule.is_active}
                          onChange={(e) => setNewRule(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </label>
                      <Button
                        onClick={handleCreateRule}
                        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Create Rule
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Rules */}
              {routingRules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <p className="text-lg font-medium mb-2">No Routing Rules</p>
                  <p className="text-sm">Create your first routing rule to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {routingRules.map((rule) => (
                    <div key={rule.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h3 className="font-medium text-gray-900">Rule #{rule.priority}</h3>
                            <span className="text-sm text-gray-600">
                              → {(rule as any).chat_llm_providers?.name || 'Unknown Provider'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rule.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Condition:</strong> {rule.condition}
                          </p>
                          {rule.description && (
                            <p className="text-sm text-gray-500">{rule.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleRule(rule.id)}
                            className={rule.is_active ? "border-red-500 text-red-600 hover:bg-red-50" : ""}
                          >
                            {rule.is_active ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="border-red-500 text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rule Examples */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Common Rule Examples:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div><strong>Domain-based:</strong> domain_of_life = 'personal-growth'</div>
                  <div><strong>Language-based:</strong> language = 'hi'</div>
                  <div><strong>User type:</strong> user_type = 'admin'</div>
                  <div><strong>Age-based:</strong> age_band = 'child'</div>
                  <div><strong>Time-based:</strong> EXTRACT(HOUR FROM NOW()) BETWEEN 9 AND 17</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
