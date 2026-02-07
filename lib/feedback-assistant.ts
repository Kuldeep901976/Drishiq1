/**
 * Feedback Assistant
 * Processes user feedback and generates admin suggestions
 */

export interface FeedbackRecord {
  userId: string;
  threadId: string;
  problemId?: string;
  actionIds?: string[];
  rating: number;
  feedbackText?: string;
  planCompleteness?: number;
  timestamp: string;
}

export interface FeedbackAnalysis {
  planCompleteness: number;
  suggestions: AdminSuggestion[];
  escalationFlag: boolean;
}

export interface AdminSuggestion {
  intent: string;
  suggestedRule: string;
  confidence: number;
}

export interface AdminSuggestionRecord {
  id: string;
  feedbackId: string;
  createdAt: string;
}

/**
 * Process feedback and generate analysis
 */
export async function processFeedback(feedback: FeedbackRecord): Promise<FeedbackAnalysis> {
  const { rating, feedbackText, planCompleteness } = feedback;
  
  // Calculate plan completeness if not provided
  let calculatedCompleteness = planCompleteness || 75; // Default
  
  // Adjust based on rating
  if (rating <= 2) {
    calculatedCompleteness = Math.max(calculatedCompleteness - 20, 0);
  } else if (rating >= 4) {
    calculatedCompleteness = Math.min(calculatedCompleteness + 10, 100);
  }
  
  // Generate suggestions based on feedback
  const suggestions: AdminSuggestion[] = [];
  
  // Low rating suggests issues
  if (rating <= 3) {
    suggestions.push({
      intent: 'improve_plan_quality',
      suggestedRule: 'Review plan generation logic for low-rated sessions',
      confidence: 0.8
    });
  }
  
  // Check feedback text for specific issues
  if (feedbackText) {
    const lowerText = feedbackText.toLowerCase();
    
    if (lowerText.includes('incomplete') || lowerText.includes('missing')) {
      suggestions.push({
        intent: 'enhance_intake',
        suggestedRule: 'Improve context gathering in intake stages',
        confidence: 0.7
      });
    }
    
    if (lowerText.includes('unclear') || lowerText.includes('confusing')) {
      suggestions.push({
        intent: 'improve_clarity',
        suggestedRule: 'Enhance plan explanation and clarity',
        confidence: 0.75
      });
    }
    
    if (lowerText.includes('irrelevant') || lowerText.includes('not helpful')) {
      suggestions.push({
        intent: 'improve_relevance',
        suggestedRule: 'Review intent classification and plan matching',
        confidence: 0.8
      });
    }
  }
  
  // Escalation flag for low ratings
  const escalationFlag = rating <= 3;
  
  return {
    planCompleteness: calculatedCompleteness,
    suggestions,
    escalationFlag
  };
}

/**
 * Create admin suggestion record
 */
export function createAdminSuggestion(
  feedback: FeedbackRecord,
  suggestion: AdminSuggestion
): AdminSuggestionRecord {
  return {
    id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    feedbackId: feedback.threadId, // Use threadId as feedback ID
    createdAt: new Date().toISOString()
  };
}




