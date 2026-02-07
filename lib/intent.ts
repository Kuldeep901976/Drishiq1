/**
 * Intent Computation
 * Computes user intent from text input using heuristics and LLM fallback
 */

export interface IntentResult {
  label: string;
  confidence: number;
  raw?: any;
  domain?: string;
}

export interface ComputeIntentOptions {
  userId?: string;
  threadId?: string;
  language?: string;
  userProfile?: any;
  state?: any;
}

/**
 * Compute intent from text input
 * Uses heuristics first, falls back to LLM if needed
 */
export async function computeIntent(
  text: string,
  options: ComputeIntentOptions = {}
): Promise<IntentResult> {
  const { userId, threadId, language = 'en', userProfile, state } = options;

  // Normalize input
  const normalizedText = (text || '').toLowerCase().trim();

  // If empty, return unknown intent
  if (!normalizedText) {
    return {
      label: 'unknown',
      confidence: 0.1,
      raw: { reason: 'empty_input' }
    };
  }

  // Heuristic-based intent detection
  const intent = detectIntentHeuristic(normalizedText);

  // If confidence is low, could use LLM fallback here
  // For now, return heuristic result
  return intent;
}

/**
 * Detect intent using heuristics
 */
function detectIntentHeuristic(text: string): IntentResult {
  // Common intent patterns
  const patterns: Array<{ label: string; keywords: string[]; confidence: number; domain?: string }> = [
    {
      label: 'cost_reduction',
      keywords: ['reduce', 'cut', 'save', 'spending', 'expenses', 'budget', 'money', 'cost', 'cheaper', 'afford'],
      confidence: 0.9,
      domain: 'financial'
    },
    {
      label: 'skill_learning',
      keywords: ['learn', 'study', 'course', 'training', 'skill', 'education', 'teach', 'master'],
      confidence: 0.85,
      domain: 'education'
    },
    {
      label: 'health_improvement',
      keywords: ['health', 'fitness', 'exercise', 'diet', 'weight', 'wellness', 'medical', 'doctor'],
      confidence: 0.85,
      domain: 'health'
    },
    {
      label: 'career_advancement',
      keywords: ['career', 'job', 'promotion', 'work', 'professional', 'salary', 'position', 'advance'],
      confidence: 0.85,
      domain: 'career'
    },
    {
      label: 'relationship_improvement',
      keywords: ['relationship', 'partner', 'marriage', 'family', 'friend', 'social', 'communication'],
      confidence: 0.85,
      domain: 'relationships'
    },
    {
      label: 'stress_management',
      keywords: ['stress', 'anxiety', 'worried', 'overwhelmed', 'pressure', 'tension', 'relax'],
      confidence: 0.8,
      domain: 'health'
    },
    {
      label: 'time_management',
      keywords: ['time', 'schedule', 'busy', 'overwhelmed', 'balance', 'productivity', 'efficient'],
      confidence: 0.8,
      domain: 'personal-growth'
    },
    {
      label: 'goal_achievement',
      keywords: ['goal', 'achieve', 'accomplish', 'target', 'objective', 'success', 'complete'],
      confidence: 0.75,
      domain: 'personal-growth'
    }
  ];

  // Find best matching pattern
  let bestMatch: { label: string; confidence: number; domain?: string } | null = null;
  let maxScore = 0;

  for (const pattern of patterns) {
    const matches = pattern.keywords.filter(keyword => text.includes(keyword)).length;
    if (matches > 0) {
      const score = (matches / pattern.keywords.length) * pattern.confidence;
      if (score > maxScore) {
        maxScore = score;
        bestMatch = {
          label: pattern.label,
          confidence: Math.min(score, pattern.confidence),
          domain: pattern.domain
        };
      }
    }
  }

  // Return best match or unknown
  if (bestMatch && maxScore > 0.3) {
    return {
      label: bestMatch.label,
      confidence: bestMatch.confidence,
      domain: bestMatch.domain,
      raw: { method: 'heuristic', score: maxScore }
    };
  }

  // Default to unknown with low confidence
  return {
    label: 'unknown',
    confidence: 0.3,
    raw: { method: 'heuristic', reason: 'no_pattern_match' }
  };
}

// Default export for compatibility
export default { computeIntent };






