/**
 * Main Chat Route - Omnivyra Integration
 * 
 * Simplified chat endpoint that integrates with Omnivyra middleware.
 * Uses /api/uda/open-solution endpoint for main chat functionality.
 * 
 * Flow:
 * 1. Parse request (JSON format)
 * 2. Credit check (for authenticated users)
 * 3. Thread management (create/get thread)
 * 4. Save user message to database
 * 5. Call Omnivyra open-solution API
 * 6. Save assistant response to database
 * 7. Return response to client
 */

import { NextRequest, NextResponse } from 'next/server';
import { PersistentThreadManager } from '@/packages/core/persistent-thread-manager';
import { createServiceClient } from '@/lib/supabase';
import { resolveTenantId, setTenantRLS } from '@/app/api/middleware/tenant';
import { 
  getOmnivyraClient, 
  buildOmnivyraRequest, 
  formatOmnivyraResponseForUser,
  type OmnivyraOpenSolutionResponse 
} from '@/lib/omnivyra';
import { generateGreeterMessage } from '@/app/api/chat/onboarding-concierge/route';
import { saveSectionSummary, resolveSectionForMainChat } from '@/lib/chat/sectionMemory';
import { getVisitorContext } from '@/lib/visitor/getVisitorContext';
import { normalizeLanguage } from '@/lib/onboarding-concierge/regional-languages';

// ============================================
// CREDIT CHECK
// ============================================

async function checkUserCredits(userId: string): Promise<{ 
  hasCredit: boolean; 
  currentBalance: number; 
  message: string 
}> {
  try {
    const supabase = createServiceClient();
    const { data: balanceRow, error: balanceError } = await supabase
      .from('user_credits_balance')
      .select('credits_balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (balanceError) {
      console.error('Error fetching credits:', balanceError);
      return {
        hasCredit: false,
        currentBalance: 0,
        message: 'Unable to check credits'
      };
    }

    const available = balanceRow?.credits_balance ?? 0;
    
    console.log(`✅ Credit check for user ${userId}: ${available} credits available`);
    
    return {
      hasCredit: available >= 1,
      currentBalance: available,
      message: available >= 1
        ? `You have ${available} credits available`
        : 'Insufficient credits. Purchase more to continue.'
    };
  } catch (error) {
    console.error('Error in checkUserCredits:', error);
    return {
      hasCredit: false,
      currentBalance: 0,
      message: 'Error checking credits'
    };
  }
}

async function deductCredit(userId: string, sessionId: string, tokensToUse: number = 1): Promise<any> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('deduct_chat_session_tokens', {
      p_user_id: userId,
      p_session_id: sessionId,
      p_tokens_to_use: tokensToUse
    });

    if (error) {
      console.error('Error deducting credit:', error);
      return { success: false, tokens_remaining: 0, message: 'Failed to deduct credit' };
    }

    return {
      success: true,
      tokens_remaining: data?.[0]?.tokens_remaining || 0,
      message: 'Credit deducted successfully'
    };
  } catch (error) {
    console.error('Error in deductCredit:', error);
    return { success: false, tokens_remaining: 0, message: 'Error deducting credit' };
  }
}

// ============================================
// CHIE HEADER PARSER
// ============================================

