/**
 * Conversation Manager Admin Integration
 * Links ConversationManager to Admin UI for status and configuration
 */

import { supabase } from '@/lib/supabase';

export interface StageConfig {
  stage_id: string;
  stage_name: string;
  stage_type: string;
  position: number;
  is_active: boolean;
  is_required: boolean;
  description?: string;
  icon?: string;
  color?: string;
  config?: Record<string, any>;
  dependencies?: string[];
}

export interface ConversationManagerStatus {
  total_stages: number;
  active_stages: number;
  total_threads: number;
  active_threads: number;
  last_updated: string;
}

export interface StageFlowNode {
  id: string;
  name: string;
  type: string;
  position: number;
  is_active: boolean;
  dependencies: string[];
}

export interface StageFlowEdge {
  from: string;
  to: string;
  type: 'required' | 'optional';
}

export interface StageFlow {
  nodes: StageFlowNode[];
  edges: StageFlowEdge[];
}

export interface StageExecutionFlow {
  thread_id: string;
  stages: Array<{
    stage_id: string;
    stage_name: string;
    executed_at: string;
    status: 'completed' | 'failed' | 'skipped';
    duration_ms?: number;
  }>;
  current_stage?: string;
  total_duration_ms?: number;
}

/**
 * Get ConversationManager status and statistics
 */
export async function getConversationManagerStatus(): Promise<ConversationManagerStatus> {
  try {
    // Get stage statistics
    const { data: stages, error: stagesError } = await supabase
      .from('ddsa_stage_config')
      .select('stage_id, is_active');

    if (stagesError) {
      console.error('Error fetching stages:', stagesError);
      throw stagesError;
    }

    const totalStages = stages?.length || 0;
    const activeStages = stages?.filter(s => s.is_active).length || 0;

    // Get thread statistics
    const { data: threads, error: threadsError } = await supabase
      .from('chat_threads')
      .select('id, status');

    if (threadsError) {
      console.error('Error fetching threads:', threadsError);
      // Don't throw, just use defaults
    }

    const totalThreads = threads?.length || 0;
    const activeThreads = threads?.filter(t => t.status === 'active').length || 0;

    return {
      total_stages: totalStages,
      active_stages: activeStages,
      total_threads: totalThreads,
      active_threads: activeThreads,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting ConversationManager status:', error);
    // Return default status on error
    return {
      total_stages: 0,
      active_stages: 0,
      total_threads: 0,
      active_threads: 0,
      last_updated: new Date().toISOString()
    };
  }
}

/**
 * Get all configured stages from database
 */
export async function getConfiguredStages(): Promise<StageConfig[]> {
  try {
    const { data, error } = await supabase
      .from('ddsa_stage_config')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching configured stages:', error);
      throw error;
    }

    return (data || []).map(stage => ({
      stage_id: stage.stage_id,
      stage_name: stage.stage_name,
      stage_type: stage.stage_type,
      position: stage.position,
      is_active: stage.is_active,
      is_required: stage.is_required,
      description: stage.description,
      icon: stage.icon,
      color: stage.color,
      config: stage.config || {},
      dependencies: stage.dependencies || []
    }));
  } catch (error) {
    console.error('Error getting configured stages:', error);
    return [];
  }
}

/**
 * Visualize stage flow from configured stages
 */
export function visualizeStageFlow(stages: StageConfig[]): StageFlow {
  const nodes: StageFlowNode[] = stages.map(stage => ({
    id: stage.stage_id,
    name: stage.stage_name,
    type: stage.stage_type,
    position: stage.position,
    is_active: stage.is_active,
    dependencies: stage.dependencies || []
  }));

  const edges: StageFlowEdge[] = [];
  
  // Create edges based on dependencies
  stages.forEach(stage => {
    if (stage.dependencies && stage.dependencies.length > 0) {
      stage.dependencies.forEach(depId => {
        // Check if dependency exists in stages
        const depStage = stages.find(s => s.stage_id === depId);
        if (depStage) {
          edges.push({
            from: depId,
            to: stage.stage_id,
            type: stage.is_required ? 'required' : 'optional'
          });
        }
      });
    }
  });

  return { nodes, edges };
}

/**
 * Get stage execution flow for a specific thread
 */
export async function getStageExecutionFlow(threadId: string): Promise<StageExecutionFlow> {
  try {
    // Get thread info
    const { data: thread, error: threadError } = await supabase
      .from('chat_threads')
      .select('id, stage, status, created_at, updated_at')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    // Get AI responses for this thread to track stage execution
    const { data: responses, error: responsesError } = await supabase
      .from('ai_responses')
      .select('stage_ref, created_at, tokens_in, tokens_out')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
    }

    // Group responses by stage
    const stageExecutions = new Map<string, {
      stage_id: string;
      stage_name: string;
      executed_at: string;
      status: 'completed' | 'failed' | 'skipped';
      duration_ms?: number;
    }>();

    // Get stage names
    const { data: stages } = await supabase
      .from('ddsa_stage_config')
      .select('stage_id, stage_name');

    const stageMap = new Map(stages?.map(s => [s.stage_id, s.stage_name]) || []);

    // Process responses to build execution flow
    let lastTimestamp: Date | null = null;
    (responses || []).forEach((response, index) => {
      if (response.stage_ref) {
        const stageId = response.stage_ref;
        const stageName = stageMap.get(stageId) || stageId;
        const executedAt = new Date(response.created_at);
        
        let durationMs: number | undefined;
        if (lastTimestamp) {
          durationMs = executedAt.getTime() - lastTimestamp.getTime();
        }
        lastTimestamp = executedAt;

        // Update or create stage execution
        if (!stageExecutions.has(stageId)) {
          stageExecutions.set(stageId, {
            stage_id: stageId,
            stage_name: stageName,
            executed_at: response.created_at,
            status: 'completed',
            duration_ms: durationMs
          });
        } else {
          // Update existing execution
          const existing = stageExecutions.get(stageId)!;
          existing.duration_ms = (existing.duration_ms || 0) + (durationMs || 0);
        }
      }
    });

    // Calculate total duration
    const totalDuration = Array.from(stageExecutions.values())
      .reduce((sum, exec) => sum + (exec.duration_ms || 0), 0);

    return {
      thread_id: threadId,
      stages: Array.from(stageExecutions.values()),
      current_stage: thread.stage,
      total_duration_ms: totalDuration
    };
  } catch (error) {
    console.error('Error getting stage execution flow:', error);
    throw error;
  }
}




