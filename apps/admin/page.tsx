// Admin interface for ChatModule configuration

'use client';

import React, { useState, useEffect } from 'react';
import { Card, SegmentedControl, Switch, Chip, ToastBanner } from '../../packages/ui/components';
import { 
  ProviderConfig, 
  RoutingRule, 
  ReportTemplate, 
  PolicyConfig, 
  FeatureFlags,
  ProviderType,
  ModelType,
  Lang,
  DomainOfLife,
  UserType,
  AgeBand
} from '../../packages/contracts/types';

export interface AdminPageProps {
  initialTab?: 'providers' | 'routing' | 'templates' | 'policies' | 'flags' | 'monitoring' | 'orchestrator';
}

export const AdminPage: React.FC<AdminPageProps> = ({ initialTab = 'providers' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [policies, setPolicies] = useState<PolicyConfig[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags[]>([]);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [orchestratorConfig, setOrchestratorConfig] = useState({
    discoverCoverageThreshold: 0.8,
    maxQuestionsPerTurn: 4,
    evidenceMode: {
      'career': true,
      'relationships': false,
      'health': true,
      'finance': true,
      'education': true,
      'personal-growth': false,
      'family': false,
      'hobbies': false
    }
  });
  const [toast, setToast] = useState<{ type: 'success' | 'warning' | 'error' | 'info'; message: string } | null>(null);

  // Initialize with mock data
  useEffect(() => {
    setProviders([
      {
        id: 'openai-1',
        type: 'openai',
        name: 'OpenAI GPT-4',
        models: ['gpt-4', 'gpt-3.5-turbo'],
        defaultModel: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4000,
        timeout: 30000,
        active: true,
        fallbackOrder: 1
      },
      {
        id: 'anthropic-1',
        type: 'anthropic',
        name: 'Anthropic Claude',
        models: ['claude-3', 'claude-3.5'],
        defaultModel: 'claude-3.5',
        temperature: 0.7,
        maxTokens: 4000,
        timeout: 30000,
        active: true,
        fallbackOrder: 2
      },
      {
        id: 'grok-1',
        type: 'grok',
        name: 'Grok',
        models: ['grok-1'],
        defaultModel: 'grok-1',
        temperature: 0.8,
        maxTokens: 4000,
        timeout: 30000,
        active: false,
        fallbackOrder: 3
      }
    ]);

    setRoutingRules([
      {
        id: 'rule-1',
        condition: {
          domainOfLife: ['career', 'personal-growth'],
          language: ['en'],
          userType: ['professional'],
          ageBand: ['adult']
        },
        providerId: 'openai-1',
        model: 'gpt-4',
        priority: 100,
        active: true
      },
      {
        id: 'rule-2',
        condition: {
          language: ['hi', 'bn'],
          userType: ['student', 'parent']
        },
        providerId: 'anthropic-1',
        model: 'claude-3.5',
        priority: 90,
        active: true
      }
    ]);

    setReportTemplates([
      {
        id: 'template-1',
        name: 'Career Development Report',
        facets: {
          domainOfLife: ['career'],
          ageBand: ['adult'],
          gender: ['male', 'female', 'non-binary'],
          location: ['*'],
          language: ['en']
        },
        content: '<h1>Career Development Report</h1><p>Based on your responses...</p>',
        active: true
      }
    ]);

    setPolicies([
      {
        id: 'policy-1',
        name: 'Default Safety Policy',
        rules: {
          enableEvidenceMode: true,
          contentSafety: true,
          profanityFilter: true,
          piiFilter: true,
          ageAppropriateContent: true
        },
        active: true
      }
    ]);

    setFeatureFlags([
      {
        id: 'student',
        userType: 'student',
        offerReport: true,
        showAds: false,
        motivationalNudges: true,
        emojiDecoration: true
      },
      {
        id: 'professional',
        userType: 'professional',
        offerReport: true,
        showAds: true,
        motivationalNudges: false,
        emojiDecoration: false
      }
    ]);
  }, []);

  // Tab configuration
  const tabs = [
    { value: 'providers', label: 'Providers' },
    { value: 'routing', label: 'Routing' },
    { value: 'templates', label: 'Templates' },
    { value: 'policies', label: 'Policies' },
    { value: 'flags', label: 'Feature Flags' },
    { value: 'orchestrator', label: 'Orchestrator' },
    { value: 'monitoring', label: 'Monitoring' }
  ];

  // Provider management
  const handleProviderToggle = (providerId: string) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, active: !p.active } : p
    ));
    setToast({ type: 'success', message: 'Provider status updated' });
  };

  const handleProviderUpdate = (providerId: string, updates: Partial<ProviderConfig>) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, ...updates } : p
    ));
    setToast({ type: 'success', message: 'Provider updated' });
  };

  const handleApiKeyChange = (providerId: string, apiKey: string) => {
    setApiKeys(prev => ({ ...prev, [providerId]: apiKey }));
  };

  const handleSaveApiKey = async (providerId: string) => {
    const apiKey = apiKeys[providerId];
    if (!apiKey) {
      setToast({ type: 'error', message: 'Please enter an API key' });
      return;
    }

    try {
      // Here you would save to database
      // For now, just show success message
      setToast({ type: 'success', message: 'API key saved successfully' });
      setEditingProvider(null);
      
      // Clear the API key from state for security
      setApiKeys(prev => ({ ...prev, [providerId]: '' }));
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to save API key' });
    }
  };

  const handleTestProvider = async (providerId: string) => {
    try {
      setToast({ type: 'info', message: 'Testing provider connection...' });
      
      // Here you would test the provider
      // For now, just show success message
      setTimeout(() => {
        setToast({ type: 'success', message: 'Provider test successful' });
      }, 2000);
    } catch (error) {
      setToast({ type: 'error', message: 'Provider test failed' });
    }
  };

  // Routing rule management
  const handleRoutingRuleToggle = (ruleId: string) => {
    setRoutingRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, active: !r.active } : r
    ));
    setToast({ type: 'success', message: 'Routing rule updated' });
  };

  // Policy management
  const handlePolicyUpdate = (policyId: string, updates: Partial<PolicyConfig>) => {
    setPolicies(prev => prev.map(p => 
      p.id === policyId ? { ...p, ...updates } : p
    ));
    setToast({ type: 'success', message: 'Policy updated' });
  };

  // Feature flag management
  const handleFeatureFlagUpdate = (userType: UserType, updates: Partial<FeatureFlags>) => {
    setFeatureFlags(prev => prev.map(f => 
      f.userType === userType ? { ...f, ...updates } : f
    ));
    setToast({ type: 'success', message: 'Feature flags updated' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">ChatModule Configuration</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Chip variant="success" size="sm">
                System Online
              </Chip>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab navigation */}
        <div className="mb-6">
          <SegmentedControl
            options={tabs}
            value={activeTab}
            onChange={(value) => setActiveTab(value as any)}
          />
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          {/* Providers tab */}
          {activeTab === 'providers' && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">LLM Providers</h2>
                <div className="space-y-6">
                  {providers.map((provider) => (
                    <div key={provider.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-gray-900">{provider.name}</h3>
                          <p className="text-sm text-gray-600">
                            {provider.type} • {provider.models.join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleTestProvider(provider.id)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Test Connection
                          </button>
                          <Switch
                            checked={provider.active}
                            onChange={() => handleProviderToggle(provider.id)}
                          />
                        </div>
                      </div>
                      
                      {/* API Key Configuration */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">API Key</label>
                          <div className="flex space-x-2">
                            {editingProvider === provider.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveApiKey(provider.id)}
                                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingProvider(null)}
                                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setEditingProvider(provider.id)}
                                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                              >
                                Configure
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {editingProvider === provider.id ? (
                          <div className="space-y-2">
                            <input
                              type="password"
                              placeholder={`Enter ${provider.name} API key...`}
                              value={apiKeys[provider.id] || ''}
                              onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                            />
                            <div className="text-xs text-gray-500">
                              {provider.type === 'openai' && 'Get your API key from: https://platform.openai.com/api-keys'}
                              {provider.type === 'anthropic' && 'Get your API key from: https://console.anthropic.com/'}
                              {provider.type === 'grok' && 'Get your API key from: https://console.groq.com/keys'}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-500">
                              {apiKeys[provider.id] ? '••••••••••••••••' : 'No API key configured'}
                            </div>
                            <Chip 
                              variant={apiKeys[provider.id] ? 'success' : 'warning'} 
                              size="sm"
                            >
                              {apiKeys[provider.id] ? 'Configured' : 'Not Configured'}
                            </Chip>
                          </div>
                        )}
                      </div>
                      
                      {/* Provider Settings */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="block text-gray-700 mb-1">Temperature</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            value={provider.temperature}
                            onChange={(e) => handleProviderUpdate(provider.id, { 
                              temperature: parseFloat(e.target.value) 
                            })}
                            className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-1">Max Tokens</label>
                          <input
                            type="number"
                            min="100"
                            max="8000"
                            value={provider.maxTokens}
                            onChange={(e) => handleProviderUpdate(provider.id, { 
                              maxTokens: parseInt(e.target.value) 
                            })}
                            className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-1">Timeout (ms)</label>
                          <input
                            type="number"
                            min="5000"
                            max="60000"
                            value={provider.timeout}
                            onChange={(e) => handleProviderUpdate(provider.id, { 
                              timeout: parseInt(e.target.value) 
                            })}
                            className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-1">Fallback Order</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={provider.fallbackOrder}
                            onChange={(e) => handleProviderUpdate(provider.id, { 
                              fallbackOrder: parseInt(e.target.value) 
                            })}
                            className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Routing tab */}
          {activeTab === 'routing' && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Routing Rules</h2>
                <div className="space-y-4">
                  {routingRules.map((rule) => (
                    <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Rule {rule.id} (Priority: {rule.priority})
                          </h3>
                          <p className="text-sm text-gray-600">
                            {rule.providerId} • {rule.model}
                          </p>
                        </div>
                        <Switch
                          checked={rule.active}
                          onChange={() => handleRoutingRuleToggle(rule.id)}
                        />
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p><strong>Conditions:</strong></p>
                        <ul className="list-disc list-inside ml-4">
                          {rule.condition.domainOfLife && (
                            <li>Domain: {rule.condition.domainOfLife.join(', ')}</li>
                          )}
                          {rule.condition.language && (
                            <li>Language: {rule.condition.language.join(', ')}</li>
                          )}
                          {rule.condition.userType && (
                            <li>User Type: {rule.condition.userType.join(', ')}</li>
                          )}
                          {rule.condition.ageBand && (
                            <li>Age Band: {rule.condition.ageBand.join(', ')}</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Templates tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Templates</h2>
                <div className="space-y-4">
                  {reportTemplates.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <Switch checked={template.active} onChange={() => {}} />
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p><strong>Facets:</strong></p>
                        <ul className="list-disc list-inside ml-4">
                          <li>Domain: {template.facets.domainOfLife.join(', ')}</li>
                          <li>Age Band: {template.facets.ageBand.join(', ')}</li>
                          <li>Gender: {template.facets.gender.join(', ')}</li>
                          <li>Language: {template.facets.language.join(', ')}</li>
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Policies tab */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Safety Policies</h2>
                <div className="space-y-4">
                  {policies.map((policy) => (
                    <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900">{policy.name}</h3>
                        <Switch checked={policy.active} onChange={() => {}} />
                      </div>
                      
                      <div className="space-y-3">
                        <Switch
                          label="Enable Evidence Mode"
                          checked={policy.rules.enableEvidenceMode}
                          onChange={(checked) => handlePolicyUpdate(policy.id, {
                            rules: { ...policy.rules, enableEvidenceMode: checked }
                          })}
                        />
                        <Switch
                          label="Content Safety"
                          checked={policy.rules.contentSafety}
                          onChange={(checked) => handlePolicyUpdate(policy.id, {
                            rules: { ...policy.rules, contentSafety: checked }
                          })}
                        />
                        <Switch
                          label="Profanity Filter"
                          checked={policy.rules.profanityFilter}
                          onChange={(checked) => handlePolicyUpdate(policy.id, {
                            rules: { ...policy.rules, profanityFilter: checked }
                          })}
                        />
                        <Switch
                          label="PII Filter"
                          checked={policy.rules.piiFilter}
                          onChange={(checked) => handlePolicyUpdate(policy.id, {
                            rules: { ...policy.rules, piiFilter: checked }
                          })}
                        />
                        <Switch
                          label="Age Appropriate Content"
                          checked={policy.rules.ageAppropriateContent}
                          onChange={(checked) => handlePolicyUpdate(policy.id, {
                            rules: { ...policy.rules, ageAppropriateContent: checked }
                          })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Feature flags tab */}
          {activeTab === 'flags' && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Flags</h2>
                <div className="space-y-4">
                  {featureFlags.map((flags) => (
                    <div key={flags.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-4 capitalize">
                        {flags.userType} Users
                      </h3>
                      
                      <div className="space-y-3">
                        <Switch
                          label="Offer Report"
                          checked={flags.offerReport}
                          onChange={(checked) => handleFeatureFlagUpdate(flags.userType, {
                            offerReport: checked
                          })}
                        />
                        <Switch
                          label="Show Ads"
                          checked={flags.showAds}
                          onChange={(checked) => handleFeatureFlagUpdate(flags.userType, {
                            showAds: checked
                          })}
                        />
                        <Switch
                          label="Motivational Nudges"
                          checked={flags.motivationalNudges}
                          onChange={(checked) => handleFeatureFlagUpdate(flags.userType, {
                            motivationalNudges: checked
                          })}
                        />
                        <Switch
                          label="Emoji Decoration"
                          checked={flags.emojiDecoration}
                          onChange={(checked) => handleFeatureFlagUpdate(flags.userType, {
                            emojiDecoration: checked
                          })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Orchestrator tab */}
          {activeTab === 'orchestrator' && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Stage Machine Configuration</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discover Coverage Threshold
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={orchestratorConfig.discoverCoverageThreshold}
                        onChange={(e) => setOrchestratorConfig(prev => ({
                          ...prev,
                          discoverCoverageThreshold: parseFloat(e.target.value)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum coverage (0.0-1.0) to advance from DISCOVER stage
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Questions Per Turn
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={orchestratorConfig.maxQuestionsPerTurn}
                        onChange={(e) => setOrchestratorConfig(prev => ({
                          ...prev,
                          maxQuestionsPerTurn: parseInt(e.target.value)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum questions allowed per assistant turn
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Evidence Mode by Domain</h2>
                <div className="space-y-3">
                  {Object.entries(orchestratorConfig.evidenceMode).map(([domain, enabled]) => (
                    <div key={domain} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {domain.replace('-', ' ')}
                      </span>
                      <Switch
                        checked={enabled}
                        onChange={(checked) => setOrchestratorConfig(prev => ({
                          ...prev,
                          evidenceMode: {
                            ...prev.evidenceMode,
                            [domain]: checked
                          }
                        }))}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Evidence mode adds cautionary notes for factual claims in sensitive domains
                </p>
              </Card>

              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Stage Transitions</h2>
                <div className="space-y-3">
                  <div className="border border-gray-200 rounded-lg p-3">
                    <h3 className="font-medium text-gray-900">DISCOVER → MIRROR</h3>
                    <p className="text-sm text-gray-600">
                      When 80% of required slots are known and no conflicts detected
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <h3 className="font-medium text-gray-900">MIRROR → OPTIONS</h3>
                    <p className="text-sm text-gray-600">
                      When user confirms understanding (Yes response)
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <h3 className="font-medium text-gray-900">OPTIONS → PLAN</h3>
                    <p className="text-sm text-gray-600">
                      When at least one option is chosen
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <h3 className="font-medium text-gray-900">PLAN → HANDOFF</h3>
                    <p className="text-sm text-gray-600">
                      When all required slots are complete and validators pass
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Monitoring tab */}
          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Monitoring</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">98.5%</div>
                    <div className="text-sm text-green-700">Uptime</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">1,247</div>
                    <div className="text-sm text-blue-700">Active Sessions</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">2.3s</div>
                    <div className="text-sm text-purple-700">Avg Response Time</div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Toast notifications */}
      {toast && (
        <ToastBanner
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminPage;
