'use client';

import React from 'react';
import { parseInteractiveBlocks } from '@/lib/onboarding-concierge/parseInteractiveBlocks';

export interface InteractiveBlocksProps {
  content: string;
  answers: Record<string, string | string[]>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>;
  expandedOptions: Record<string, { expanded: boolean; text: string }>;
  setExpandedOptions: React.Dispatch<React.SetStateAction<Record<string, { expanded: boolean; text: string }>>>;
  onFormAnswers: (formAnswers: Record<string, string | string[]>) => Promise<void>;
  onSelectOption: (optionId: string, expandedText?: string) => Promise<void>;
  onToggleOptionExpansion: (optionKey: string) => void;
  startOptionVoiceRecording: (optionKey: string) => void;
  optionVoiceRecording: Record<string, boolean>;
  threadId: string | null;
  isLoading: boolean;
  setError: (v: string) => void;
}

export function InteractiveBlocks({
  content,
  answers,
  setAnswers,
  expandedOptions,
  setExpandedOptions,
  onFormAnswers,
  onSelectOption,
  onToggleOptionExpansion,
  startOptionVoiceRecording,
  optionVoiceRecording,
  threadId,
  isLoading,
  setError,
}: InteractiveBlocksProps) {
  const blocks = parseInteractiveBlocks(content);

  if (blocks.length === 0) {
    return (
      <div className="prose prose-sm max-w-none whitespace-pre-line">
        {content}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {content.split('<BLOCK')[0].trim() && (
        <div className="prose prose-sm max-w-none mb-4 whitespace-pre-line">
          {content.split('<BLOCK')[0].trim()}
        </div>
      )}
      {blocks.map((block: any, blockIndex: number) => {
        if (block.type === 'onboarding_deep_intake_round' && block.questions) {
          return (
            <div key={block.id || blockIndex} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              {block.title && (
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-800">{block.title}</h3>
                  {block.description && <p className="text-sm text-gray-600 mt-1">{block.description}</p>}
                  {block.roundNumber && block.totalRounds && (
                    <p className="text-xs text-gray-500 mt-1">
                      Round {block.roundNumber} of {block.totalRounds}
                    </p>
                  )}
                </div>
              )}
              {block.questions.map((question: any, qIndex: number) => {
                const questionKey = question.id || `q_${qIndex}`;
                const answerKey = `${block.id}_${questionKey}`;
                return (
                  <div key={questionKey} className="space-y-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      {question.label}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {question.type === 'text' ? (
                      <textarea
                        value={(answers[answerKey] as string) || ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [answerKey]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows={3}
                        placeholder="Type your answer..."
                      />
                    ) : (
                      <div className="space-y-2">
                        {question.options?.map((opt: any) => {
                          const optionId = opt.id || opt.label;
                          const optionLabel = opt.label || opt.id;
                          const isSelected =
                            question.type === 'multiple_choice'
                              ? Array.isArray(answers[answerKey]) && (answers[answerKey] as string[]).includes(optionId)
                              : answers[answerKey] === optionId;
                          const optionKey = `${answerKey}_${optionId}`;
                          const isExpanded = expandedOptions[optionKey]?.expanded || false;
                          const optionText = expandedOptions[optionKey]?.text || '';
                          return (
                            <div key={optionId} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (question.type === 'multiple_choice') {
                                      const current = Array.isArray(answers[answerKey])
                                        ? (answers[answerKey] as string[])
                                        : [];
                                      setAnswers((prev) => ({
                                        ...prev,
                                        [answerKey]: isSelected
                                          ? current.filter((a) => a !== optionId)
                                          : [...current, optionId],
                                      }));
                                    } else {
                                      setAnswers((prev) => ({ ...prev, [answerKey]: optionId }));
                                    }
                                  }}
                                  className={`flex-1 text-left px-4 py-2 rounded-lg border transition-colors ${
                                    isSelected
                                      ? 'bg-[#E6F3EC] border-[#0B4422] text-[#0B4422]'
                                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {optionLabel}
                                </button>
                                {isSelected && (
                                  <button
                                    onClick={() => onToggleOptionExpansion(optionKey)}
                                    className="p-2 bg-[#0B4422] text-white rounded-lg hover:bg-[#10B981] transition-colors"
                                    title="Add details"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? 'M5 12h14' : 'M12 5v14m-7-7h14'} />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              {isSelected && isExpanded && (
                                <div className="flex gap-2 items-center pl-2">
                                  <input
                                    type="text"
                                    value={optionText}
                                    onChange={(e) =>
                                      setExpandedOptions((prev) => ({
                                        ...prev,
                                        [optionKey]: { expanded: true, text: e.target.value },
                                      }))
                                    }
                                    placeholder="Add details..."
                                    className="flex-1 px-3 py-2 border border-[#0B4422] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] bg-white text-[#0B4422]"
                                  />
                                  <button
                                    onClick={() => startOptionVoiceRecording(optionKey)}
                                    className={`p-2 rounded-lg transition-colors ${
                                      optionVoiceRecording[optionKey]
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : 'bg-[#0B4422] text-white hover:bg-[#10B981]'
                                    }`}
                                    title="Voice input"
                                  >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => {
                  const blockAnswers: Record<string, string | string[]> = {};
                  block.questions.forEach((q: any) => {
                    const questionKey = q.id || `q_${block.questions.indexOf(q)}`;
                    const answerKey = `${block.id}_${questionKey}`;
                    const answerValue = answers[answerKey];
                    if (answerValue) blockAnswers[questionKey] = answerValue;
                  });
                  const allRequiredAnswered = block.questions.every((q: any) => {
                    if (!q.required) return true;
                    const questionKey = q.id || `q_${block.questions.indexOf(q)}`;
                    return answers[`${block.id}_${questionKey}`];
                  });
                  if (allRequiredAnswered) {
                    onFormAnswers(blockAnswers);
                  } else {
                    setError('Please answer all required questions');
                  }
                }}
                className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={
                  !block.questions.every((q: any) => {
                    if (!q.required) return true;
                    const questionKey = q.id || `q_${block.questions.indexOf(q)}`;
                    return answers[`${block.id}_${questionKey}`];
                  })
                }
              >
                Continue
              </button>
            </div>
          );
        }

        if (block.type === 'onboarding_collect_info' && block.questions) {
          return (
            <div key={block.id || blockIndex} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              {block.title && (
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-800">{block.title}</h3>
                </div>
              )}
              {block.questions.map((question: any, qIndex: number) => {
                const questionKey = question.id || `q_${qIndex}`;
                const answerKey = `${block.id}_${questionKey}`;
                return (
                  <div key={questionKey} className="space-y-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      {question.label}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {question.type === 'text' ? (
                      <input
                        type="text"
                        value={(answers[answerKey] as string) || ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [answerKey]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder={question.placeholder || 'Enter your answer...'}
                      />
                    ) : (
                      <div className="space-y-2">
                        {question.options?.map((opt: any) => {
                          const optionId = opt.id || opt.label;
                          const optionLabel = opt.label || opt.id;
                          const isSelected = answers[answerKey] === optionId;
                          const optionKey = `${answerKey}_${optionId}`;
                          const isExpanded = expandedOptions[optionKey]?.expanded || false;
                          const optionText = expandedOptions[optionKey]?.text || '';
                          return (
                            <div key={optionId} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setAnswers((prev) => ({ ...prev, [answerKey]: optionId }))}
                                  className={`flex-1 text-left px-4 py-2 rounded-lg border transition-colors ${
                                    isSelected
                                      ? 'bg-[#E6F3EC] border-[#0B4422] text-[#0B4422] font-medium'
                                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-[#E6F3EC]'
                                  }`}
                                >
                                  {optionLabel}
                                </button>
                                {isSelected && (
                                  <button
                                    onClick={() => onToggleOptionExpansion(optionKey)}
                                    className="p-2 bg-[#0B4422] text-white rounded-lg hover:bg-[#10B981] transition-colors"
                                    title="Add details"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? 'M5 12h14' : 'M12 5v14m-7-7h14'} />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              {isSelected && isExpanded && (
                                <div className="flex gap-2 items-center pl-2">
                                  <input
                                    type="text"
                                    value={optionText}
                                    onChange={(e) =>
                                      setExpandedOptions((prev) => ({
                                        ...prev,
                                        [optionKey]: { expanded: true, text: e.target.value },
                                      }))
                                    }
                                    placeholder="Add details..."
                                    className="flex-1 px-3 py-2 border border-[#0B4422] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] bg-white text-[#0B4422]"
                                  />
                                  <button
                                    onClick={() => startOptionVoiceRecording(optionKey)}
                                    className={`p-2 rounded-lg transition-colors ${
                                      optionVoiceRecording[optionKey]
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : 'bg-[#0B4422] text-white hover:bg-[#10B981]'
                                    }`}
                                    title="Voice input"
                                  >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => {
                  const blockAnswers: Record<string, string | string[]> = {};
                  block.questions.forEach((q: any) => {
                    const questionKey = q.id || `q_${block.questions.indexOf(q)}`;
                    const answerKey = `${block.id}_${questionKey}`;
                    const answerValue = answers[answerKey];
                    if (answerValue) blockAnswers[questionKey] = answerValue;
                  });
                  const allRequiredAnswered = block.questions.every((q: any) => {
                    if (!q.required) return true;
                    const questionKey = q.id || `q_${block.questions.indexOf(q)}`;
                    return answers[`${block.id}_${questionKey}`];
                  });
                  if (allRequiredAnswered) {
                    onFormAnswers(blockAnswers);
                  } else {
                    setError('Please answer all required questions');
                  }
                }}
                className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={
                  !block.questions.every((q: any) => {
                    if (!q.required) return true;
                    const questionKey = q.id || `q_${block.questions.indexOf(q)}`;
                    return answers[`${block.id}_${questionKey}`];
                  })
                }
              >
                Continue
              </button>
            </div>
          );
        }

        if (block.type === 'onboarding_next_steps' && block.options) {
          return (
            <div key={block.id || blockIndex} className="bg-white border border-[#0B4422]/30 rounded-lg p-4 space-y-3 shadow-sm">
              {block.title && <h3 className="font-semibold text-[#0B4422] mb-2">{block.title}</h3>}
              {block.description && <p className="text-sm text-[#0B4422]/70 mb-4">{block.description}</p>}
              {block.options.map((option: any) => {
                const optionKey = `next_steps_${option.id}`;
                const isExpanded = expandedOptions[optionKey]?.expanded || false;
                const optionText = expandedOptions[optionKey]?.text || '';
                return (
                  <div key={option.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectOption(option.id, expandedOptions[optionKey]?.text)}
                        disabled={!threadId || isLoading}
                        className="flex-1 text-left px-4 py-3 rounded-lg border border-[#0B4422] bg-white hover:bg-[#E6F3EC] transition-colors"
                      >
                        <div className="font-medium text-[#0B4422]">{option.label}</div>
                        {option.description && <div className="text-sm text-[#0B4422]/70 mt-1">{option.description}</div>}
                      </button>
                      <button
                        onClick={() => onToggleOptionExpansion(optionKey)}
                        className="p-2 bg-[#0B4422] text-white rounded-lg hover:bg-[#10B981] transition-colors"
                        title="Add details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? 'M5 12h14' : 'M12 5v14m-7-7h14'} />
                        </svg>
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="flex gap-2 items-center pl-2">
                        <input
                          type="text"
                          value={optionText}
                          onChange={(e) =>
                            setExpandedOptions((prev) => ({
                              ...prev,
                              [optionKey]: { expanded: true, text: e.target.value },
                            }))
                          }
                          placeholder="Add details..."
                          className="flex-1 px-3 py-2 border border-[#0B4422] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] bg-white text-[#0B4422]"
                        />
                        <button
                          onClick={() => startOptionVoiceRecording(optionKey)}
                          className={`p-2 rounded-lg transition-colors ${
                            optionVoiceRecording[optionKey]
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-[#0B4422] text-white hover:bg-[#10B981]'
                          }`}
                          title="Voice input"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        if (block.type === 'onboarding_question_bundle' && block.questions) {
          return (
            <div key={block.id || blockIndex} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              {block.title && <h3 className="font-semibold text-gray-800">{block.title}</h3>}
              {block.description && <p className="text-sm text-gray-600">{block.description}</p>}
              {block.questions.map((question: any, qIndex: number) => {
                const questionKey = question.id || `q_${qIndex}`;
                return (
                  <div key={questionKey} className="space-y-2">
                    <label className="block font-medium text-gray-700 text-sm">{question.label}</label>
                    <div className="space-y-2">
                      {question.options.map((opt: any) => {
                        const optionId = opt.id || opt.label;
                        const optionLabel = opt.label || opt.id;
                        const answerKey = `${block.id}_${questionKey}`;
                        const currentAnswer = answers[answerKey];
                        const isSelected = currentAnswer === optionId;
                        return (
                          <button
                            key={optionId}
                            onClick={() => setAnswers((prev) => ({ ...prev, [answerKey]: optionId }))}
                            className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
                              isSelected
                                ? 'bg-green-100 border-green-500 text-green-800'
                                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {optionLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <button
                onClick={() => {
                  const blockAnswers: Record<string, string> = {};
                  block.questions.forEach((q: any) => {
                    const questionKey = q.id || `q_${block.questions.indexOf(q)}`;
                    const answerKey = `${block.id}_${questionKey}`;
                    const answerValue = answers[answerKey];
                    if (answerValue) {
                      blockAnswers[questionKey] = typeof answerValue === 'string' ? answerValue : (answerValue as string[])[0];
                    }
                  });
                  const allAnswered = block.questions.every((q: any) => {
                    const questionKey = q.id || `q_${block.questions.indexOf(q)}`;
                    return answers[`${block.id}_${questionKey}`];
                  });
                  if (allAnswered) {
                    const structuredAnswers: Record<string, string> = {};
                    if (blockAnswers.nature) structuredAnswers.nature = blockAnswers.nature;
                    if (blockAnswers.duration) structuredAnswers.duration = blockAnswers.duration;
                    if (blockAnswers.intensity) structuredAnswers.intensity = blockAnswers.intensity;
                    onFormAnswers(structuredAnswers);
                  }
                }}
                className="mt-4 w-full bg-[#0B4422] text-white px-4 py-2 rounded-lg hover:bg-[#10B981] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                disabled={
                  !block.questions.every((q: any) => {
                    const questionKey = q.id || `q_${block.questions.indexOf(q)}`;
                    return answers[`${block.id}_${questionKey}`];
                  })
                }
              >
                Continue
              </button>
            </div>
          );
        }

        return (
          <div key={block.id || blockIndex} className="bg-white border border-gray-200 rounded-lg p-4">
            {block.question && <div className="font-semibold text-gray-800 mb-3">{block.question}</div>}
            <div className="space-y-2">
              {(block.options || []).map((option: string, optIndex: number) => (
                <button
                  key={optIndex}
                  onClick={() => {
                    const answerKey = block.id || `block_${blockIndex}`;
                    const currentAnswer = answers[answerKey];
                    const isSelected = Array.isArray(currentAnswer)
                      ? currentAnswer.includes(option)
                      : currentAnswer === option;
                    if (block.type === 'multiple') {
                      setAnswers((prev) => ({
                        ...prev,
                        [answerKey]: isSelected
                          ? (Array.isArray(currentAnswer) ? currentAnswer.filter((a) => a !== option) : [])
                          : [...(Array.isArray(currentAnswer) ? currentAnswer : currentAnswer ? [currentAnswer] : []), option],
                      }));
                    } else {
                      setAnswers((prev) => ({ ...prev, [answerKey]: option }));
                    }
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
                    (Array.isArray(answers[block.id || `block_${blockIndex}`])
                      ? (answers[block.id || `block_${blockIndex}`] as string[]).includes(option)
                      : answers[block.id || `block_${blockIndex}`] === option)
                      ? 'bg-[#E6F3EC] border-[#0B4422] text-[#0B4422] font-medium'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-[#E6F3EC]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {(block.options || []).length > 0 && (
              <button
                onClick={() => {
                  const answerKey = block.id || `block_${blockIndex}`;
                  const selectedAnswers = answers[answerKey];
                  if (selectedAnswers) {
                    onFormAnswers({ [answerKey]: selectedAnswers });
                  }
                }}
                className="mt-3 w-full bg-[#0B4422] text-white px-4 py-2 rounded-lg hover:bg-[#10B981] transition-colors font-medium"
                disabled={!answers[block.id || `block_${blockIndex}`]}
              >
                Continue
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
