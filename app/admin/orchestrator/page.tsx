'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, Button, Grid, Spinner } from '@/components/ui';
import Link from 'next/link';

interface StageConfig {
  stage_id: string;
  stage_name: string;
  description?: string;
  position: number;
  is_active: boolean;
  dependencies?: string[]; // Array of stage_ids this stage depends on
  stage_type?: string;
  icon?: string;
  color?: string;
}

export default function StageMachineManagement() {
  const [stages, setStages] = useState<StageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Admin layout handles authentication - just load data directly
    loadStageConfig();
  }, []);

  const loadStageConfig = async () => {
    try {
      setLoading(true);
      
      // Load all stages from database (same API as DDSA flow page)
      const res = await fetch('/api/admin/ddsa/flow');
      if (!res.ok) {
        throw new Error(`Failed to fetch stages: ${res.statusText}`);
      }
      
      const data = await res.json();
      const stagesFromDB: StageConfig[] = (data.stages || []).map((stage: any) => ({
        stage_id: stage.stage_id,
        stage_name: stage.stage_name,
        description: stage.description,
        position: stage.position,
        is_active: stage.is_active,
        dependencies: Array.isArray(stage.dependencies) ? stage.dependencies : [],
        stage_type: stage.stage_type,
        icon: stage.icon || '📋',
        color: stage.color || '#4CAF50'
      })).sort((a: StageConfig, b: StageConfig) => a.position - b.position);

      setStages(stagesFromDB);

    } catch (error) {
      console.error('Error loading stage config:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStage = async (stageId: string) => {
    try {
      const stage = stages.find(s => s.stage_id === stageId);
      if (!stage) return;

      const newActiveState = !stage.is_active;
      
      // Update in database
      const res = await fetch(`/api/admin/ddsa/stages/${stageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActiveState })
      });

      if (!res.ok) {
        throw new Error(`Failed to update stage: ${res.statusText}`);
      }

      // Update local state
      setStages(prev => prev.map(s => 
        s.stage_id === stageId 
          ? { ...s, is_active: newActiveState }
          : s
      ));
    } catch (error) {
      console.error('Error toggling stage:', error);
      alert(`Failed to toggle stage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading stage machine...</p>
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
                <span className="mr-4 text-5xl">🎭</span>
                Stage Machine Management
              </h1>
              <p className="text-xl text-gray-600">Visualize and manage all DDSA stages in the conversation flow</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/admin/ddsa/flow">
                <Button variant="secondary">
                  ← Back to 26 Stages Page
                </Button>
              </Link>
              <Link href="/admin/chat">
                <Button variant="outline">
                  Chat Management
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stage Flow Visualization */}
        <div className="mb-8">
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                <span className="mr-3">🔄</span>
                Conversation Flow
              </h2>
            </CardHeader>
            <CardContent className="p-8">
              <div className="overflow-x-auto">
                <div className="flex items-center justify-start space-x-3 min-w-max pb-4">
                  {stages.map((stage, index) => {
                    // Find stages that depend on this one (transitions)
                    const nextStages = stages.filter(s => 
                      s.dependencies && s.dependencies.includes(stage.stage_id)
                    );
                    
                    return (
                      <React.Fragment key={stage.stage_id}>
                        <div className={`flex flex-col items-center p-3 rounded-lg border-2 min-w-[120px] ${
                          stage.is_active 
                            ? 'bg-green-50 border-green-200 shadow-sm' 
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`} style={{ borderColor: stage.is_active ? (stage.color || '#4CAF50') : undefined }}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-2 text-sm ${
                            stage.is_active ? 'bg-green-500' : 'bg-gray-400'
                          }`} style={{ backgroundColor: stage.is_active ? (stage.color || '#4CAF50') : undefined }}>
                            {stage.icon || index + 1}
                          </div>
                          <h3 className="font-semibold text-xs text-center mb-1 leading-tight">{stage.stage_name}</h3>
                          <div className="text-xs text-gray-500 mb-1">#{stage.position}</div>
                          <button
                            onClick={() => toggleStage(stage.stage_id)}
                            className={`mt-1 px-2 py-1 text-xs rounded transition-colors ${
                              stage.is_active 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {stage.is_active ? 'Disable' : 'Enable'}
                          </button>
                          {nextStages.length > 0 && (
                            <div className="mt-1 text-xs text-purple-600">
                              → {nextStages.length} next
                            </div>
                          )}
                        </div>
                        {index < stages.length - 1 && (
                          <div className="text-gray-400 text-xl flex-shrink-0">→</div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600 text-center">
                Showing {stages.length} stages • {stages.filter(s => s.is_active).length} active • {stages.filter(s => !s.is_active).length} inactive
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stage Details */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📋</span>
            Stage Configuration
          </h2>
          <Grid columns={1} className="gap-6">
            {stages.map((stage) => {
              // Find stages that depend on this one (next in flow)
              const nextStages = stages.filter(s => 
                s.dependencies && s.dependencies.includes(stage.stage_id)
              );
              
              // Find stages this one depends on (previous in flow)
              const prevStages = stage.dependencies 
                ? stages.filter(s => stage.dependencies!.includes(s.stage_id))
                : [];

              return (
                <Card key={stage.stage_id} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <span className="text-2xl">{stage.icon || '📋'}</span>
                          <h3 className="text-xl font-semibold text-gray-900">{stage.stage_name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            stage.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {stage.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Position: {stage.position}
                          </span>
                          {stage.stage_type && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                              {stage.stage_type}
                            </span>
                          )}
                        </div>
                        {stage.description && (
                          <p className="text-gray-600 mb-3">{stage.description}</p>
                        )}
                        <div className="flex items-center space-x-2 flex-wrap gap-2">
                          {prevStages.length > 0 && (
                            <>
                              <span className="text-sm text-gray-500">Depends on:</span>
                              {prevStages.map((prev) => (
                                <span key={prev.stage_id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                  {prev.stage_name}
                                </span>
                              ))}
                            </>
                          )}
                          {nextStages.length > 0 && (
                            <>
                              <span className="text-sm text-gray-500 ml-2">Leads to:</span>
                              {nextStages.map((next) => (
                                <span key={next.stage_id} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                  {next.stage_name}
                                </span>
                              ))}
                            </>
                          )}
                          {prevStages.length === 0 && nextStages.length === 0 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                              Standalone Stage
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant={stage.is_active ? "outline" : "primary"}
                          onClick={() => toggleStage(stage.stage_id)}
                          className={stage.is_active ? "border-red-500 text-red-600 hover:bg-red-50" : ""}
                        >
                          {stage.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </Grid>
        </div>
      </div>
    </div>
  );
}






