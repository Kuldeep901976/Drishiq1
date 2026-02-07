'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAllAvailableLanguages } from '../lib/onboarding-concierge/regional-languages';
import { setLanguageForAll } from '@/lib/language-detection';
import useGreeterController from '@/hooks/onboarding/useGreeterController';
import { useLanguageAndLocation } from '@/hooks/onboarding/useLanguageAndLocation';
import { useInactivityNudges } from '@/hooks/onboarding/useInactivityNudges';
import { useVoiceInput } from '@/hooks/onboarding/useVoiceInput';
import { HeaderBar, InputBar, ChatMessages, OtpSection, OtpVerifySection, InteractiveBlocks } from '@/components/onboarding';
import type { OnboardingSnapshot } from '@/lib/onboarding-concierge/types';

interface OnboardingConciergeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export default function OnboardingConciergeOverlay({
  isOpen,
  onClose,
  userId = 'anon',
}: OnboardingConciergeOverlayProps) {
  const router = useRouter();
  const updateActivityRef = useRef<(() => void) | null>(null);
  const getCurrentLanguageRef = useRef<() => string>(() => 'en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationInitializedRef = useRef(false);

  const [inputValue, setInputValue] = useState('');
  const [expandedOptions, setExpandedOptions] = useState<Record<string, { expanded: boolean; text: string }>>({});
  const [showLangHint, setShowLangHint] = useState(true);

  const lang = useLanguageAndLocation({ isOpen });

  const greeter = useGreeterController({
    userId,
    getCurrentLanguage: () => getCurrentLanguageRef.current?.() ?? 'en',
    router,
    onClose,
    updateActivityRef,
    detectedLocation: lang.detectedLocation,
  });

  const nudge = useInactivityNudges({
    isOpen,
    threadId: greeter.threadId,
    isLoading: greeter.isLoading,
    messages: greeter.messages,
    setMessages: greeter.setMessages,
    onClose,
    saveConversationToDatabase: greeter.saveConversationToDatabase,
    getCurrentLanguage: (s) => lang.getCurrentLanguage(s ?? greeter.snapshot),
    snapshot: greeter.snapshot,
    currentStage: greeter.currentStage,
  });

  useEffect(() => {
    updateActivityRef.current = nudge.updateActivity;
  }, [nudge.updateActivity]);

  useEffect(() => {
    getCurrentLanguageRef.current = () => lang.getCurrentLanguage(greeter.snapshot);
  }, [lang, greeter.snapshot]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [greeter.messages]);

  useEffect(() => {
    const userMessageCount = greeter.messages.filter((m: { role: string }) => m.role === 'user').length;
    if (userMessageCount >= 2) {
      setShowLangHint(false);
    }
  }, [greeter.messages]);

  useEffect(() => {
    if (!greeter.snapshot) return;

    if (!greeter.snapshot.geoLanguage && greeter.snapshot.language) {
      greeter.setSnapshot((prev: OnboardingSnapshot) => ({
        ...prev,
        geoLanguage: prev.geoLanguage ?? prev.language,
      }));
    }
  }, [greeter.snapshot]);

  // Single source of truth: greeter API decides language (cookie → browser → geo). Sync to website so chat and site stay in sync.
  useEffect(() => {
    if (greeter.threadId && greeter.snapshot?.language) {
      setLanguageForAll(greeter.snapshot.language);
      lang.setLanguage(greeter.snapshot.language as Parameters<typeof lang.setLanguage>[0]);
    }
  }, [greeter.threadId, greeter.snapshot?.language]);

  useEffect(() => {
    const geoReady =
      !!lang.detectedLocation?.city || !!lang.detectedLocation?.country;

    if (
      isOpen &&
      geoReady &&
      !greeter.threadId &&
      !greeter.isLoading &&
      !conversationInitializedRef.current
    ) {
      conversationInitializedRef.current = true;

      greeter.initializeConversation().catch((err: unknown) => {
        console.error('Failed to initialize conversation:', err);
        conversationInitializedRef.current = false;
      });
    }

    if (!isOpen) {
      conversationInitializedRef.current = false;
    }
  }, [
    isOpen,
    greeter.threadId,
    greeter.isLoading,
    lang.detectedLocation?.city,
    lang.detectedLocation?.country,
  ]);

  // If geo never becomes ready (e.g. detect-location failed), still open conversation after delay so visitor/ensure and geo log run
  useEffect(() => {
    if (!isOpen || greeter.threadId || greeter.isLoading || conversationInitializedRef.current) return;

    const t = setTimeout(() => {
      if (conversationInitializedRef.current || greeter.threadId) return;
      conversationInitializedRef.current = true;
      greeter.initializeConversation().catch((err: unknown) => {
        console.error('Failed to initialize conversation (fallback):', err);
        conversationInitializedRef.current = false;
      });
    }, 4000);

    return () => clearTimeout(t);
  }, [isOpen, greeter.threadId, greeter.isLoading]);

  const voice = useVoiceInput({
    language: lang.getCurrentLanguage(greeter.snapshot),
    inputValue,
    setInputValue,
    expandedOptions,
    setExpandedOptions,
    setError: greeter.setError,
  });

  const toggleOptionExpansion = (optionKey: string) => {
    setExpandedOptions((prev: Record<string, { expanded: boolean; text: string }>) => ({
      ...prev,
      [optionKey]: {
        expanded: !prev[optionKey]?.expanded,
        text: prev[optionKey]?.text || '',
      },
    }));
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguageForAll(newLang);
    lang.setLanguage(newLang);

    greeter.setSnapshot((prev: OnboardingSnapshot) => ({
      ...prev,
      language: newLang,
    }));
  };

  const renderAssistantContent = (content: string) => (
    <>
      <InteractiveBlocks
        content={content}
        answers={greeter.answers}
        setAnswers={greeter.setAnswers}
        expandedOptions={expandedOptions}
        setExpandedOptions={setExpandedOptions}
        onFormAnswers={greeter.sendFormAnswers}
        onSelectOption={greeter.sendSelectedOption}
        onToggleOptionExpansion={toggleOptionExpansion}
        startOptionVoiceRecording={voice.startOptionVoiceRecording}
        optionVoiceRecording={voice.optionVoiceRecording}
        threadId={greeter.threadId}
        isLoading={greeter.isLoading}
        setError={greeter.setError}
      />

      {greeter.currentStage === 'onboarding_phone_verification' &&
        !greeter.phoneVerificationState.otpSent && (
          <OtpSection
            currentStage={greeter.currentStage}
            phoneVerificationState={greeter.phoneVerificationState}
            onPhoneNumberChange={(phoneNumber: string) =>
              greeter.setPhoneVerificationState((prev) => ({ ...prev, phoneNumber }))
            }
            onOtpCodeChange={(otpCode: string[]) =>
              greeter.setPhoneVerificationState((prev) => ({ ...prev, otpCode }))
            }
            onPhoneSubmit={greeter.sendPhone}
            onOtpVerify={greeter.verifyOtp}
          />
        )}

      {greeter.phoneVerificationState.otpSent && (
        <OtpVerifySection
          phoneVerificationState={greeter.phoneVerificationState}
          onOtpCodeChange={(otpCode: string[]) =>
            greeter.setPhoneVerificationState((prev) => ({ ...prev, otpCode }))
          }
          onOtpVerify={greeter.verifyOtp}
        />
      )}
    </>
  );

  if (!isOpen) return null;

  const showHeaderHelper = greeter.showLanguageHelper && !greeter.hasUserSentMessage;

  return (
    <div className="onboarding-concierge-overlay-wrapper fixed inset-0 z-[10000] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="onboarding-concierge-no-select bg-[#F9FCFA] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border-2 border-[#0B4422]">

          <HeaderBar
            isDetectingLocation={lang.isDetectingLocation}
            getCurrentLanguage={() => lang.getCurrentLanguage(greeter.snapshot)}
            availableLanguages={lang.availableLanguages}
            getAllAvailableLanguages={getAllAvailableLanguages}
            onLanguageChange={handleLanguageChange}
            onClose={onClose}
            languageHelperVisible={showHeaderHelper}
            showLangHint={showLangHint}
            snapshot={greeter.snapshot}
          />

          <ChatMessages
            messages={greeter.messages}
            answers={greeter.answers}
            snapshot={greeter.snapshot as OnboardingSnapshot}
            isLoading={greeter.isLoading}
            renderAssistantContent={renderAssistantContent}
            messagesEndRef={messagesEndRef}
          />

          {greeter.error && (
            <div className="px-4 pb-2">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {greeter.error}
              </div>
            </div>
          )}

          {greeter.currentStage !== 'onboarding_phone_verification' &&
            !greeter.phoneVerificationState.otpSent && (
              <InputBar
                inputValue={inputValue}
                onInputChange={setInputValue}
                onInputActivity={nudge.updateActivity}
                onSend={() => {
                  greeter.sendMessage(inputValue, () => setInputValue(''));
                }}
                isLoading={greeter.isLoading}
                messagesLength={greeter.messages.length}
                startVoiceRecording={voice.startVoiceRecording}
                isVoiceRecording={voice.isVoiceRecording}
                recordingDuration={voice.recordingDuration}
              />
            )}

          <div className="p-4 border-t border-gray-200">
            <div className="text-center mb-2">
              <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 underline">
                Skip to website
              </button>
            </div>
            <div id="recaptcha-container" className="hidden"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
