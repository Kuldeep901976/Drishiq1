'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, ProgressPill, ToastBanner, Sheet } from '../../packages/ui/components';
import { MCQGroup } from '../../packages/ui/mcq';
import { ChatWorker } from '../../packages/worker/chat';
import { PersistentThreadManager } from '../../lib/thread-manager';
import { MarkerParser } from '../../lib/marker-parser';
import { adManager } from '../../lib/ad-manager';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { 
  ChatRequest, 
  ChatResponse, 
  UserResponse, 
  AssistantTurn,
  Lang,
  DomainOfLife,
  QuestionBlock
} from '../../packages/contracts/types';
import { MCQBlock, MCQQuestion } from '../../packages/ui/mcq';

export interface ChatPageProps {
  initialLanguage?: Lang;
  initialDomain?: DomainOfLife;
}

// Convert QuestionBlock to MCQBlock
function convertQuestionBlockToMCQBlock(questionBlock: QuestionBlock): MCQBlock {
  const mcqQuestions: MCQQuestion[] = questionBlock.questions.map(question => ({
    id: question.id,
    text: question.text,
    type: question.type,
    options: question.options.map((option, index) => ({
      id: `${question.id}-option-${index}`,
      text: option,
      value: option
    })),
    required: question.required
  }));

  return {
    id: questionBlock.id,
    questions: mcqQuestions,
    progress: questionBlock.progress,
    type: questionBlock.type
  };
}

