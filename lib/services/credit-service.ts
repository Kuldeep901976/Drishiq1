/**
 * Credit Service
 * Manages credits and supported persons
 */

import { createServiceClient } from '@/lib/supabase';

const supabase = createServiceClient();

export interface SupportedPerson {
  id: string;
  caregiver_id: string;
  full_name: string;
  relationship: string;
  date_of_birth?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new supported person
 */
export async function createSupportedPerson(
  caregiverId: string,
  fullName: string,
  relationship: string,
  dateOfBirth?: string
): Promise<SupportedPerson | null> {
  try {
    const { data, error } = await supabase
      .from('supported_persons')
      .insert({
        caregiver_id: caregiverId,
        full_name: fullName,
        relationship,
        date_of_birth: dateOfBirth || null,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating supported person:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating supported person:', error);
    return null;
  }
}

/**
 * Get supported persons for a caregiver
 */
export async function getSupportedPersons(caregiverId: string): Promise<SupportedPerson[]> {
  try {
    const { data, error } = await supabase
      .from('supported_persons')
      .select('*')
      .eq('caregiver_id', caregiverId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting supported persons:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting supported persons:', error);
    return [];
  }
}

/**
 * Deduct credit for a user
 * This is a wrapper around the database function
 */
export async function deductCredit(
  userId: string,
  sessionId: string,
  tokensToUse: number = 1
): Promise<{ success: boolean; tokens_remaining?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('deduct_chat_session_tokens', {
      p_user_id: userId,
      p_session_id: sessionId,
      p_tokens_to_use: tokensToUse
    });

    if (error) {
      console.error('Error deducting credit:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      tokens_remaining: data?.tokens_remaining || 0
    };
  } catch (error: any) {
    console.error('Error in deductCredit:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}




