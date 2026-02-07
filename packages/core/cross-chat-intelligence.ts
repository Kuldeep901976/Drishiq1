// Enhanced PersistentThreadManager with Cross-Chat Intelligence
// This extends the existing thread manager to provide seamless experience across all chats

import { createClient } from '@supabase/supabase-js';

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize Supabase client with proper environment variable handling
const supabaseUrl = isBrowser 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL 
  : process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = isBrowser 
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  : process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase environment variables not found. Cross-chat intelligence will be disabled.');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface UserProfile {
  id: string;
  userId: string;
  overallPatterns: any[];
  behavioralInsights: any[];
  learningPreferences: any;
  communicationStyle: any;
  domainExpertise: any;
  goalConsistency: any;
  challengePatterns: any[];
  preferredLanguage: string;
  interactionFrequency: string;
  sessionPreferences: any;
  overallConfidence: number;
  relationshipDepth: 'new' | 'developing' | 'established' | 'deep';
  personalizationLevel: number;
  lastUpdated: Date;
  version: number;
}

export interface EnhancedContext {
  userProfile: UserProfile | null;
  threadContext: any;
  crossChatIntelligence: {
    hasProfile: boolean;
    hasThreadContext: boolean;
    contextMergedAt: Date;
  };
}

export class CrossChatIntelligenceManager {
  
