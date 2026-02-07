'use client';

import { useState, useEffect, useRef } from 'react';
import type { OnboardingSnapshot } from '@/lib/onboarding-concierge/types';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id?: string;
}

export interface UseInactivityNudgesParams {
  isOpen: boolean;
  threadId: string | null;
  isLoading: boolean;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onClose: () => void;
  saveConversationToDatabase: (threadId: string, messages: Message[]) => Promise<void>;
  getCurrentLanguage: (snapshot?: OnboardingSnapshot | null) => string;
  snapshot: OnboardingSnapshot;
  currentStage: string | null;
}

export function useInactivityNudges({
  isOpen,
  threadId,
  isLoading,
  messages,
  setMessages,
  onClose,
  saveConversationToDatabase,
  getCurrentLanguage,
  snapshot,
  currentStage,
}: UseInactivityNudgesParams) {
  const [inactivityNudgeCount, setInactivityNudgeCount] = useState(0);
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nudgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const updateActivity = () => {
    lastActivityRef.current = Date.now();
    setInactivityNudgeCount(0);
    if (nudgeTimerRef.current) {
      clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen || !threadId || isLoading) {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      if (nudgeTimerRef.current) {
        clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = null;
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      if (!isOpen) {
        setInactivityNudgeCount(0);
        lastActivityRef.current = Date.now();
      }
      return;
    }

    if (messages.length === 0) {
      return;
    }

    const generateNudgeMessage = async (nudgeNumber: number): Promise<string> => {
      try {
        const recentMessages = messagesRef.current.slice(-5);
        const conversationHistory = recentMessages
          .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n');

        const challenge =
          snapshot.questionAnswers?.nature ||
          snapshot.initialReason ||
          snapshot.problemCategory ||
          snapshot.coreProblemSummary ||
          null;
        const hasChallenge = !!challenge;

        const objective = {
          name: !snapshot.displayName,
          challenge: !hasChallenge,
          age: !snapshot.ageBracket,
          location: !snapshot.countryOrRegion,
        };

        const collected = {
          name: snapshot.displayName || null,
          challenge: challenge,
          age: snapshot.ageBracket || null,
          location: snapshot.countryOrRegion || null,
        };

        const response = await fetch('/api/chat/onboarding-nudge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            threadId,
            nudgeNumber,
            objective,
            collected,
            currentStage: currentStage || 'onboarding_greeting',
            conversationHistory: conversationHistory || undefined,
            language: getCurrentLanguage(snapshot),
            userName: snapshot.displayName || undefined,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.nudgeMessage || "I'm here whenever you're ready to continue.";
        }
      } catch (error) {
        console.warn('⚠️ [Onboarding] Failed to generate personalized nudge:', error);
      }

      return nudgeNumber === 1
        ? "I'm here whenever you're ready to continue."
        : nudgeNumber === 2
          ? "Let's keep going - I'm here to help you find solutions."
          : "Ready to continue? I'm here to help.";
    };

    inactivityTimerRef.current = setInterval(async () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;

      if (timeSinceLastActivity >= 60000 && inactivityNudgeCount === 0) {
        setInactivityNudgeCount(1);
        const nudgeContent = await generateNudgeMessage(1);
        const nudgeMessage: Message = {
          role: 'assistant',
          content: nudgeContent,
          timestamp: new Date(),
          id: `nudge_1_${Date.now()}`,
        };
        setMessages((prev) => [...prev, nudgeMessage]);
        lastActivityRef.current = Date.now();
      } else if (timeSinceLastActivity >= 150000 && inactivityNudgeCount === 1) {
        setInactivityNudgeCount(2);
        const nudgeContent = await generateNudgeMessage(2);
        const nudgeMessage: Message = {
          role: 'assistant',
          content: nudgeContent,
          timestamp: new Date(),
          id: `nudge_2_${Date.now()}`,
        };
        setMessages((prev) => [...prev, nudgeMessage]);
      } else if (timeSinceLastActivity >= 300000 && inactivityNudgeCount === 2) {
        setInactivityNudgeCount(3);
        const nudgeContent = await generateNudgeMessage(3);
        const nudgeMessage: Message = {
          role: 'assistant',
          content: nudgeContent,
          timestamp: new Date(),
          id: `nudge_3_${Date.now()}`,
        };
        setMessages((prev) => [...prev, nudgeMessage]);

        closeTimerRef.current = setTimeout(() => {
          if (threadId) {
            saveConversationToDatabase(threadId, messagesRef.current).catch(console.error);
          }
          onClose();
        }, 10000);
      }
    }, 5000);

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      if (nudgeTimerRef.current) {
        clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = null;
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen, threadId, isLoading, messages.length, inactivityNudgeCount]);

  return { updateActivity };
}