export const ChatPage: React.FC<ChatPageProps> = ({
  initialLanguage = 'en',
  initialDomain = 'personal-growth'
}) => {
  // State management
  const [language, setLanguage] = useState<Lang>(initialLanguage as Lang);
  const [domain, setDomain] = useState<DomainOfLife>(initialDomain as DomainOfLife);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [currentTurn, setCurrentTurn] = useState<AssistantTurn | null>(null);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'warning' | 'error' | 'info'; message: string } | null>(null);
  const [currentStage, setCurrentStage] = useState<string>('DISCOVER');
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDots, setRecordingDots] = useState('');
  
  // Voice recording hook
  const {
    isRecording: voiceRecording,
    isProcessing,
    audioBlob,
    audioUrl,
    duration,
    error: voiceError,
    startRecording,
    stopRecording,
    clearRecording,
    formatDuration
  } = useVoiceRecording();
  
  // Mock user for now - replace with actual authentication
  const user = {
    id: 'demo-user-123',
    email: 'demo@example.com',
    name: 'Demo User',
    userType: 'individual',
    ageBand: 'adult'
  };
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<ChatWorker | null>(null);
  const dotsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize chat worker and thread manager
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Initialize ChatWorker
        workerRef.current = new ChatWorker({
          enableStreaming: true,
          maxRetries: 3,
          timeout: 30000,
          chunkSize: 50,
          delay: 100
        });

        // Get or create active thread
        const threadManager = new PersistentThreadManager();
        const thread = await threadManager.getOrCreateActiveThread(
          user.id,
          domain,
          language
        );
        
        setCurrentThreadId(thread.id);
        setCurrentStage(thread.stage);

        // Load existing messages
        const existingMessages = await threadManager.getMessages(thread.id);
        if (existingMessages && existingMessages.length > 0) {
          const formattedMessages = existingMessages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msg.createdAt || new Date()
          }));
          setMessages(formattedMessages);
        } else {
          // Add welcome message for new thread
          const welcomeMessage = {
            role: 'assistant' as const,
            content: 'Welcome to DrishiQ Chat! I\'m here to help you with your questions and provide insights. How can I assist you today?',
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        // Fallback to welcome message
        const welcomeMessage = {
          role: 'assistant' as const,
          content: 'Welcome to DrishiQ Chat! I\'m here to help you with your questions and provide insights. How can I assist you today?',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    };

    initializeChat();
  }, [user.id, domain, language]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Handle voice recording completion
  useEffect(() => {
    if (audioBlob && !isProcessing) {
      handleVoiceTranscription();
    }
  }, [audioBlob, isProcessing]);

  // Handle voice errors
  useEffect(() => {
    if (voiceError) {
      setToast({ type: 'error', message: voiceError });
    }
  }, [voiceError]);

  // Recording dots animation
  useEffect(() => {
    if (isRecording) {
      dotsIntervalRef.current = setInterval(() => {
        setRecordingDots(prev => {
          if (prev === '...') return '';
          return prev + '.';
        });
      }, 500);
    } else {
      if (dotsIntervalRef.current) {
        clearInterval(dotsIntervalRef.current);
        dotsIntervalRef.current = null;
      }
      setRecordingDots('');
    }

    return () => {
      if (dotsIntervalRef.current) {
        clearInterval(dotsIntervalRef.current);
      }
    };
  }, [isRecording]);

  // Handle send message with Drishiq1 Assistant API
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !currentThreadId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Add user message to display
      const userMessage = {
        role: 'user' as const,
        content: message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to Drishiq1 Assistant API
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          threadId: currentThreadId,
          userId: user.id,
          domain: domain,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error(`Assistant API error: ${response.statusText}`);
      }

      const assistantResponse = await response.json();
      
      // Parse the response for markers and AD_HOOK
      const parsedResponse = MarkerParser.parseResponse(assistantResponse.response);
      
      // Handle AD_HOOK if present
      if (parsedResponse.adHook) {
        console.log('🎯 AD_HOOK detected, triggering ad slot');
        const adSlot = await adManager.handleAdHook(user.id, currentThreadId, {
          processingTime: 5, // Mock processing time
          complexity: 'medium'
        });
        
        if (adSlot) {
          console.log('✅ Ad slot created:', adSlot.id);
          // You can show the ad UI here
        }
      }

      // Update stage if changed
      if (parsedResponse.stage !== currentStage) {
        setCurrentStage(parsedResponse.stage);
        // Update thread stage in database
        const threadManager = new PersistentThreadManager();
        await threadManager.updateThreadStage(currentThreadId, parsedResponse.stage);
      }

      // Add assistant response to display
      const assistantMessage = {
        role: 'assistant' as const,
        content: parsedResponse.content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Handle questions if present
      if (parsedResponse.questions && parsedResponse.questions.length > 0) {
        // Convert questions to current turn format
        const questionBlock: QuestionBlock = {
          id: `q_${Date.now()}`,
          type: parsedResponse.questions[0].type,
          progress: parsedResponse.questions[0].progress || '1/1',
          questions: parsedResponse.questions.map(q => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options,
            required: true
          }))
        };
        
        const turn: AssistantTurn = {
          id: `turn_${Date.now()}`,
          message: parsedResponse.content,
          questionBlock: questionBlock,
          stage: parsedResponse.stage,
          timestamp: new Date()
        };
        
        setCurrentTurn(turn);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message');
      
      // Add error message to display
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle response submission
  const handleResponseSubmit = async () => {
    if (!responses.length || !workerRef.current || !user || !currentThreadId) return;

    setIsLoading(true);

    try {
      const response = await workerRef.current.processUserResponses(
        currentThreadId,
        responses,
        user,
        {}, // policies
        {}  // feature flags
      );

      setCurrentTurn(response.turn);
      setResponses([]);
    } catch (error: any) {
      console.error('Error submitting responses:', error);
      setError(error.message || 'Failed to submit responses');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle response change
  const handleResponseChange = (response: UserResponse) => {
    setResponses(prev => {
      const existing = prev.find(r => r.questionId === response.questionId);
      if (existing) {
        return prev.map(r => r.questionId === response.questionId ? response : r);
      } else {
        return [...prev, response];
      }
    });
  };

  // Handle language change
  const handleLanguageChange = (newLanguage: Lang) => {
    // Import and use unified language setting (syncs across all: onboarding, web pages, main chat)
    import('@/lib/language-detection').then(({ setLanguageForAll }) => {
      setLanguageForAll(newLanguage);
    });
    setLanguage(newLanguage);
    setShowLanguageSelector(false);
    setToast({ type: 'success', message: `Language changed to ${newLanguage}` });
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        handleSendMessage(inputValue.trim());
        setInputValue('');
      }
    }
  };

  // Handle voice transcription
  const handleVoiceTranscription = async () => {
    if (!audioBlob) return;

    setIsLoading(true);
    setToast({ type: 'info', message: 'Converting voice to text...' });

    try {
      // Map language codes to transcription service language codes
      const languageMapping: { [key: string]: string } = {
        'en': 'en',
        'hi': 'hi',
        'bn': 'bn',
        'ar': 'ar',
        'ta': 'ta',
        'zh': 'zh',
        'ja': 'ja',
        'ru': 'ru',
        'es': 'es',
        'de': 'de',
        'fr': 'fr',
        'pt': 'pt'
      };

      const transcriptionLanguage = languageMapping[language] || 'en';

      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.webm');
      formData.append('options', JSON.stringify({
        language: transcriptionLanguage,
        model: 'whisper-1',
        responseFormat: 'verbose_json'
      }));

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 RAW API RESPONSE:', data);
      console.log('🔍 RESPONSE KEYS:', Object.keys(data));
      console.log('🔍 data.transcription value:', data.transcription);
      console.log('🔍 data.transcription type:', typeof data.transcription);
      
      // Quick test - let's see what we actually get
      console.log('🧪 TESTING PARSING:');
      console.log('  data.transcription exists?', !!data.transcription);
      console.log('  data.transcription value:', data.transcription);
      console.log('  data.transcription length:', data.transcription?.length);
      console.log('  data.text exists?', !!data.text);
      console.log('  data.text value:', data.text);
      
      // Simple and direct approach
      let transcribedText = '';
      
      // The API response shows: {transcription: 'Hello, can you hear me?', ...}
      if (data.transcription && typeof data.transcription === 'string') {
        transcribedText = data.transcription.trim();
        console.log('✅ Found transcription:', transcribedText);
      } else if (data.text && typeof data.text === 'string') {
        transcribedText = data.text.trim();
        console.log('✅ Found text:', transcribedText);
      } else {
        // Fallback
        transcribedText = 'Could not transcribe audio';
        console.log('❌ No transcription found in response');
        console.log('Available fields:', Object.keys(data));
      }
      
      console.log('🎯 FINAL TRANSCRIPTION:', transcribedText);
      
      console.log('📝 Setting input value to:', transcribedText);
      setInputValue(transcribedText);
      console.log('✅ Input value set successfully');
      
      setToast({ type: 'success', message: 'Voice message converted to text!' });
      
    } catch (error: any) {
      console.error('Transcription error:', error);
      setToast({ type: 'error', message: 'Failed to transcribe voice message' });
    } finally {
      setIsLoading(false);
      clearRecording();
    }
  };

  // Handle voice recording start (push-to-talk)
  const handleVoiceStart = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      startRecording();
      setIsRecording(true);
      setToast({ type: 'info', message: 'Recording... Speak now!' });
      console.log('🎤 Voice start triggered');
    } catch (error) {
      console.error('Error starting voice:', error);
      setToast({ type: 'error', message: 'Failed to start recording' });
    }
  };

  // Handle voice recording stop (release-to-transcribe)
  const handleVoiceStop = (e?: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      console.log('🛑 Voice stop triggered, isRecording:', isRecording, 'voiceRecording:', voiceRecording);
      stopRecording();
      setIsRecording(false);
      setToast({ type: 'info', message: 'Processing voice...' });
      // Let useEffect handle the transcription when audioBlob becomes available
    } catch (error) {
      console.error('Error stopping voice:', error);
    }
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    if (!currentThreadId) return;

    try {
      const response = await fetch('/api/chat/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: currentThreadId,
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drishiq-chat-${currentThreadId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setToast({ type: 'success', message: 'PDF exported successfully!' });
    } catch (error: any) {
      console.error('PDF export error:', error);
      setToast({ type: 'error', message: 'Failed to export PDF' });
    }
  };

  const languageLabel = (lang: string) => {
    const labels: { [key: string]: string } = {
      'en': '🇺🇸 EN',
      'hi': '🇮🇳 हिंदी',
      'bn': '🇧🇩 বাংলা',
      'ar': '🇸🇦 العربية',
      'ta': '🇮🇳 தமிழ்',
      'zh': '🇨🇳 中文',
      'ja': '🇯🇵 日本語',
      'ru': '🇷🇺 Русский',
      'es': '🇪🇸 Español',
      'de': '🇩🇪 Deutsch',
      'fr': '🇫🇷 Français',
      'pt': '🇵🇹 Português'
    };
    return labels[lang] || '🇺🇸 EN';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Messages */}
          <Card className="min-h-96 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Streaming content */}
              {isStreaming && streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
                    <p className="text-sm">{streamingContent}</p>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </Card>

          {/* Current turn questions */}
          {currentTurn && currentTurn.questionBlocks.length > 0 && (
            <Card>
              <MCQGroup
                blocks={currentTurn.questionBlocks.map(convertQuestionBlockToMCQBlock)}
                responses={responses}
                onResponseChange={handleResponseChange}
                onSubmit={handleResponseSubmit}
              />
            </Card>
          )}

          {/* Input with mic button inside */}
          <div className="relative" style={{ zIndex: 100000 }}>
            <Card>
              <div className="flex space-x-4">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={isRecording ? `Recording${recordingDots}` : "Type your message or hold mic to speak..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <button
                  onMouseDown={handleVoiceStart}
                  onMouseUp={handleVoiceStop}
                  onMouseLeave={(e) => {
                    // Only stop if actually recording to prevent accidental stops
                    if (voiceRecording) {
                      handleVoiceStop(e);
                    }
                  }}
                  onTouchStart={handleVoiceStart}
                  onTouchEnd={handleVoiceStop}
                  disabled={isLoading || isProcessing}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                    voiceRecording 
                      ? 'bg-red-100 text-red-600 animate-pulse' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ zIndex: 100001 }}
                  title={voiceRecording ? 'Recording... Release to stop' : 'Hold to speak, release to transcribe'}
                >
                  {voiceRecording ? '🔴' : '🎤'}
                </button>
              </div>
              
              {/* Language dropdown */}
              <div className="relative" style={{ zIndex: 100001 }}>
                <button
                  onClick={() => setShowLanguageSelector(true)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  style={{ zIndex: 100001 }}
                >
                  {languageLabel(language)}
                </button>
              </div>
              
              {/* Send button */}
              <button
                onClick={() => {
                  if (inputValue.trim()) {
                    handleSendMessage(inputValue.trim());
                    setInputValue('');
                  }
                }}
                disabled={isLoading || !inputValue.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ zIndex: 100001 }}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
              
              {/* PDF Export button */}
              <button
                onClick={handleExportPDF}
                disabled={!currentThreadId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ zIndex: 100001 }}
                title="Export chat as PDF"
              >
                📄 PDF
              </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Language selector */}
      <Sheet
        isOpen={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        title="Select Language"
        side="right"
        className="relative z-[100000]"
      >
        <div className="space-y-3">
          {(['en', 'hi', 'bn', 'es', 'pt', 'ar', 'de', 'fr', 'ja', 'ru', 'ta', 'zh'] as Lang[]).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                language === lang
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">
                  {lang === 'en' && '🇺🇸'}
                  {lang === 'hi' && '🇮🇳'}
                  {lang === 'bn' && '🇧🇩'}
                  {lang === 'es' && '🇪🇸'}
                  {lang === 'pt' && '🇵🇹'}
                  {lang === 'ar' && '🇸🇦'}
                  {lang === 'de' && '🇩🇪'}
                  {lang === 'fr' && '🇫🇷'}
                  {lang === 'ja' && '🇯🇵'}
                  {lang === 'ru' && '🇷🇺'}
                  {lang === 'ta' && '🇮🇳'}
                  {lang === 'zh' && '🇨🇳'}
                </span>
                <span className="font-medium">{lang.toUpperCase()}</span>
              </div>
            </button>
          ))}
        </div>
      </Sheet>

      {/* Toast notifications */}
      {toast && (
        <ToastBanner
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ChatPage;