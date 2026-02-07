'use client';

import React from 'react';

export interface InputBarProps {
  inputValue: string;
  onInputChange: (v: string) => void;
  onInputActivity?: () => void;
  onSend: () => void;
  isLoading: boolean;
  messagesLength: number;
  startVoiceRecording: () => void;
  isVoiceRecording: boolean;
  recordingDuration: number;
}

export function InputBar({
  inputValue,
  onInputChange,
  onInputActivity,
  onSend,
  isLoading,
  messagesLength,
  startVoiceRecording,
  isVoiceRecording,
  recordingDuration,
}: InputBarProps) {
  return (
    <div className="p-4 border-t border-gray-200 bg-[#F9FCFA]">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            onInputChange(e.target.value);
            onInputActivity?.();
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={isLoading && messagesLength === 0 ? 'Starting conversation...' : 'Type your message...'}
          className="flex-1 px-4 py-2.5 border border-[#0B4422] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] bg-white text-[#0B4422] placeholder-gray-400"
          disabled={isLoading && messagesLength === 0}
        />
        <button
          onClick={startVoiceRecording}
          className={`p-2.5 rounded-lg transition-colors ${
            isVoiceRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#0B4422] text-white hover:bg-[#10B981]'
          }`}
          title={isVoiceRecording ? `Recording... ${recordingDuration}s` : 'Start voice recording'}
          disabled={isLoading}
        >
          {isVoiceRecording ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM12 9a1 1 0 10-2 0v2a1 1 0 102 0V9z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
        <button
          onClick={onSend}
          disabled={!inputValue.trim() || isLoading}
          className="px-6 py-2.5 bg-[#0B4422] text-white rounded-lg hover:bg-[#10B981] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Send
        </button>
      </div>
      {isVoiceRecording && (
        <div className="mt-2 text-xs text-[#0B4422] flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          Recording... {recordingDuration}s
        </div>
      )}
    </div>
  );
}
