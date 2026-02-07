'use client';

import { useState, useRef } from 'react';

function getSpeechRecognitionLang(lang: string): string {
  const langMap: Record<string, string> = {
    en: 'en-US',
    hi: 'hi-IN',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pt: 'pt-BR',
    ar: 'ar-SA',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ru: 'ru-RU',
    bn: 'bn-BD',
    ta: 'ta-IN',
  };
  return langMap[lang] || 'en-US';
}

export interface UseVoiceInputParams {
  language: string;
  inputValue: string;
  setInputValue: (v: string) => void;
  expandedOptions: Record<string, { expanded: boolean; text: string }>;
  setExpandedOptions: React.Dispatch<React.SetStateAction<Record<string, { expanded: boolean; text: string }>>>;
  setError: (v: string) => void;
}

export function useVoiceInput({
  language,
  inputValue,
  setInputValue,
  expandedOptions,
  setExpandedOptions,
  setError,
}: UseVoiceInputParams) {
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const [optionVoiceRecording, setOptionVoiceRecording] = useState<Record<string, boolean>>({});

  const startVoiceRecording = () => {
    if (isVoiceRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsVoiceRecording(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      setRecordingDuration(0);
      return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getSpeechRecognitionLang(language);

      recognition.onstart = () => {
        setIsVoiceRecording(true);
        recordingStartTimeRef.current = Date.now();
        setRecordingDuration(0);
        durationIntervalRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          setRecordingDuration(elapsed);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const currentText = inputValue || '';
        const newText = currentText ? `${currentText} ${transcript}` : transcript;
        setInputValue(newText);
        setIsVoiceRecording(false);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        setRecordingDuration(0);
      };

      recognition.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error);
        setIsVoiceRecording(false);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        setRecordingDuration(0);
        if (event.error !== 'no-speech') {
          setError('Voice recognition failed. Please try again.');
        }
      };

      recognition.onend = () => {
        setIsVoiceRecording(false);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        setRecordingDuration(0);
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setError('Failed to start voice recognition. Please check your microphone permissions.');
        setIsVoiceRecording(false);
      }
    } else {
      setError('Voice recognition is not supported in your browser.');
    }
  };

  const startOptionVoiceRecording = (optionKey: string) => {
    if (optionVoiceRecording[optionKey]) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setOptionVoiceRecording((prev) => ({ ...prev, [optionKey]: false }));
      return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getSpeechRecognitionLang(language);

      recognition.onstart = () => {
        setOptionVoiceRecording((prev) => ({ ...prev, [optionKey]: true }));
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const currentText = expandedOptions[optionKey]?.text || '';
        const newText = currentText ? `${currentText} ${transcript}` : transcript;
        setExpandedOptions((prev) => ({
          ...prev,
          [optionKey]: { ...prev[optionKey], text: newText, expanded: true },
        }));
        setOptionVoiceRecording((prev) => ({ ...prev, [optionKey]: false }));
      };

      recognition.onerror = () => {
        setOptionVoiceRecording((prev) => ({ ...prev, [optionKey]: false }));
      };

      recognition.onend = () => {
        setOptionVoiceRecording((prev) => ({ ...prev, [optionKey]: false }));
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setOptionVoiceRecording((prev) => ({ ...prev, [optionKey]: false }));
      }
    }
  };

  return {
    startVoiceRecording,
    isVoiceRecording,
    recordingDuration,
    startOptionVoiceRecording,
    optionVoiceRecording,
  };
}
