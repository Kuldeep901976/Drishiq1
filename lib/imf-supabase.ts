/**
 * imf-supabase.ts
 * Intelligence Modularization Framework (IMF) – Supabase integration
 * Works with: knowledge_modules, instruction_map, module_invocations
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------- Types ----------
interface ModuleSpec {
  name: string;
  version?: string;
  purpose?: string;
  status?: 'draft' | 'active' | 'deprecated';
  content?: string;
  metadata?: object;
}

interface InstructionSpec {
  source_module: string;
  target_module: string;
  trigger_condition: object;
  action_description?: string;
  metadata?: object;
}

// ---------- Core helpers ----------

// Upsert a knowledge module
export async function registerModule(spec: ModuleSpec) {
  const { data, error } = await supabase
    .from('knowledge_modules')
    .upsert(
      {
        name: spec.name,
        version: spec.version ?? 'v1.0',
        purpose: spec.purpose ?? null,
        status: spec.status ?? 'draft',
        content: spec.content ?? null,
        metadata: spec.metadata ?? {},
      },
      { onConflict: 'name' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Create instruction mapping
export async function createInstructionMap(spec: InstructionSpec) {
  const { data, error } = await supabase
    .from('instruction_map')
    .insert({
      source_module: spec.source_module,
      target_module: spec.target_module,
      trigger_condition: spec.trigger_condition ?? {},
      action_description: spec.action_description ?? null,
      metadata: spec.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---------- Evaluation engine ----------

// Evaluate all enabled mappings for the given context
export async function evaluateAndInvoke(context: any) {
  const { data: maps, error } = await supabase
    .from('instruction_map')
    .select('*')
    .eq('enabled', true);

  if (error) throw error;

  for (const m of maps ?? []) {
    if (matchCondition(m.trigger_condition, context)) {
      await logInvocation(m.target_module, m.map_id, context, {
        triggered_by: m.source_module,
      });
      // Fire invocation (non-blocking)
      invokeModule(m.target_module, context, m).catch(console.error);
    }
  }
}

// Match JSON conditions to runtime context
function matchCondition(condition: any, context: any): boolean {
  for (const [k, v] of Object.entries(condition ?? {})) {
    if (k.endsWith('_gte')) {
      const field = k.replace('_gte', '');
      if (Number(context[field]) < Number(v)) return false;
      continue;
    }
    if (k.endsWith('_lte')) {
      const field = k.replace('_lte', '');
      if (Number(context[field]) > Number(v)) return false;
      continue;
    }
    if (context[k] === undefined) return false;
    if (typeof v === 'string' && typeof context[k] === 'string') {
      if (context[k].toLowerCase() !== v.toLowerCase()) return false;
    } else if (context[k] !== v) return false;
  }
  return true;
}

// ---------- Invocation & logging ----------

async function logInvocation(
  moduleName: string,
  mapId: string,
  context: any,
  payload: any
) {
  const { data, error } = await supabase
    .from('module_invocations')
    .insert({
      module_name: moduleName,
      trigger_map_id: mapId,
      context,
      payload,
      status: 'queued',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function invokeModule(moduleName: string, context: any, mapRow: any) {
  // Mark running
  await supabase
    .from('module_invocations')
    .update({ status: 'running', updated_at: new Date().toISOString() })
    .eq('module_name', moduleName);

  try {
    // Replace with actual assistant call or job dispatch
    const responseText = `Invoked ${moduleName} for context ${JSON.stringify(
      context
    )}`;

    await supabase
      .from('module_invocations')
      .update({
        status: 'success',
        response: responseText,
        completed_at: new Date().toISOString(),
      })
      .eq('module_name', moduleName);

    return { success: true };
  } catch (err: any) {
    await supabase
      .from('module_invocations')
      .update({
        status: 'failed',
        response: String(err.message || err),
        completed_at: new Date().toISOString(),
      })
      .eq('module_name', moduleName);
    throw err;
  }
}