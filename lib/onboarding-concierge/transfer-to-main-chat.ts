/**
 * Transfer Onboarding Conversation to Main Chat
 *
 * 1. Load pre_chat thread and messages via PersistentThreadManager
 * 2. Create new main_chat thread (userId, language)
 * 3. Copy messages to main thread
 * 4. Update pre_chat thread metadata (main_chat_thread_id); update temp_users (transferred_to_user_id)
 */

import { createServiceClient } from '@/lib/supabase';
import { PersistentThreadManager } from '@/packages/core/persistent-thread-manager';
import { createResponse, normalizeResponse } from '@/lib/responses/responsesClient';

export interface TransferResult {
  success: boolean;
  mainChatThreadId: string | null;
  message?: string;
  needsMoreQuestions?: boolean;
  suggestedQuestions?: string[];
}

/**
 * Transfer onboarding conversation to main chat
 */
export async function transferOnboardingToMainChat(
  onboardingThreadId: string,
  userId: string
): Promise<TransferResult> {
  try {
    const supabase = createServiceClient();
    const threadManager = new PersistentThreadManager();

    const thread = await threadManager.getThread(onboardingThreadId);
    if (!thread) {
      return {
        success: false,
        mainChatThreadId: null,
        message: 'Onboarding conversation not found',
      };
    }

    const metadata = thread.metadata || {};
    if (metadata.main_chat_thread_id) {
      return {
        success: true,
        mainChatThreadId: metadata.main_chat_thread_id as string,
        message: 'Conversation already transferred',
      };
    }

    const conversationMessages = await threadManager.getMessages(onboardingThreadId);

    const language = thread.language || 'en';

    const mainChatThread = await threadManager.createThread('main_chat', {
      userId,
      language,
    });

    for (const msg of conversationMessages) {
      await threadManager.addMessage(mainChatThread.id, {
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    await supabase
      .from('chat_threads')
      .update({
        metadata: {
          from_onboarding: true,
          onboarding_thread_id: onboardingThreadId,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', mainChatThread.id);

    await supabase
      .from('chat_threads')
      .update({
        metadata: { ...metadata, main_chat_thread_id: mainChatThread.id },
        updated_at: new Date().toISOString(),
      })
      .eq('id', onboardingThreadId);

    if (thread.temp_user_id) {
      await supabase
        .from('temp_users')
        .update({
          transferred_to_user_id: userId,
          transferred_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', thread.temp_user_id);
    }

    const conversationText = conversationMessages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const assessment = await assessIfMoreQuestionsNeeded(
      conversationText,
      mainChatThread.id
    );

    return {
      success: true,
      mainChatThreadId: mainChatThread.id,
      needsMoreQuestions: assessment.needsMoreQuestions,
      suggestedQuestions: assessment.suggestedQuestions,
    };
  } catch (error: any) {
    console.error('❌ [Transfer Onboarding] Error:', error);
    return {
      success: false,
      mainChatThreadId: null,
      message: error.message || 'Failed to transfer conversation',
    };
  }
}

/**
 * Assess if more questions are needed based on onboarding conversation text
 */
async function assessIfMoreQuestionsNeeded(
  conversationText: string,
  _threadId: string
): Promise<{
  needsMoreQuestions: boolean;
  suggestedQuestions: string[];
}> {
  try {
    const conversationSummary = conversationText.substring(0, 2000);

    const assessmentPrompt = `You are an expert consultant assessing a user's onboarding conversation.

ONBOARDING CONVERSATION SUMMARY:
${conversationSummary}

Your task:
1. Assess if enough information has been collected to provide a comprehensive solution
2. Identify any critical gaps in understanding
3. Suggest 2-3 specific follow-up questions if more information is needed

Return JSON only:
{
  "needsMoreQuestions": true/false,
  "reason": "brief explanation",
  "suggestedQuestions": ["question 1", "question 2", "question 3"]
}`;

    const inputArray: Array<{ role: string; content: string }> = [
      {
        role: 'system',
        content:
          'You are an expert consultant. Assess onboarding conversations and determine if more questions are needed. Return JSON only.',
      },
      { role: 'user', content: assessmentPrompt },
    ];

    const response = await createResponse({
      model: 'gpt-4-turbo',
      input: inputArray,
      temperature: 0.3,
    });

    const normalized = normalizeResponse(response);
    const content = normalized.content;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          needsMoreQuestions: parsed.needsMoreQuestions || false,
          suggestedQuestions: parsed.suggestedQuestions || [],
        };
      }
    } catch (e) {
      console.warn('⚠️ [Transfer] Could not parse assessment JSON:', e);
    }

    return {
      needsMoreQuestions: false,
      suggestedQuestions: [],
    };
  } catch (error: any) {
    console.error('❌ [Transfer] Assessment error:', error);
    return {
      needsMoreQuestions: false,
      suggestedQuestions: [],
    };
  }
}
