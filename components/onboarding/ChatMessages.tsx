'use client';

import React from 'react';
import Image from 'next/image';
import type { OnboardingSnapshot } from '@/lib/onboarding-concierge/types';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id?: string;
}

export interface ChatMessagesProps {
  messages: Message[];
  answers: Record<string, string | string[]>;
  snapshot: OnboardingSnapshot;
  isLoading: boolean;
  renderAssistantContent: (content: string) => React.ReactNode;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({
  messages,
  answers,
  snapshot,
  isLoading,
  renderAssistantContent,
  messagesEndRef,
}: ChatMessagesProps) {
  const getAvatarForAssistant = () => {
    const genderKey = Object.keys(answers).find((key) => {
      const keyLower = key.toLowerCase();
      const value = answers[key]?.toString().toLowerCase() || '';
      return keyLower.includes('gender') || value.match(/^(male|female|other|m|f)$/i);
    });

    let gender = genderKey ? (answers[genderKey] as string)?.toLowerCase() : null;

    if (!gender && snapshot?.questionAnswers?.gender) {
      gender = snapshot.questionAnswers.gender.toLowerCase();
    }

    const isFemale = gender === 'female' || gender === 'f';
    const avatarSrc = isFemale ? '/assets/avatar/users/girlcurly.png' : '/assets/avatar/users/avatar confide.png';

    return (
      <Image
        src={avatarSrc}
        alt="DrishiQ Guide"
        width={32}
        height={32}
        className="w-full h-full object-cover rounded-full"
        unoptimized
      />
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
      {messages.length === 0 && isLoading && (
        <div className="flex justify-start items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-[#0B4422]">
            <Image
              src="/assets/avatar/users/avatar confide.png"
              alt="DrishiQ Guide"
              width={32}
              height={32}
              className="w-full h-full object-cover rounded-full"
              unoptimized
            />
          </div>
          <div className="bg-[#E6F3EC] text-[#0B4422] px-4 py-2 rounded-lg border border-[#0B4422]/20">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0B4422]"></div>
              <span className="text-sm font-medium">DrishiQ is thinking...</span>
            </div>
          </div>
        </div>
      )}

      {messages.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 py-8">
          <p>Starting conversation...</p>
        </div>
      )}

      {messages.map((msg, index) => (
        <div
          key={msg.id || index}
          className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'assistant' ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-[#0B4422]">
              {getAvatarForAssistant()}
            </div>
          ) : (
            <div className="w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">G</span>
            </div>
          )}
          <div
            className={`max-w-[75%] px-4 py-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-[#0B4422] text-white'
                : 'bg-[#E6F3EC] text-[#0B4422] border border-[#0B4422]/20'
            }`}
            style={{ userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text', msUserSelect: 'text' }}
          >
            {msg.role === 'assistant' ? (
              <>{renderAssistantContent(msg.content)}</>
            ) : (
              <div className="text-sm whitespace-pre-wrap break-words select-text">{msg.content}</div>
            )}
            <div
              className={`text-xs mt-1 opacity-70 ${msg.role === 'user' ? 'text-white' : 'text-gray-500'}`}
            >
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}

      {isLoading && messages.length > 0 && (
        <div className="flex justify-start items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-[#0B4422]">
            {getAvatarForAssistant()}
          </div>
          <div className="bg-[#E6F3EC] text-[#0B4422] px-4 py-2 rounded-lg border border-[#0B4422]/20">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0B4422]"></div>
              <span className="text-sm font-medium">DrishiQ is thinking...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
