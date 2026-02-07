'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface DDSAStage {
  id: string;
  stage_id: string;
  stage_name: string;
  stage_type: string;
  position: number;
  is_active: boolean;
  config: {
    model?: string;
    provider_id?: string;
    api_endpoint?: string;
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
  };
  description?: string;
  icon?: string;
  color?: string;
}

interface Provider {
  id: string;
  provider_name: string;
  provider_type: 'openai' | 'anthropic' | 'grok' | 'custom';
  api_endpoint?: string;
  model_config?: {
    default_model?: string;
    available_models?: string[];
    [key: string]: any;
  };
  is_active: boolean;
}

// Recommended models per stage (from user's table)
const RECOMMENDED_MODELS: Record<string, string> = {
  'greeting': 'gpt-3.5-turbo',
  'cfq': 'gpt-4o-mini',
  'intent': 'gpt-3.5-turbo',
  'bundled_intake': 'gpt-3.5-turbo',
  'stakeholders': 'gpt-4o-mini',
  'history': 'gpt-4o-mini',
  'assumptions': 'gpt-4-turbo',
  'hypotheses': 'gpt-5-mini',
  'checklist_status': 'gpt-4o-mini',
  'core_problem': 'gpt-4o',
  'options': 'gpt-4o',
  'enriched_plan': 'gpt-5-mini',
  'astro_advice': 'gpt-3.5-turbo',
  'health_tip': 'gpt-3.5-turbo',
  'feedback': 'gpt-3.5-turbo',
  'cqil': 'gpt-4o-mini',
  'ecs': 'gpt-4o-mini',
  'rarf': 'gpt-4o-mini',
  'drof': 'gpt-4o-mini',
  'bill': 'gpt-3.5-turbo',
  'cpml': 'gpt-3.5-turbo',
  'csel': 'gpt-3.5-turbo'
};

// Available models per provider type
const AVAILABLE_MODELS: Record<string, string[]> = {
  'openai': [
    'gpt-3.5-turbo',
    'gpt-4',
    'gpt-4-turbo',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-5-mini',
    'o1-preview',
    'o1-mini'
  ],
  'anthropic': [
    'claude-3-haiku',
    'claude-3-sonnet',
    'claude-3-opus',
    'claude-3.5-sonnet'
  ],
  'grok': [
    'grok-beta',
    'llama3-8b-8192',
    'llama3-70b-8192'
  ],
  'custom': []
};

