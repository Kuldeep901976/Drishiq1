// MCQ (Multiple Choice Question) components for chat interface

import React, { useState } from 'react';
import { Card, Chip, ProgressPill } from './components';

export interface MCQOption {
  id: string;
  text: string;
  value: string;
}

export interface MCQQuestion {
  id: string;
  text: string;
  type: 'single' | 'multi';
  options: MCQOption[];
  required?: boolean;
}

export interface MCQBlock {
  id: string;
  questions: MCQQuestion[];
  progress: string; // "k/N" format
  type: 'single' | 'multi';
}

export interface MCQResponse {
  questionId: string;
  selected: string[];
  extra?: string;
  transcript?: string;
}

// Individual MCQ component
export interface MCQProps {
  question: MCQQuestion;
  value: string[];
  onChange: (value: string[]) => void;
  onExtraChange?: (extra: string) => void;
  showExtra?: boolean;
  className?: string;
}

export const MCQ: React.FC<MCQProps> = ({
  question,
  value,
  onChange,
  onExtraChange,
  showExtra = false,
  className = ''
}) => {
  const [extraText, setExtraText] = useState('');

  const handleOptionChange = (optionValue: string) => {
    if (question.type === 'single') {
      onChange([optionValue]);
    } else {
      // Multi-select
      if (value.includes(optionValue)) {
        onChange(value.filter(v => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    }
  };

  const handleExtraChange = (text: string) => {
    setExtraText(text);
    onExtraChange?.(text);
  };

  return (
    <Card className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {question.text}
        </h3>
        {question.required && (
          <span className="text-sm text-red-500">* Required</span>
        )}
      </div>

      <div className="space-y-3">
        {question.options.map((option) => (
          <label
            key={option.id}
            className={`
              flex items-start space-x-3 p-3 rounded-lg border cursor-pointer
              transition-all duration-200 hover:bg-gray-50
              ${value.includes(option.value) 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200'
              }
            `}
          >
            <input
              type={question.type === 'single' ? 'radio' : 'checkbox'}
              name={question.id}
              value={option.value}
              checked={value.includes(option.value)}
              onChange={() => handleOptionChange(option.value)}
              className={`
                mt-1 ${question.type === 'single' ? 'text-green-600' : 'text-green-600'}
                focus:ring-green-500 focus:ring-2
              `}
            />
            <span className="text-gray-700 flex-1">{option.text}</span>
          </label>
        ))}
      </div>

      {/* Extra text input - only shown when an option is selected */}
      {showExtra && value.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional details (optional)
          </label>
          <textarea
            value={extraText}
            onChange={(e) => handleExtraChange(e.target.value)}
            placeholder="Share any additional thoughts or context..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 resize-none"
            rows={3}
          />
        </div>
      )}
    </Card>
  );
};

// MCQ Block component
export interface MCQBlockProps {
  block: MCQBlock;
  responses: MCQResponse[];
  onResponseChange: (response: MCQResponse) => void;
  className?: string;
}

export const MCQBlock: React.FC<MCQBlockProps> = ({
  block,
  responses,
  onResponseChange,
  className = ''
}) => {
  const getResponseForQuestion = (questionId: string): MCQResponse => {
    return responses.find(r => r.questionId === questionId) || {
      questionId,
      selected: [],
      extra: '',
      transcript: ''
    };
  };

  const handleResponseChange = (questionId: string, selected: string[], extra?: string) => {
    const response: MCQResponse = {
      questionId,
      selected,
      extra,
      transcript: ''
    };
    onResponseChange(response);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <ProgressPill
          current={parseInt(block.progress.split('/')[0])}
          total={parseInt(block.progress.split('/')[1])}
          showPercentage={false}
        />
        <Chip variant="primary" size="sm">
          {block.type === 'single' ? 'Single Choice' : 'Multiple Choice'}
        </Chip>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {block.questions.map((question) => {
          const response = getResponseForQuestion(question.id);
          return (
            <MCQ
              key={question.id}
              question={question}
              value={response.selected}
              onChange={(selected) => handleResponseChange(question.id, selected)}
              onExtraChange={(extra) => handleResponseChange(question.id, response.selected, extra)}
              showExtra={true}
            />
          );
        })}
      </div>
    </div>
  );
};

// MCQ Group component for multiple blocks
export interface MCQGroupProps {
  blocks: MCQBlock[];
  responses: MCQResponse[];
  onResponseChange: (response: MCQResponse) => void;
  onSubmit?: () => void;
  className?: string;
}

export const MCQGroup: React.FC<MCQGroupProps> = ({
  blocks,
  responses,
  onResponseChange,
  onSubmit,
  className = ''
}) => {
  const totalQuestions = blocks.reduce((sum, block) => sum + block.questions.length, 0);
  const answeredQuestions = responses.filter(r => r.selected.length > 0).length;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Overall progress */}
      <div className="text-center">
        <ProgressPill
          current={answeredQuestions}
          total={totalQuestions}
          showPercentage={true}
          className="text-lg"
        />
        <p className="text-sm text-gray-600 mt-2">
          {answeredQuestions} of {totalQuestions} questions answered
        </p>
      </div>

      {/* Question blocks */}
      <div className="space-y-8">
        {blocks.map((block) => (
          <MCQBlock
            key={block.id}
            block={block}
            responses={responses}
            onResponseChange={onResponseChange}
          />
        ))}
      </div>

      {/* Submit button */}
      {onSubmit && (
        <div className="text-center">
          <button
            onClick={onSubmit}
            disabled={answeredQuestions < totalQuestions}
            className={`
              px-8 py-3 rounded-lg font-medium transition-all duration-200
              ${answeredQuestions >= totalQuestions
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

