'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingSnapshot } from '@/lib/onboarding-concierge/types';
import type { ConfirmationResult } from 'firebase/auth';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id?: string;
}

export interface UseGreeterControllerParams {
  userId: string;
  getCurrentLanguage: () => string;
  router: ReturnType<typeof useRouter>;
  onClose: () => void;
  updateActivityRef: React.MutableRefObject<(() => void) | null>;
  detectedLocation: { country?: string; city?: string } | null;
  setInputValue?: (v: string) => void;
}

interface GreeterGetResponse {
  success: boolean;
  threadId: string;
  message: string;
  showLanguageHelper?: boolean;
  language?: string;
  geoLanguage?: string;
  geoSuggestedLanguage?: string;
  langSource?: string;
}

interface GreeterPostResponse {
  success: boolean;
  threadId: string;
  message: string;
  error?: string;
}

const ONBOARDING_STORAGE_KEY = 'currentThreadId';

export default function useGreeterController({
  userId: _userId,
  getCurrentLanguage,
  router,
  onClose,
  updateActivityRef,
  detectedLocation,
}: UseGreeterControllerParams) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [snapshot, setSnapshot] = useState<OnboardingSnapshot>({});
  const [currentStage] = useState<string | null>(null);
  const [showLanguageHelper, setShowLanguageHelper] = useState(false);
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);

  const [phoneVerificationState, setPhoneVerificationState] = useState<{
    phoneNumber: string;
    otpSent: boolean;
    otpCode: string[];
    confirmationResult: ConfirmationResult | null;
    verifying: boolean;
  }>({
    phoneNumber: '',
    otpSent: false,
    otpCode: ['', '', '', '', '', ''],
    confirmationResult: null,
    verifying: false,
  });

  const initializeConversation = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError('');

      const headers: Record<string, string> = {};

      // Only send geo headers when we actually have location
      if (detectedLocation?.city) {
        headers['x-geo-city'] = detectedLocation.city;
      }
      if (detectedLocation?.country) {
        headers['x-geo-country'] = detectedLocation.country;
      }

      const response = await fetch('/api/chat/onboarding-concierge', {
        method: 'GET',
        headers,
      });

      const data: GreeterGetResponse = await response.json();

      if (!data.success || !data.threadId) {
        throw new Error('Invalid response');
      }

      sessionStorage.setItem(ONBOARDING_STORAGE_KEY, data.threadId);
      setThreadId(data.threadId);

      // Always enable helper initially — UI decides when to hide
      setShowLanguageHelper(data.showLanguageHelper ?? true);

      // Persist BOTH chat + geo languages reliably
      setSnapshot({
        language: data.language ?? 'en',
        geoLanguage: data.geoLanguage ?? 'en',
        geoSuggestedLanguage: data.geoSuggestedLanguage ?? 'en',
        langSource: data.langSource ?? 'fallback',
      });

      setMessages([
        {
          role: 'assistant',
          content: data.message || '',
          timestamp: new Date(),
        },
      ]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to start conversation';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text: string, onSent?: () => void): Promise<void> => {
    if (!threadId || !text.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setHasUserSentMessage(true);
    setUserMessageCount((c) => c + 1);
    onSent?.();
    updateActivityRef.current?.();

    // Hide hint after 2 user messages
    if (userMessageCount + 1 >= 2) {
      setShowLanguageHelper(false);
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/chat/onboarding-concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          message: text.trim(),
          language: getCurrentLanguage(),
        }),
      });

      const data: GreeterPostResponse = await response.json();

      if (!data.success) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        },
      ]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    setMessages,
    threadId,
    isLoading,
    error,
    setError,
    snapshot,
    setSnapshot,
    answers,
    setAnswers,
    currentStage,
    showLanguageHelper,
    hasUserSentMessage,
    phoneVerificationState,
    setPhoneVerificationState,
    initializeConversation,
    sendMessage,
    sendFormAnswers: async () => {},
    sendSelectedOption: async () => {},
    saveConversationToDatabase: async () => {},
    sendPhone: async () => {},
    verifyOtp: async () => {},
  };
}
