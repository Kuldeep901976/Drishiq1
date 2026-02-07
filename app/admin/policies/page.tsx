'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, Button, Grid, Spinner } from '@/components/ui';
import Link from 'next/link';

interface PolicyRule {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'age' | 'safety' | 'validation';
  is_active: boolean;
  conditions: string[];
  actions: string[];
}

export default function SafetyPoliciesManagement() {
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
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
        loadPolicies();
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

  const loadPolicies = async () => {
    try {
      setLoading(true);
      
      // Default policy configuration
      const defaultPolicies: PolicyRule[] = [
        {
          id: 'content-safety',
          name: 'Content Safety Filter',
          description: 'Filters out inappropriate, harmful, or offensive content',
          category: 'content',
          is_active: true,
          conditions: ['Contains profanity', 'Contains violence', 'Contains hate speech'],
          actions: ['Block message', 'Replace with warning', 'Flag for review']
        },
        {
          id: 'age-appropriate',
          name: 'Age-Appropriate Content',
          description: 'Ensures content is suitable for user age band',
          category: 'age',
          is_active: true,
          conditions: ['User age < 13', 'User age 13-17', 'User age 18+'],
          actions: ['Apply child filters', 'Apply teen filters', 'Allow adult content']
        },
        {
          id: 'fact-checking',
          name: 'Fact Checking & Validation',
          description: 'Validates factual claims and prevents misinformation',
          category: 'validation',
          is_active: true,
          conditions: ['Contains factual claims', 'Contains statistics', 'Contains medical advice'],
          actions: ['Require sources', 'Add disclaimer', 'Block unverified claims']
        },
        {
          id: 'privacy-protection',
          name: 'Privacy Protection',
          description: 'Protects user privacy and prevents data leaks',
          category: 'safety',
          is_active: true,
          conditions: ['Contains personal info', 'Contains contact details', 'Contains location data'],
          actions: ['Mask sensitive data', 'Block sharing', 'Require consent']
        },
        {
          id: 'hallucination-control',
          name: 'Hallucination Control',
          description: 'Prevents AI hallucinations and ensures accuracy',
          category: 'validation',
          is_active: true,
          conditions: ['Confidence score < 0.8', 'No supporting evidence', 'Contradicts known facts'],
          actions: ['Add uncertainty disclaimer', 'Request clarification', 'Block response']
        }
      ];

      setPolicies(defaultPolicies);

    } catch (error) {
      console.error('Error loading policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePolicy = async (policyId: string) => {
    try {
      setPolicies(prev => prev.map(policy => 
        policy.id === policyId 
          ? { ...policy, is_active: !policy.is_active }
          : policy
      ));
    } catch (error) {
      console.error('Error toggling policy:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'content': return 'bg-red-100 text-red-800';
      case 'age': return 'bg-blue-100 text-blue-800';
      case 'safety': return 'bg-green-100 text-green-800';
      case 'validation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content': return '🚫';
      case 'age': return '👶';
      case 'safety': return '🛡️';
      case 'validation': return '✅';
      default: return '📋';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading safety policies...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access safety policies management.</p>
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
                <span className="mr-4 text-5xl">🛡️</span>
                Safety Policies Management
              </h1>
              <p className="text-xl text-gray-600">Configure content safety, age-appropriate filtering, and validation rules</p>
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
        {/* Policy Categories Overview */}
        <div className="mb-8">
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                <span className="mr-3">📊</span>
                Policy Categories Overview
              </h2>
            </CardHeader>
            <CardContent className="p-8">
              <Grid columns={4} className="gap-6">
                {['content', 'age', 'safety', 'validation'].map((category) => {
                  const categoryPolicies = policies.filter(p => p.category === category);
                  const activePolicies = categoryPolicies.filter(p => p.is_active);
                  
                  return (
                    <div key={category} className="text-center p-4 bg-white rounded-lg border">
                      <div className="text-3xl mb-2">{getCategoryIcon(category)}</div>
                      <h3 className="font-semibold text-gray-900 capitalize mb-2">{category} Safety</h3>
                      <div className="text-2xl font-bold text-green-600">{activePolicies.length}</div>
                      <div className="text-sm text-gray-500">of {categoryPolicies.length} active</div>
                    </div>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </div>

        {/* Policy Details */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📋</span>
            Policy Configuration
          </h2>
          <Grid columns={1} className="gap-6">
            {policies.map((policy) => (
              <Card key={policy.id} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{policy.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(policy.category)}`}>
                          {policy.category.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          policy.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {policy.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{policy.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Conditions:</h4>
                          <div className="space-y-1">
                            {policy.conditions.map((condition, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                <span className="text-sm text-gray-600">{condition}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Actions:</h4>
                          <div className="space-y-1">
                            {policy.actions.map((action, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                <span className="text-sm text-gray-600">{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-6">
                      <Button
                        variant={policy.is_active ? "outline" : "primary"}
                        onClick={() => togglePolicy(policy.id)}
                        className={policy.is_active ? "border-red-500 text-red-600 hover:bg-red-50" : ""}
                      >
                        {policy.is_active ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </div>
      </div>
    </div>
  );
}






