/**
 * Onboarding Concierge Types
 * Minimal data model for onboarding flow - NOT a full profile
 */

/**
 * Minimal onboarding snapshot - just what we need for personalized greeting,
 * problem understanding, and routing. NOT a full profile.
 * 
 * This does NOT duplicate user_profiles or chat_user_profiles.
 * It's a lightweight snapshot for the onboarding flow only.
 */
export type OnboardingSnapshot = {
  displayName?: string;           // What to call them ("John", "Mr. Smith")
  addressingStyle?: string;       // "John" vs "Mr. Sharma" - for tone
  ageBracket?: "<18" | "18-30" | "30-50" | "50+";  // Only brackets, NO DOB
  countryOrRegion?: string;       // From geo or user correction
  language?: string;              // Current UI/chat language (mutable, e.g. dropdown)
  geoLanguage?: string;           // Primary visitor geo language (from region/country)
  geoSuggestedLanguage?: string;  // Optional secondary language for region (for hint: chat vs geo suggested)
  langSource?: string;            // 'cookie'|'browser'|'geo'|'fallback' or middleware 'strong'|'guess'
  initialReason?: string;         // First free-text "what's going on today"
  problemCategory?: string;       // From 3-question bundle (career, stress, etc.)
  questionAnswers?: {
    nature?: string;              // Nature of challenge
    duration?: string;            // How long
    intensity?: string;           // How intense
    gender?: string;              // For avatar/display
  };
  coreProblemSummary?: string;    // Short summary after analysis (for routing & prefill)
};

/**
 * Request to Onboarding Concierge API
 */
export type OnboardingConciergeRequest = {
  userId?: string | null;
  threadId?: string | null;       // "onboarding_<uuid>" namespace
  message: string;
  language?: string;              // Fallback if snapshot.language absent
  onboardingSnapshot?: OnboardingSnapshot;
};

/**
 * Response from Onboarding Concierge API
 */
export type OnboardingConciergeResponse = {
  success: boolean;
  message: string;                // Assistant text
  interactiveBlock?: string;      // For 3-question bundle, etc.
  threadId: string;
  onboardingSnapshot?: OnboardingSnapshot; // Updated snapshot
  metadata?: {
    roundsUsed: number;
    roundsRemaining: number;
    maxRounds: number;
    done?: boolean;               // True when 5-round limit reached & summary sent
    hasQuestionBundle?: boolean;  // True if response contains 3-question bundle
    isComplete?: boolean;
  };
};