function parseDdsHeader(header: string): {
  language?: string;
  age?: string;
  gender?: string;
  city?: string;
  country?: string;
  dob?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  firstName?: string;
  issueSummary?: string;
} {
  if (!header || typeof header !== 'string') {
    return {};
  }

  try {
    const parts = header.split(',');
    if (parts.length < 2) {
      return {};
    }

    const metadataPart = parts[0].trim();
    const nameIssuePart = parts.slice(1).join(',').trim();
    const metadataFields = metadataPart.split('|').map(f => f.trim());
    
    const result: any = {};
    
    if (metadataFields.length >= 1 && metadataFields[0]) result.language = metadataFields[0];
    if (metadataFields.length >= 2 && metadataFields[1]) result.age = metadataFields[1];
    if (metadataFields.length >= 3 && metadataFields[2]) result.gender = metadataFields[2];
    if (metadataFields.length >= 4 && metadataFields[3]) result.city = metadataFields[3];
    if (metadataFields.length >= 5 && metadataFields[4]) result.country = metadataFields[4];
    if (metadataFields.length >= 6 && metadataFields[5]) result.dob = metadataFields[5];
    if (metadataFields.length >= 7 && metadataFields[6]) result.timeOfBirth = metadataFields[6];
    if (metadataFields.length >= 8 && metadataFields[7]) result.placeOfBirth = metadataFields[7];
    
    // Parse name from the rest
    const nameIssueWords = nameIssuePart.split(/\s+/).filter(w => w.length > 0);
    if (nameIssueWords.length > 0) {
      result.firstName = nameIssueWords[0].replace(/,$/, '');
      if (nameIssueWords.length > 1) {
        result.issueSummary = nameIssueWords.slice(1).join(' ');
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Error parsing CHIE header:', error);
    return {};
  }
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

interface ChatRequestBody {
  userId: string;
  threadId?: string;
  message: string;
  header?: string;
  userProfile?: Record<string, any>;
  language?: string;
  companyId?: string | null;
}

interface ChatResponseBody {
  success: boolean;
  message?: string;
  threadId: string;
  questions?: string[];
  solutions?: Array<{ option: number; description: string }>;
  nextStep?: string;
  isComplete?: boolean;
  metadata?: {
    requestId: string;
    confidenceScore?: number;
    durationMs?: number;
  };
  error?: string;
  creditsRemaining?: number;
  redirectTo?: string;
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(req: NextRequest): Promise<NextResponse<ChatResponseBody>> {
  const startTime = Date.now();
  
  try {
    // 1. Resolve tenant
    const tenantId = resolveTenantId(req);
    if (tenantId) {
      try {
        await setTenantRLS(tenantId);
      } catch (e) {
        console.warn('⚠️ [Chat] setTenantRLS failed:', e);
      }
    }

    // 2. Validate content type
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json', threadId: '' },
        { status: 415 }
      );
    }

    // 3. Parse request body
    let body: ChatRequestBody;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body', threadId: '' },
        { status: 400 }
      );
    }

    const { 
      userId, 
      threadId: clientThreadId, 
      message, 
      header, 
      userProfile: bodyUserProfile,
      language: bodyLanguage,
      companyId 
    } = body;

    const visitorId = req.headers.get('x-visitor-id') || null;
    const ctx = visitorId && visitorId !== 'anon' ? await getVisitorContext(visitorId) : null;
    const languageToUse = normalizeLanguage(
      bodyLanguage ||
      req.cookies.get('drishiq_lang')?.value ||
      (ctx?.language) ||
      'en'
    );

    // 4. Validate required fields
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required', threadId: '' },
        { status: 400 }
      );
    }

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'message is required', threadId: '' },
        { status: 400 }
      );
    }

    console.log('📥 [Chat] Request received:', { userId, hasThreadId: !!clientThreadId, messageLength: message.length });

    // 5. Parse CHIE header and build user profile
    let userProfile: Record<string, any> = bodyUserProfile || {};
    if (header) {
      const parsedHeader = parseDdsHeader(header);
      userProfile = { ...userProfile, ...parsedHeader };
    }

    // 6. Credit check (skip for anonymous users)
    if (userId !== 'anon') {
      const creditCheck = await checkUserCredits(userId);
      if (!creditCheck.hasCredit) {
        console.log('❌ Insufficient credits for user:', userId);
        return NextResponse.json(
          { 
            success: false,
            error: 'Insufficient credits', 
            redirectTo: '/priceplan#main-plans',
            creditsRemaining: creditCheck.currentBalance,
            threadId: clientThreadId || ''
          },
          { status: 402 }
        );
      }
      console.log('✅ Credit check passed:', creditCheck.currentBalance, 'credits');
    }

    // 7. Thread management (new API: getThread / createThread by phase)
    const threadManager = new PersistentThreadManager();
    let threadId: string;

    if (clientThreadId) {
      const existingThread = await threadManager.getThread(clientThreadId);
      if (existingThread) {
        threadId = clientThreadId;
      } else {
        const newThread = await threadManager.createThread('main_chat', { userId, language: languageToUse });
        threadId = newThread.id;
      }
    } else {
      const thread = await threadManager.createThread('main_chat', { userId, language: languageToUse });
      threadId = thread.id;
    }

    console.log('📋 [Chat] Thread:', { threadId, userId });

    // 8. Save user message to database
    await threadManager.addMessage(threadId, { role: 'user', content: message });
    console.log('💾 [Chat] Saved user message');

    const thread = await threadManager.getThread(threadId);
    if (!thread) {
      return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });
    }

    // Decide which brain to use based on thread_phase
    let assistantReply: string;
    let omnivyraPayload: {
      formattedResponse: ReturnType<typeof formatOmnivyraResponseForUser>;
      requestId: string;
      confidenceScore?: number;
      isComplete?: boolean;
    } | null = null;

    if (thread.thread_phase === 'pre_chat') {
      const prompt = `User said: "${message}"\n\nRespond like a perceptive human. Max 2 sentences.`;
      assistantReply = await generateGreeterMessage(prompt, languageToUse);
    } else {
      try {
        const result = await generateOmnivyraReply({
          threadId,
          userId,
          message,
          userProfile,
          language: languageToUse,
          companyId: companyId ?? null,
        });
        assistantReply = result.content;
        omnivyraPayload = result.payload;
      } catch (err: any) {
        if (err?.statusCode != null) {
          return NextResponse.json(
            {
              success: false,
              error: err.error || 'Failed to process request',
              threadId,
              metadata: { requestId: err.requestId ?? '', durationMs: err.durationMs },
            },
            { status: err.statusCode }
          );
        }
        throw err;
      }
    }

    // 13. Save assistant response to database
    await threadManager.addMessage(threadId, { role: 'assistant', content: assistantReply });
    console.log('💾 [Chat] Saved assistant message');

    const section = resolveSectionForMainChat(message);
    await saveSectionSummary(threadId, section, '');

    // 14. Deduct credit (after successful response; skip for pre_chat)
    if (userId !== 'anon' && thread.thread_phase !== 'pre_chat') {
      const deductResult = await deductCredit(userId, threadId, 1);
      if (!deductResult.success) {
        console.warn('⚠️ [Chat] Credit deduction failed (non-blocking):', deductResult.message);
      }
    }

    // 15. Return response
    const durationMs = Date.now() - startTime;

    if (thread.thread_phase === 'pre_chat') {
      console.log('✅ [Chat] Response sent (pre_chat):', { threadId, durationMs });
      return NextResponse.json({
        success: true,
        message: assistantReply,
        threadId,
      });
    }

    const formatted = omnivyraPayload!.formattedResponse;
    console.log('✅ [Chat] Response sent:', {
      threadId,
      requestId: omnivyraPayload!.requestId,
      durationMs,
    });
    return NextResponse.json({
      success: true,
      message: formatted.message,
      threadId,
      questions: formatted.questions,
      solutions: formatted.solutions,
      nextStep: formatted.nextStep,
      isComplete: formatted.isComplete,
      metadata: {
        requestId: omnivyraPayload!.requestId,
        confidenceScore: omnivyraPayload!.confidenceScore,
        durationMs,
      },
    });

  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error('❌ [Chat] Unhandled error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        threadId: '',
        metadata: {
          requestId: 'error',
          durationMs,
        }
      },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Call Omnivyra and return assistant content + payload for response.
 * On failure returns { ok: false, errorResponse, statusCode } so caller can return the error response.
 */