export default function ModelConfiguration() {
  const router = useRouter();
  const [stages, setStages] = useState<DDSAStage[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      // Check for localStorage admin session first (super admin)
      const adminSession = typeof window !== 'undefined' ? localStorage.getItem('admin_session') : null;
      if (adminSession && adminSession.trim()) {
        try {
          const adminUser = JSON.parse(adminSession);
          setUser(adminUser);
          setIsAdmin(true);
          await Promise.all([loadStages(), loadProviders()]);
          setAuthLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse admin_session from localStorage:', e);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_session');
          }
        }
      }

      // Check for super admin token
      const superAdminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : null;
      const superAdminExpires = typeof window !== 'undefined' ? localStorage.getItem('admin_session_expires') : null;
      
      if (superAdminToken && superAdminExpires) {
        const expiresAt = new Date(superAdminExpires);
        if (expiresAt > new Date()) {
          try {
            const verifyRes = await fetch('/api/admin-auth/auth/verify', {
              headers: { 'Authorization': `Bearer ${superAdminToken}` }
            });
            if (verifyRes.ok) {
              const adminData = await verifyRes.json();
              setUser(adminData.user || {});
              setIsAdmin(true);
              await Promise.all([loadStages(), loadProviders()]);
              setAuthLoading(false);
              return;
            }
          } catch (error) {
            console.warn('Super admin session verification failed:', error);
          }
        }
      }

      // Fallback to Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/admin/login');
        return;
      }

      setUser(session.user);

      // Check admin access via API (handles both admin and super_admin)
      const response = await fetch('/api/admin/check-access');
      if (response.ok) {
        const { isAdmin: adminStatus } = await response.json();
        if (adminStatus) {
          setIsAdmin(true);
          await Promise.all([loadStages(), loadProviders()]);
        } else {
          router.push('/admin/login');
        }
      } else {
        // Fallback to direct DB check
        const { data: userData } = await supabase
          .from('users')
          .select('user_type, role, is_active')
          .eq('id', session.user.id)
          .single();

        if ((userData?.user_type === 'admin' || userData?.role === 'super_admin') && userData?.is_active) {
          setIsAdmin(true);
          await Promise.all([loadStages(), loadProviders()]);
        } else {
          router.push('/admin/login');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/admin/login');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadStages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ddsa_stage_config')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;

      const stagesWithConfig = (data || []).map((stage: any) => ({
        ...stage,
        config: (stage.config as Record<string, any>) || {}
      }));

      setStages(stagesWithConfig);
    } catch (error) {
      console.error('Error loading stages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_llm_providers')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  };

  const updateStageConfig = async (stageId: string, updates: Partial<DDSAStage['config']>) => {
    try {
      setSaving(prev => ({ ...prev, [stageId]: true }));

      const stage = stages.find(s => s.stage_id === stageId || s.id === stageId);
      if (!stage) throw new Error('Stage not found');

      const updatedConfig = {
        ...stage.config,
        ...updates
      };

      const { error } = await supabase
        .from('ddsa_stage_config')
        .update({
          config: updatedConfig,
          updated_at: new Date().toISOString()
        })
        .eq('stage_id', stageId);

      if (error) throw error;

      // Reload stages
      await loadStages();
      setEditingStage(null);
    } catch (error) {
      console.error('Error updating stage config:', error);
      alert('Failed to update configuration: ' + (error as Error).message);
    } finally {
      setSaving(prev => ({ ...prev, [stageId]: false }));
    }
  };

  const getAvailableModels = (providerType?: string, providerId?: string): string[] => {
    if (providerId) {
      const provider = providers.find(p => p.id === providerId);
      if (provider?.model_config?.available_models) {
        return provider.model_config.available_models;
      }
    }
    
    if (providerType) {
      return AVAILABLE_MODELS[providerType] || [];
    }
    
    return [];
  };

  const getRecommendedModel = (stageId: string): string => {
    return RECOMMENDED_MODELS[stageId.toLowerCase()] || 'gpt-4-turbo';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">DDSA Stage Model Configuration</h1>
              <p className="text-gray-600 mt-2">
                Configure AI models, API providers, and parameters for each DDSA stage
              </p>
            </div>
            <Link
              href="/admin/ddsa"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              ← Back to DDSA
            </Link>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Configure API provider, model, endpoint, and parameters for each stage. 
            Changes take effect immediately for new conversations.
          </p>
        </div>

        {/* Stages Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temperature
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stages.map((stage) => {
                  const isEditing = editingStage === stage.stage_id;
                  const provider = providers.find(p => p.id === stage.config.provider_id);
                  const availableModels = getAvailableModels(provider?.provider_type, stage.config.provider_id);
                  const recommendedModel = getRecommendedModel(stage.stage_id);

                  return (
                    <tr key={stage.stage_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{stage.icon || '📋'}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{stage.stage_name}</div>
                            <div className="text-xs text-gray-500">{stage.stage_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            value={stage.config.provider_id || ''}
                            onChange={(e) => {
                              const newProviderId = e.target.value;
                              const newProvider = providers.find(p => p.id === newProviderId);
                              updateStageConfig(stage.stage_id, {
                                provider_id: newProviderId,
                                model: newProvider?.model_config?.default_model || recommendedModel,
                                api_endpoint: newProvider?.api_endpoint || ''
                              });
                            }}
                          >
                            <option value="">Select Provider</option>
                            {providers.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.provider_name} ({p.provider_type})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-gray-900">
                            {provider ? `${provider.provider_name} (${provider.provider_type})` : 'Not set'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-1"
                              value={stage.config.model || ''}
                              onChange={(e) => updateStageConfig(stage.stage_id, { model: e.target.value })}
                            >
                              <option value="">Select Model</option>
                              {availableModels.length > 0 ? (
                                availableModels.map((model) => (
                                  <option key={model} value={model}>
                                    {model} {model === recommendedModel ? '(Recommended)' : ''}
                                  </option>
                                ))
                              ) : (
                                <option value={recommendedModel}>{recommendedModel} (Recommended)</option>
                              )}
                            </select>
                            <div className="text-xs text-gray-500 mt-1">
                              Recommended: {recommendedModel}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900">
                            {stage.config.model || 'Not set'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            value={stage.config.api_endpoint || ''}
                            placeholder={provider?.api_endpoint || 'API endpoint URL'}
                            onChange={(e) => updateStageConfig(stage.stage_id, { api_endpoint: e.target.value })}
                          />
                        ) : (
                          <span className="text-sm text-gray-900">
                            {stage.config.api_endpoint || provider?.api_endpoint || 'Default'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                            value={stage.config.temperature ?? 0.7}
                            onChange={(e) => updateStageConfig(stage.stage_id, { 
                              temperature: parseFloat(e.target.value) || 0.7 
                            })}
                          />
                        ) : (
                          <span className="text-sm text-gray-900">
                            {stage.config.temperature ?? 0.7}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            max="32000"
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                            value={stage.config.max_tokens || 2000}
                            onChange={(e) => updateStageConfig(stage.stage_id, { 
                              max_tokens: parseInt(e.target.value) || 2000 
                            })}
                          />
                        ) : (
                          <span className="text-sm text-gray-900">
                            {stage.config.max_tokens || 2000}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isEditing ? (
                          <button
                            onClick={() => setEditingStage(null)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            disabled={saving[stage.stage_id]}
                          >
                            {saving[stage.stage_id] ? 'Saving...' : 'Done'}
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingStage(stage.stage_id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/admin/ddsa/token-analytics"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            View Token Analytics →
          </Link>
          <Link
            href="/admin/api-configuration"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Manage API Providers →
          </Link>
        </div>
      </div>
    </div>
  );
}

