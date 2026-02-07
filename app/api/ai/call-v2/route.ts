/**
 * Responses API Wrapper - /api/ai/call-v2
 * 
 * Non-streaming wrapper for OpenAI Responses API
 * Uses existing DB schema (ddsa_stage_config, chat_threads, chat_messages)
 * via db-adapters layer
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServiceClient } from '@/lib/supabase';
import { 
  getStageById, 
  getStageByName,
  getInstructionSetById, 
  getRecentMessages, 
  insertAiResponse 
} from '@/lib/ddsa/db-adapters';
import { calculateCost } from '@/lib/utils/model-pricing';
import { createResponse, normalizeResponse } from '@/lib/responses/responsesClient';
import Ajv from 'ajv';

// Get API client based on provider configuration
async function getAPIClient(providerId?: string, apiEndpoint?: string): Promise<OpenAI> {
  const supabase = createServiceClient();
  
  // If provider ID is specified, load from database
  if (providerId) {
    const { data: provider, error } = await supabase
      .from('chat_llm_providers')
      .select('*')
      .eq('id', providerId)
      .eq('is_active', true)
      .single();

    if (!error && provider) {
      // Use provider's API key and endpoint
      const apiKey = provider.api_key_encrypted || process.env.OPENAI_API_KEY;
      const endpoint = apiEndpoint || provider.api_endpoint || 'https://api.openai.com/v1';
      
      if (!apiKey) {
        throw new Error(`API key not configured for provider: ${provider.provider_name}`);
      }

      return new OpenAI({
        apiKey,
        baseURL: endpoint
      });
    }
  }

  // Fallback to environment variable
  const apiKey = process.env.OPENAI_RESPONSES_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_RESPONSES_KEY or OPENAI_API_KEY environment variable is not set');
  }
  
  // Get base URL from environment or use default
  const baseURL = apiEndpoint || 
                  process.env.OPENAI_RESPONSES_BASE_URL || 
                  process.env.OPENAI_BASE_URL || 
                  'https://api.openai.com/v1';
  
  // Build OpenAI client configuration
  const clientConfig: any = {
    apiKey,
    baseURL
  };
  
  // Add project ID if provided (for Responses API)
  if (process.env.OPENAI_RESPONSES_PROJECT || process.env.OPENAI_PROJECT_ID) {
    clientConfig.defaultQuery = {
      project: process.env.OPENAI_RESPONSES_PROJECT || process.env.OPENAI_PROJECT_ID
    };
  }
  
  return new OpenAI(clientConfig);
}

// Initialize JSON schema validator
const ajv = new Ajv();

interface CallV2Request {
  user_thread_id?: string;
  thread_id: string;
  thread_type?: 'chat' | 'sub';
  stage_id?: string;
  stage_name?: string;
  input: string;
  model_override?: string;
  previous_response_id?: string;
  instruction_set_id?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: CallV2Request = await request.json();
    const {
      user_thread_id,
      thread_id,
      thread_type = 'chat',
      stage_id,
      stage_name,
      input,
      model_override,
      previous_response_id,
      instruction_set_id
    } = body;

    // Validate required fields
    if (!thread_id || !input) {
      return NextResponse.json(
        { error: 'thread_id and input are required' },
        { status: 400 }
      );
    }

    // Resolve stage configuration
    let stage = null;
    if (stage_id) {
      stage = await getStageById(stage_id);
    } else if (stage_name) {
      stage = await getStageByName(stage_name);
    }

    if (!stage) {
      return NextResponse.json(
        { error: 'Stage not found or disabled' },
        { status: 404 }
      );
    }

    if (!stage.enabled) {
      return NextResponse.json(
        { error: 'Stage is disabled' },
        { status: 400 }
      );
    }

    // Resolve instruction set
    let instructionSet = null;
    if (instruction_set_id) {
      instructionSet = await getInstructionSetById(instruction_set_id);
    } else if (stage.instruction_set_id) {
      instructionSet = await getInstructionSetById(stage.instruction_set_id);
    }

    if (!instructionSet) {
      console.warn('⚠️ No instruction set found for stage:', stage.id);
      // Continue without instruction set (use default behavior)
    }

    // Determine model and API configuration from stage config
    const stageConfig = stage.config || {};
    const model = model_override || stage.model || stageConfig.model || 'gpt-4-turbo';
    const maxTokens = stage.max_tokens || stageConfig.max_tokens || 2000;
    const temperature = stage.temperature ?? stageConfig.temperature ?? 0.7;
    const providerId = stageConfig.provider_id;
    const apiEndpoint = stageConfig.api_endpoint;

    // Get recent messages for context
    const recentMessages = await getRecentMessages(thread_id, 8);

    // Assemble input array for Responses API
    const inputArray: any[] = [];

    // 1. System prompt from instruction set
    if (instructionSet?.system_prompt) {
      inputArray.push({
        role: 'system',
        content: instructionSet.system_prompt
      });
    }

    // 2. Behavior guidance (metadata)
    inputArray.push({
      role: 'system',
      content: JSON.stringify({
        thread_type,
        thread_id,
        stage: stage.id,
        stage_name: stage.name,
        user_thread_id: user_thread_id || thread_id
      })
    });

    // 3. Few-shot examples from instruction set
    if (instructionSet?.few_shot_examples && Array.isArray(instructionSet.few_shot_examples)) {
      for (const example of instructionSet.few_shot_examples) {
        if (example.user) {
          inputArray.push({
            role: 'user',
            content: example.user
          });
        }
        if (example.assistant) {
          inputArray.push({
            role: 'assistant',
            content: example.assistant
          });
        }
      }
    }

    // 4. Recent conversation messages
    for (const msg of recentMessages) {
      inputArray.push({
        role: msg.role,
        content: msg.content
      });
    }

    // 5. Current user input
    inputArray.push({
      role: 'user',
      content: input
    });

    // Use Responses API adapter
    let response: any;
    let normalized: { content: string; id: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } };
    
    let responsesApiResult: any = null;
    try {
      // Try Responses API first
      responsesApiResult = await createResponse({
        model,
        input: inputArray,
        max_tokens: maxTokens,
        temperature
      });
      
      normalized = normalizeResponse(responsesApiResult);
    } catch (responsesError: any) {
      // Fallback to chat.completions if Responses API is not available
      console.warn('⚠️ Responses API not available, falling back to chat.completions:', responsesError.message);
      
      const openai = await getAPIClient(providerId, apiEndpoint);
      const chatResponse = await openai.chat.completions.create({
        model,
        messages: inputArray,
        max_tokens: maxTokens,
        temperature
      });
      
      normalized = normalizeResponse(chatResponse);
    }

    const assistantMessage = normalized.content;
    const responseId = normalized.id;
    const promptHash = responsesApiResult?._prompt_hash ?? null;
    const responseHash = responsesApiResult?._response_hash ?? null;
    const tokensIn = normalized.usage?.prompt_tokens || 0;
    const tokensOut = normalized.usage?.completion_tokens || 0;
    const totalTokens = normalized.usage?.total_tokens || 0;

    // Calculate estimated cost using model-specific pricing
    const costs = calculateCost(tokensIn, tokensOut, model);
    const estimatedCost = costs.total_cost;

    // Parse JSON output if schema is provided
    let parsedJson = null;
    let schemaValidated: boolean | null = null;
    
    if (instructionSet?.output_schema) {
      try {
        parsedJson = JSON.parse(assistantMessage);
        const validate = ajv.compile(instructionSet.output_schema);
        const validationResult = validate(parsedJson);
        // Ensure schemaValidated is boolean | null (not undefined)
        schemaValidated = typeof validationResult === 'boolean' ? validationResult : null;
        
        if (!schemaValidated) {
          console.warn('⚠️ Schema validation failed:', validate.errors);
        }
      } catch (parseError) {
        // Not JSON or parse error - that's okay
        console.warn('⚠️ Could not parse response as JSON:', parseError);
        schemaValidated = null;
      }
    }

    // Store AI response using new adapter
    const { insertAiResponse } = await import('@/lib/db/aiResponses');
    const startTime = Date.now();
    const requestStartTime = request.headers.get('x-request-start-time') 
      ? parseInt(request.headers.get('x-request-start-time')!) 
      : startTime;
    const latencyMs = Date.now() - requestStartTime;

    const aiResponse = await insertAiResponse({
      responseId: responseId,
      threadId: thread_id,
      tenantId: body.tenant_id || undefined,
      stageRef: stage.id,
      model,
      requestPayload: {
        model,
        messages: inputArray,
        max_tokens: maxTokens,
        temperature
      },
      responsePayload: responsesApiResult ?? {},
      promptHash: promptHash,
      responseHash: responseHash,
      tokensIn: tokensIn,
      tokensOut: tokensOut,
      totalTokens: totalTokens,
      latencyMs: latencyMs
    });

    if (!aiResponse) {
      console.error('⚠️ Failed to store AI response in database');
    }

    // Return response
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      ok: true,
      response_id: responseId,
      output_text: assistantMessage,
      parsed_json: parsedJson || undefined,
      usage: {
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        total_tokens: totalTokens,
        estimated_cost: estimatedCost
      },
      schema_validated: schemaValidated,
      response_time_ms: responseTime
    });

  } catch (error: any) {
    console.error('❌ Error in /api/ai/call-v2:', error);
    
    return NextResponse.json(
      { 
        ok: false,
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