async function generateOmnivyraReply(params: {
  threadId: string;
  userId: string;
  message: string;
  userProfile: Record<string, any>;
  language: string;
  companyId: string | null;
}): Promise<{
  content: string;
  payload: {
    formattedResponse: ReturnType<typeof formatOmnivyraResponseForUser>;
    requestId: string;
    confidenceScore?: number;
    isComplete?: boolean;
  };
}> {
  const { threadId, userId, message, userProfile, language, companyId } = params;
  const omnivyraRequest = buildOmnivyraRequest({
    sessionId: threadId,
    userId,
    companyId,
    message,
    userProfile,
    language,
  });
  const omnivyraClient = getOmnivyraClient();
  const omnivyraResult = await omnivyraClient.callOpenSolution(omnivyraRequest);

  if (!omnivyraResult.success || !omnivyraResult.data) {
    const statusCode = omnivyraResult.error?.type === 'rate_limited' ? 429
      : omnivyraResult.error?.type === 'validation_error' ? 400
      : 500;
    throw { statusCode, error: omnivyraResult.error?.message || 'Failed to process request', requestId: omnivyraResult.requestId, durationMs: omnivyraResult.durationMs };
  }

  const formattedResponse = formatOmnivyraResponseForUser(omnivyraResult.data);
  const content = buildAssistantMessageContent(formattedResponse, omnivyraResult.data);
  return {
    content,
    payload: {
      formattedResponse,
      requestId: omnivyraResult.requestId,
      confidenceScore: omnivyraResult.data.confidence_score,
      isComplete: omnivyraResult.data.exit,
    },
  };
}

/**
 * Build readable message content from Omnivyra response
 */
function buildAssistantMessageContent(
  formatted: ReturnType<typeof formatOmnivyraResponseForUser>,
  raw: OmnivyraOpenSolutionResponse
): string {
  let content = formatted.message;

  // Add questions if present
  if (formatted.questions && formatted.questions.length > 0) {
    content += '\n\n**Questions:**\n';
    formatted.questions.forEach((q, i) => {
      content += `${i + 1}. ${q}\n`;
    });
  }

  // Add solutions if present
  if (formatted.solutions && formatted.solutions.length > 0) {
    content += '\n\n**Suggested Solutions:**\n';
    formatted.solutions.forEach(s => {
      content += `**Option ${s.option}:** ${s.description}\n`;
    });
  }

  // Add recommendation if present
  if (raw.recommendation) {
    content += `\n\n**Recommendation:** ${raw.recommendation}`;
  }

  // Add next step if present
  if (formatted.nextStep) {
    content += `\n\n**Next Step:** ${formatted.nextStep}`;
  }

  return content.trim();
}

// ============================================
// GET HANDLER (for health check)
// ============================================

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/chat',
    integration: 'omnivyra',
    mode: 'open_solution',
    timestamp: new Date().toISOString(),
  });
}
