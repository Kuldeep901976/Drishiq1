// app/api/feedback/route.ts
// Feedback ingestion endpoint for Feedback Assistant

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { processFeedback, createAdminSuggestion, FeedbackRecord } from '@/lib/feedback-assistant';
import audit from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await req.json();
    const {
      userId,
      threadId,
      problemId,
      actionIds,
      rating,
      feedbackText,
      planCompleteness
    } = body;

    // Validation
    if (!userId || !threadId || !rating || (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, threadId, rating (1-5)' },
        { status: 400 }
      );
    }

    const feedback: FeedbackRecord = {
      userId,
      threadId,
      problemId,
      actionIds,
      rating,
      feedbackText,
      planCompleteness,
      timestamp: new Date().toISOString()
    };

    // Process feedback via Feedback Assistant
    const analysis = await processFeedback(feedback);

    // Store feedback in database
    try {
      const { data: feedbackRecord, error: insertError } = await supabase
        .from('feedback')
        .insert({
          user_id: userId,
          thread_id: threadId,
          problem_id: problemId || null,
          action_ids: actionIds || null,
          rating,
          feedback_text: feedbackText || null,
          plan_completeness: analysis.planCompleteness || null,
          escalation_flag: analysis.escalationFlag || false,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError && !insertError.message.includes('does not exist')) {
        console.warn('⚠️ Feedback table may not exist:', insertError.message);
      }

      // Create admin suggestions if any
      if (analysis.suggestions && analysis.suggestions.length > 0) {
        for (const suggestion of analysis.suggestions) {
          const adminSuggestion = createAdminSuggestion(feedback, suggestion);
          
          // Store in admin_suggestions table (if exists)
          try {
            await supabase.from('admin_suggestions').insert({
              feedback_id: adminSuggestion.feedbackId,
              intent: suggestion.intent,
              suggested_rule: suggestion.suggestedRule,
              confidence: suggestion.confidence,
              status: 'pending',
              created_at: adminSuggestion.createdAt
            });
          } catch (e) {
            // Table may not exist - log but don't fail
            console.warn('⚠️ admin_suggestions table may not exist:', (e as Error).message);
            audit.log('ADMIN_SUGGESTION_STORED_FALLBACK', {
              suggestionId: adminSuggestion.id,
              feedbackId: adminSuggestion.feedbackId
            });
          }
        }
      }

      // Handle escalation (rating <= 3)
      if (analysis.escalationFlag) {
        audit.log('FEEDBACK_ESCALATION', {
          userId,
          threadId,
          rating,
          reason: 'low_rating'
        });
        // Could trigger admin notification, support ticket, etc.
      }

      return NextResponse.json({
        success: true,
        feedbackId: feedbackRecord?.id,
        analysis: {
          planCompleteness: analysis.planCompleteness,
          suggestionsCount: analysis.suggestions?.length || 0,
          escalationFlag: analysis.escalationFlag
        }
      });
    } catch (dbError) {
      // Even if DB fails, return analysis (non-critical)
      console.error('Feedback DB error (non-critical):', dbError);
      return NextResponse.json({
        success: true,
        analysis: {
          planCompleteness: analysis.planCompleteness,
          suggestionsCount: analysis.suggestions?.length || 0,
          escalationFlag: analysis.escalationFlag
        },
        warning: 'Feedback analysis complete, but storage may have failed'
      });
    }
  } catch (err: any) {
    console.error('Feedback processing error:', err);
    audit.log('FEEDBACK_ENDPOINT_FAILED', { error: String(err) });
    return NextResponse.json(
      { error: 'Failed to process feedback', details: err.message },
      { status: 500 }
    );
  }
}