  // Get comprehensive user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!supabase) {
      console.warn('Supabase not initialized, returning null profile');
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_profile_summary')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        overallPatterns: data.overall_patterns || [],
        behavioralInsights: data.behavioral_insights || [],
        learningPreferences: data.learning_preferences || {},
        communicationStyle: data.communication_style || {},
        domainExpertise: data.domain_expertise || {},
        goalConsistency: data.goal_consistency || {},
        challengePatterns: data.challenge_patterns || [],
        preferredLanguage: data.preferred_language || 'en',
        interactionFrequency: data.interaction_frequency || 'moderate',
        sessionPreferences: data.session_preferences || {},
        overallConfidence: data.overall_confidence || 0.5,
        relationshipDepth: data.relationship_depth || 'new',
        personalizationLevel: data.personalization_level || 1,
        lastUpdated: new Date(data.last_updated),
        version: data.version || 1
      };
    } catch (error) {
      console.warn('Could not get user profile (this is normal for new users):', error);
      return null;
    }
  }

  // Get enhanced context combining user profile and thread context
  async getEnhancedContext(userId: string, threadId?: string): Promise<EnhancedContext> {
    if (!supabase) {
      console.warn('Supabase not initialized, returning empty context');
      return {
        userProfile: null,
        threadContext: null,
        crossChatIntelligence: {
          hasProfile: false,
          hasThreadContext: false,
          contextMergedAt: new Date()
        }
      };
    }
    
    try {
      const { data, error } = await supabase
        .rpc('get_enhanced_user_context', {
          p_user_id: userId,
          p_thread_id: threadId || null
        });

      if (error) throw error;

      return {
        userProfile: data.user_profile,
        threadContext: data.thread_context,
        crossChatIntelligence: {
          hasProfile: data.cross_chat_intelligence.has_profile,
          hasThreadContext: data.cross_chat_intelligence.has_thread_context,
          contextMergedAt: new Date(data.cross_chat_intelligence.context_merged_at)
        }
      };
    } catch (error) {
      console.error('Error getting enhanced context:', error);
      return {
        userProfile: null,
        threadContext: null,
        crossChatIntelligence: {
          hasProfile: false,
          hasThreadContext: false,
          contextMergedAt: new Date()
        }
      };
    }
  }

  // Update user profile with latest data
  async updateUserProfile(userId: string): Promise<void> {
    if (!supabase) {
      console.warn('Supabase not initialized, skipping profile update');
      return;
    }
    
    try {
      const { error } = await supabase
        .rpc('update_user_profile_summary', {
          p_user_id: userId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  // Get user's cross-thread patterns
  async getUserPatterns(userId: string): Promise<any[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .rpc('aggregate_user_patterns', {
          p_user_id: userId
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user patterns:', error);
      return [];
    }
  }

  // Get user's domain expertise
  async getUserDomainExpertise(userId: string): Promise<any[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .rpc('get_user_domain_expertise', {
          p_user_id: userId
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting domain expertise:', error);
      return [];
    }
  }

  // Get user's learning preferences
  async getUserLearningPreferences(userId: string): Promise<any> {
    if (!supabase) return {};
    
    try {
      const { data, error } = await supabase
        .rpc('get_user_learning_preferences', {
          p_user_id: userId
        });

      if (error) throw error;
      return data || {};
    } catch (error) {
      console.error('Error getting learning preferences:', error);
      return {};
    }
  }

  // Build personalized system prompt based on user profile
  buildPersonalizedPrompt(userProfile: UserProfile, threadContext: any, domainOfLife: string): string {
    let prompt = `You are DrishiQ, an AI assistant that helps users navigate life challenges with clarity and wisdom.`;

    // Add relationship depth context
    if (userProfile.relationshipDepth !== 'new') {
      prompt += `\n\nYou have an ${userProfile.relationshipDepth} relationship with this user (confidence: ${userProfile.overallConfidence}).`;
    }

    // Add communication style preferences
    if (userProfile.communicationStyle.preferred_language) {
      prompt += `\n\nUser prefers communication in: ${userProfile.communicationStyle.preferred_language}`;
    }

    if (userProfile.communicationStyle.question_preference) {
      prompt += `\n\nUser prefers ${userProfile.communicationStyle.question_preference} questions.`;
    }

    // Add domain expertise
    if (userProfile.domainExpertise[domainOfLife]) {
      const expertise = userProfile.domainExpertise[domainOfLife];
      prompt += `\n\nUser has ${expertise.expertise_level} expertise in ${domainOfLife} (${expertise.interaction_count} previous interactions).`;
    }

    // Add behavioral patterns
    if (userProfile.overallPatterns.length > 0) {
      prompt += `\n\nKnown user patterns:`;
      userProfile.overallPatterns.slice(0, 3).forEach(pattern => {
        prompt += `\n- ${pattern.type}: ${pattern.description} (confidence: ${pattern.confidence})`;
      });
    }

    // Add learning preferences
    if (userProfile.learningPreferences.response_patterns) {
      prompt += `\n\nUser learning preferences:`;
      Object.entries(userProfile.learningPreferences.response_patterns).forEach(([type, prefs]: [string, any]) => {
        prompt += `\n- ${type}: prefers ${prefs.preferred_format}, ${prefs.completion_rate * 100}% completion rate`;
      });
    }

    // Add thread-specific context
    if (threadContext && threadContext.current_focus) {
      prompt += `\n\nCurrent focus: ${threadContext.current_focus}`;
    }

    if (threadContext && threadContext.conversation_stage) {
      prompt += `\n\nConversation stage: ${threadContext.conversation_stage}`;
    }

    prompt += `\n\nProvide personalized, context-aware guidance that builds on previous interactions while addressing current needs.`;

    return prompt;
  }

  // Check if user needs profile update
  async shouldUpdateProfile(userId: string): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { data, error } = await supabase
        .from('user_profile_summary')
        .select('last_updated')
        .eq('user_id', userId)
        .single();

      if (error || !data) return true;

      const lastUpdated = new Date(data.last_updated);
      const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
      
      // Update if more than 24 hours old
      return hoursSinceUpdate > 24;
    } catch (error) {
      console.error('Error checking profile update:', error);
      return true;
    }
  }

  // Get continuity suggestions for new chat
  async getContinuitySuggestions(userId: string, domainOfLife: string): Promise<string[]> {
    if (!supabase) return [];
    
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        console.log('No user profile found - this is normal for new users');
        return [];
      }

      const suggestions: string[] = [];

      // Suggest based on previous patterns
      if (userProfile.overallPatterns.length > 0) {
        const recentPatterns = userProfile.overallPatterns.slice(0, 2);
        suggestions.push(`Based on your previous patterns: ${recentPatterns.map(p => p.description).join(', ')}`);
      }

      // Suggest based on domain expertise
      if (userProfile.domainExpertise[domainOfLife]) {
        const expertise = userProfile.domainExpertise[domainOfLife];
        suggestions.push(`You've worked on ${domainOfLife} before (${expertise.interaction_count} sessions). Let's build on that progress.`);
      }

      // Suggest based on relationship depth
      if (userProfile.relationshipDepth !== 'new') {
        suggestions.push(`Welcome back! I remember our previous conversations and can provide more personalized guidance.`);
      }

      return suggestions;
    } catch (error) {
      console.warn('Could not get continuity suggestions:', error);
      return [];
    }
  }
}
