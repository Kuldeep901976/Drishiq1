'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/drishiq-i18n';
import { getLanguageFromCookie } from '@/lib/language-detection';
import ReactMarkdown from 'react-markdown';
// NOTE: useVoiceRecording hook removed - main text box now uses browser's SpeechRecognition API directly
// Syntax highlighting disabled temporarily to avoid build issues with refractor
// Code blocks will render as plain formatted code

// Parse interactive blocks - same as original
function parseInteractiveBlocks(text: string | any) {
  // Convert to string if not already a string
  let textStr: string;
  if (typeof text === 'string') {
    textStr = text;
  } else if (text === null || text === undefined) {
    return [];
  } else if (typeof text === 'object') {
    // If it's an object, try to stringify it or extract a message/content property
    if (text.message) {
      textStr = String(text.message);
    } else if (text.content) {
      textStr = String(text.content);
    } else {
      textStr = JSON.stringify(text);
    }
  } else {
    textStr = String(text);
  }
  
  // Check if the string is empty or invalid
  if (!textStr || textStr.trim().length === 0) {
    return [];
  }
  
  const blockRegex = /<BLOCK[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/BLOCK>/gi;
  const qRegex = /<Q>([\s\S]*?)<\/Q>/i;
  const tRegex = /<TYPE>([\s\S]*?)<\/TYPE>/i;
  // Updated regex to handle OPTION with optional id attribute: <OPTION id="1">text</OPTION> or <OPTION>text</OPTION>
  const oRegex = /<OPTION[^>]*>([\s\S]*?)<\/OPTION>/gi;

  // Debug: Log input content
  const hasBlockTag = textStr.includes('<BLOCK');
  const hasCFQBlock = textStr.includes('<BLOCK id="cfq_1">');
  console.log('🔍 [BLOCK PARSER] Parsing content:', {
    textLength: textStr.length,
    hasBlockTag,
    hasCFQBlock,
    preview: textStr.substring(0, 200),
    containsBLOCK: textStr.includes('<BLOCK'),
    containsBLOCKEnd: textStr.includes('</BLOCK>')
  });

  const blocks: any[] = [];
  let match;
  while ((match = blockRegex.exec(textStr)) !== null) {
    const id = match[1];
    const inner = match[2];
    const question = (qRegex.exec(inner)?.[1] || "").trim();
    const type = (tRegex.exec(inner)?.[1] || "radio").trim();
    const options: string[] = [];
    // Reset regex lastIndex to ensure we parse all options in this block
    oRegex.lastIndex = 0;
    let opt;
    while ((opt = oRegex.exec(inner)) !== null) {
      const optionText = opt[1].trim();
      if (optionText) {
        options.push(optionText);
      }
    }
    blocks.push({ id, question, type, options });
    console.log('✅ [BLOCK PARSER] Parsed block:', { 
      id, 
      question: question.substring(0, 50), 
      type, 
      optionsCount: options.length,
      options: options.map(o => o.substring(0, 30)) // Log first 30 chars of each option
    });
  }
  
  // Log result
  if (blocks.length > 0) {
    console.log("✅ [BLOCK PARSER] Rendered Blocks:", blocks);
  } else {
    console.warn('⚠️ [BLOCK PARSER] No blocks found in content:', {
      textLength: textStr.length,
      hasBlockTag,
      hasCFQBlock,
      first200Chars: textStr.substring(0, 200),
      last200Chars: textStr.substring(Math.max(0, textStr.length - 200))
    });
  }
  return blocks;
}

function InteractiveBlockRenderer({ content, onSubmit, selectedLanguage, onBlocksPresent }: { content: string; onSubmit: (answers: Record<string, string | string[]>, optionDetails?: Record<string, string>) => void; selectedLanguage: string; onBlocksPresent?: (hasBlocks: boolean) => void }) {
  const { t } = useLanguage(); // Get translation function
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [expandedOptions, setExpandedOptions] = useState<Record<string, boolean>>({});
  const [optionDetails, setOptionDetails] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false); // Track if form has been submitted
  const recognitionRefs = useRef<Record<string, any>>({});
  
  const getSpeechRecognitionLang = (langCode: string) => {
    const langMap: Record<string, string> = {
      'en': 'en-US', 'hi': 'hi-IN', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
      'it': 'it-IT', 'pt': 'pt-PT', 'ru': 'ru-RU', 'ja': 'ja-JP', 'ko': 'ko-KR',
      'zh': 'zh-CN', 'ar': 'ar-SA'
    };
    return langMap[langCode] || 'en-US';
  };
  
  // Convert content to string if needed
  const contentStr = useMemo(() => {
    if (typeof content === 'string') {
      return content;
    } else if (content === null || content === undefined) {
      return '';
    } else if (typeof content === 'object') {
      // If it's an object, try to extract message/content property
      if (content.message) {
        return String(content.message);
      } else if (content.content) {
        return String(content.content);
      } else {
        return JSON.stringify(content);
      }
    } else {
      return String(content);
    }
  }, [content]);
  
  // Debug: Log content received by InteractiveBlockRenderer
  console.log('🔍 [BLOCK RENDERER] Received content:', {
    contentLength: contentStr?.length || 0,
    contentType: typeof content,
    hasBLOCK: contentStr?.includes('<BLOCK') || false,
    hasCFQBlock: contentStr?.includes('<BLOCK id="cfq_1">') || false,
    preview: contentStr?.substring(0, 200) || 'NO CONTENT',
  });
  
  // Extract text before first BLOCK tag (greeting text)
  const greetingText = useMemo(() => {
    if (!contentStr || contentStr.trim().length === 0) return '';
    const firstBlockIndex = contentStr.indexOf('<BLOCK');
    if (firstBlockIndex === -1) {
      // No blocks, return all content (remove termination markers)
      return contentStr.replace(/---END---[\s\S]*$/i, '').replace(/MACHINE_OK[\s\S]*$/i, '').trim();
    }
    // Extract text before first block
    const textBeforeBlock = contentStr.substring(0, firstBlockIndex).trim();
    // Remove termination markers
    return textBeforeBlock.replace(/---END---[\s\S]*$/i, '').replace(/MACHINE_OK[\s\S]*$/i, '').trim();
  }, [contentStr]);
  
  // Memoize blocks parsing to prevent infinite re-renders
  const blocks = useMemo(() => parseInteractiveBlocks(contentStr), [contentStr]);
  const [displayedBlocks, setDisplayedBlocks] = useState<any[]>([]);
  const [remainingBlocks, setRemainingBlocks] = useState<any[]>([]);
  
  // Filter and limit blocks based on option count
  useEffect(() => {
    console.log('🔍 Block filtering - Total blocks found:', blocks.length);
    console.log('🔍 Block details:', blocks.map(b => ({ id: b.id, question: b.question?.substring(0, 50), optionsCount: (b.options || []).length })));
    
    if (!blocks || blocks.length === 0) {
      setDisplayedBlocks([]);
      setRemainingBlocks([]);
      return;
    }
    
    // Check if any block has more than 6 options
    const hasBlockWithMoreThan6Options = blocks.some(b => (b.options || []).length > 6);
    console.log('🔍 Has block with > 6 options:', hasBlockWithMoreThan6Options);
    
    // Determine how many blocks to show
    let blocksToShow: any[] = [];
    let blocksToKeep: any[] = [];
    
    if (hasBlockWithMoreThan6Options) {
      // If any block has > 6 options, show 2 blocks at a time (or all if fewer than 2)
      const maxBlocks = Math.min(2, blocks.length);
      blocksToShow = blocks.slice(0, maxBlocks);
      blocksToKeep = blocks.slice(maxBlocks);
      console.log(`🔍 Showing ${maxBlocks} blocks (has > 6 options):`, blocksToShow.map(b => b.id));
    } else {
      // If all blocks have <= 6 options, show up to 3 blocks (or all if fewer than 3)
      const maxBlocks = Math.min(3, blocks.length);
      blocksToShow = blocks.slice(0, maxBlocks);
      blocksToKeep = blocks.slice(maxBlocks);
      console.log(`🔍 Showing ${maxBlocks} blocks (all <= 6 options):`, blocksToShow.map(b => b.id));
    }
    
    console.log('🔍 Blocks to show:', blocksToShow.length, 'Remaining:', blocksToKeep.length);
    
    // Only update if blocks actually changed
    setDisplayedBlocks(prev => {
      const prevIds = prev.map(b => b.id).sort().join(',');
      const newIds = blocksToShow.map(b => b.id).sort().join(',');
      if (prevIds === newIds) {
        console.log('🔍 Displayed blocks unchanged, skipping update');
        return prev;
      }
      console.log('🔍 Updating displayed blocks:', newIds);
      return blocksToShow;
    });
    
    setRemainingBlocks(prev => {
      const prevIds = prev.map(b => b.id).sort().join(',');
      const newIds = blocksToKeep.map(b => b.id).sort().join(',');
      if (prevIds === newIds) {
        console.log('🔍 Remaining blocks unchanged, skipping update');
        return prev;
      }
      console.log('🔍 Updating remaining blocks:', newIds);
      return blocksToKeep;
    });
  }, [blocks]);
  
  // Notify parent if blocks are present
  useEffect(() => {
    if (onBlocksPresent) {
      const hasBlocks = !isSubmitted && displayedBlocks && displayedBlocks.length > 0;
      onBlocksPresent(hasBlocks);
    }
  }, [displayedBlocks, isSubmitted, onBlocksPresent]);
  
  // Reset submitted state when new blocks arrive (new questions from API)
  useEffect(() => {
    if (blocks && blocks.length > 0 && isSubmitted) {
      console.log('🔄 New blocks received, resetting submitted state');
      setIsSubmitted(false);
    }
  }, [blocks, isSubmitted]);
  
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    // Render markdown content with react-markdown (app handles formatting)
    return (
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          components={{
            // Code blocks - plain formatting (syntax highlighting disabled to avoid build issues)
            code({ node, inline, className, children, ...props }: any) {
              if (inline) {
                return (
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                );
              }
              // Code block (not inline)
              return (
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-2">
                  <code className="text-sm font-mono" {...props}>
                    {String(children).replace(/\n$/, '')}
                  </code>
                </pre>
              );
            },
            // Styled headings
            h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-semibold mt-2 mb-1">{children}</h3>,
            // Styled lists
            ul: ({ children }) => <ul className="list-disc pl-5 my-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 my-2">{children}</ol>,
            li: ({ children }) => <li className="my-1">{children}</li>,
            // Styled paragraphs
            p: ({ children }) => <p className="my-2">{children}</p>,
            // Styled blockquotes
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-green-500 pl-4 my-2 italic text-gray-700">
                {children}
              </blockquote>
            ),
            // Styled links
            a: ({ href, children }) => (
              <a href={href} className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            // Styled tables
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border border-gray-300">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold">{children}</th>
            ),
            td: ({ children }) => (
              <td className="border border-gray-300 px-4 py-2">{children}</td>
            ),
          }}
        >
          {contentStr}
        </ReactMarkdown>
      </div>
    );
  }

  const handleSubmit = () => {
    // Prevent double submission
    if (isSubmitted) {
      console.warn('⚠️ Form already submitted, ignoring duplicate submission');
      return;
    }
    
    const finalAnswers: Record<string, string | string[]> = {};
    
    // Debug: Log current state
    console.log('🔍 handleSubmit - answers:', answers);
    console.log('🔍 handleSubmit - displayedBlocks:', displayedBlocks);
    console.log('🔍 handleSubmit - optionDetails:', optionDetails);
    
    displayedBlocks.forEach(block => {
      const answer = answers[block.id];
      console.log(`🔍 Block ${block.id} - answer:`, answer);
      
      if (answer) {
        if (block.type === 'text') {
          // Text input - answer is already a string
          finalAnswers[block.id] = answer as string;
        } else if (block.type === 'radio') {
          let finalAnswer = answer;
          // Handle "Others" option with text input
          if (answer === 'Others' || answer === 'others') {
            const othersText = optionDetails[`${block.id}_others`] || optionDetails[`${block.id}_Others`] || '';
            finalAnswer = othersText ? `Others: ${othersText}` : 'Others';
          } else {
            // Regular option with optional detail
            const detail = optionDetails[`${block.id}_${answer}`] || '';
            if (detail) finalAnswer = `${answer} (${detail})`;
          }
          finalAnswers[block.id] = finalAnswer;
        } else {
          // Checkbox type
          const selectedOptions = answer as string[];
          if (selectedOptions.length > 0) {
            const detailedOptions = selectedOptions.map(opt => {
              // Handle "Others" option with text input
              if (opt === 'Others' || opt === 'others') {
                const othersText = optionDetails[`${block.id}_others`] || optionDetails[`${block.id}_Others`] || '';
                return othersText ? `Others: ${othersText}` : 'Others';
              } else {
                // Regular option with optional detail
                const detail = optionDetails[`${block.id}_${opt}`] || '';
                return detail ? `${opt} (${detail})` : opt;
              }
            });
            finalAnswers[block.id] = detailedOptions;
          }
        }
      }
    });
    
    console.log('🔍 handleSubmit - finalAnswers:', finalAnswers);
    
    // Mark as submitted immediately to hide Submit button and blocks
    setIsSubmitted(true);
    
    // Clear all blocks immediately - this hides the questions and Submit button
    setAnswers({});
    setOptionDetails({});
    setExpandedOptions({});
    setDisplayedBlocks([]);
    setRemainingBlocks([]);
    
    // Notify parent that blocks are no longer present
    if (onBlocksPresent) {
      onBlocksPresent(false);
    }
    
    // Submit answers with option details (comments)
    onSubmit(finalAnswers, optionDetails);
  };

  const handleAnswerChange = (blockId: string, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [blockId]: value
    }));
  };

  const toggleExpansion = (optionKey: string) => {
    setExpandedOptions(prev => ({
      ...prev,
      [optionKey]: !prev[optionKey]
    }));
  };

  const handleDetailChange = (optionKey: string, detail: string) => {
    setOptionDetails(prev => ({
      ...prev,
      [optionKey]: detail
    }));
  };

  const startVoiceRecording = (optionKey: string) => {
    if (recognitionRefs.current[optionKey]) {
      try {
        recognitionRefs.current[optionKey].stop();
      } catch (e) {
        console.log('Error stopping recognition:', e);
      }
      delete recognitionRefs.current[optionKey];
    }
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getSpeechRecognitionLang(selectedLanguage);
      
      recognition.onstart = () => setIsRecording(optionKey);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const currentText = optionDetails[optionKey] || '';
        const newText = currentText ? `${currentText} ${transcript}` : transcript;
        handleDetailChange(optionKey, newText);
      };
      
      recognition.onerror = () => {
        setIsRecording(null);
        delete recognitionRefs.current[optionKey];
      };
      
      recognition.onend = () => {
        setIsRecording(null);
        delete recognitionRefs.current[optionKey];
      };
      
      recognitionRefs.current[optionKey] = recognition;
      
      try {
        recognition.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        alert('Failed to start voice recognition. Please check your microphone permissions.');
        setIsRecording(null);
        delete recognitionRefs.current[optionKey];
      }
    }
  };

  return (
    <div className="space-y-6 w-full max-w-4xl">
      {/* Display greeting text BEFORE blocks */}
      {greetingText && (
        <div className="text-sm whitespace-pre-wrap break-words text-gray-800">
          <ReactMarkdown>{greetingText}</ReactMarkdown>
        </div>
      )}
      
      {!isSubmitted && displayedBlocks.map((b) => (
        <div key={b.id} className="bg-white border rounded-lg p-4 shadow-sm">
          <p className="font-semibold text-sm mb-2.5">{b.question}</p>
          {/* Text input type - render textarea */}
          {b.type === 'text' ? (
            <div className="mt-2">
              <textarea
                value={(answers[b.id] as string) || ''}
                onChange={(e) => handleAnswerChange(b.id, e.target.value)}
                        placeholder={t('chat.chat.interactive.typeResponse')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                rows={4}
              />
            </div>
          ) : (
            <>
            {/* Regular Radio/Checkbox options */}
            {(b.options || []).map((opt: string, i: number) => {
            const optionKey = `${b.id}_${opt}`;
            const isExpanded = expandedOptions[optionKey];
            const isSelected = b.type === 'radio' ? answers[b.id] === opt : (answers[b.id] as string[])?.includes(opt);
            
            return (
              <div key={optionKey} className="mb-2.5 border border-gray-200 rounded-lg p-2 bg-gray-50">
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input 
                      type={b.type} 
                      name={b.id} 
                      value={opt} 
                      className="accent-indigo-600 w-4 h-4"
                      checked={isSelected}
                      onChange={(e) => {
                        if (b.type === 'radio') {
                          handleAnswerChange(b.id, e.target.value);
                          // Clear "Others" text input when a regular option is selected
                          const othersKey = `${b.id}_others`;
                          const othersOptionKey = `${b.id}_Others`;
                          if (optionDetails[othersKey] || optionDetails[othersOptionKey]) {
                            handleDetailChange(othersKey, '');
                            handleDetailChange(othersOptionKey, '');
                          }
                        } else {
                          const current = (answers[b.id] as string[]) || [];
                          handleAnswerChange(b.id, e.target.checked 
                            ? [...current, opt] 
                            : current.filter(x => x !== opt));
                        }
                      }}
                    />
                    <span className="font-medium text-sm">{opt}</span>
                  </label>
                  
                  {/* Show "+" button when checkbox is selected (for checkbox type only) */}
                  {b.type === 'checkbox' && isSelected && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setExpandedOptions(prev => ({
                          ...prev,
                          [optionKey]: !prev[optionKey]
                        }));
                      }}
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
                        title={expandedOptions[optionKey] ? t('chat.chat.interactive.collapse') : t('chat.chat.interactive.expand')}
                    >
                      <span className="text-base font-semibold leading-none">
                        {expandedOptions[optionKey] ? '−' : '+'}
                      </span>
                    </button>
                  )}
                </div>
                
                {/* Expandable text box - only show when expanded and selected */}
                {b.type === 'checkbox' && isSelected && expandedOptions[optionKey] && (
                  <div className="ml-5 mt-1.5 transition-all duration-300 ease-in-out">
                    {/* Textarea with mic icon inside */}
                    <div className="relative">
                      <textarea
                        value={optionDetails[optionKey] || ''}
                        onChange={(e) => handleDetailChange(optionKey, e.target.value)}
                        placeholder={t('chat.chat.interactive.addDetails')}
                        className="w-full px-2.5 py-1.5 pr-9 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        rows={2}
                      />
                      {/* Mic icon inside textbox (bottom-right corner) */}
                      <button
                        onClick={() => startVoiceRecording(optionKey)}
                        className={`absolute bottom-1.5 right-1.5 p-1 rounded-full transition-all duration-200 ${
                          isRecording === optionKey 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isRecording === optionKey ? 'Recording... Click to stop' : 'Click to record voice'}
                      >
                        <span className="text-sm">🎤</span>
                      </button>
                    </div>
                    {/* Character count - compact display (only if text exists) */}
                    {optionDetails[optionKey] && (
                      <div className="text-xs text-gray-400 mt-0.5 ml-0.5">
                        {optionDetails[optionKey].length} chars
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* "Others" option - always last */}
          {(() => {
            const othersKey = `${b.id}_others`;
            const othersOptionKey = `${b.id}_Others`;
            const isOthersSelected = b.type === 'radio' 
              ? answers[b.id] === 'Others' || answers[b.id] === 'others'
              : (answers[b.id] as string[])?.includes('Others') || (answers[b.id] as string[])?.includes('others');
            const othersText = optionDetails[othersKey] || optionDetails[othersOptionKey] || '';
            
            return (
              <div key={othersKey} className="mb-2.5 border border-gray-200 rounded-lg p-2 bg-gray-50">
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input 
                      type={b.type} 
                      name={b.id} 
                      value="Others" 
                      className="accent-indigo-600 w-4 h-4"
                      checked={isOthersSelected}
                      onChange={(e) => {
                        if (b.type === 'radio') {
                          handleAnswerChange(b.id, 'Others');
                        } else {
                          const current = (answers[b.id] as string[]) || [];
                          handleAnswerChange(b.id, e.target.checked 
                            ? [...current, 'Others'] 
                            : current.filter(x => x !== 'Others' && x !== 'others'));
                        }
                      }}
                    />
                    <span className="font-medium text-sm">Others</span>
                  </label>
                </div>
                
                {/* Text input for "Others" - show when selected */}
                {isOthersSelected && (
                  <div className="ml-5 mt-1.5 transition-all duration-300 ease-in-out">
                    {/* Textarea with mic icon inside */}
                    <div className="relative">
                      <textarea
                        value={othersText}
                        onChange={(e) => {
                          const key = optionDetails[othersKey] !== undefined ? othersKey : othersOptionKey;
                          handleDetailChange(key, e.target.value);
                        }}
                        placeholder="Please specify..."
                        className="w-full px-2.5 py-1.5 pr-9 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        rows={2}
                      />
                      {/* Mic icon inside textbox (bottom-right corner) */}
                      <button
                        onClick={() => startVoiceRecording(othersKey)}
                        className={`absolute bottom-1.5 right-1.5 p-1 rounded-full transition-all duration-200 ${
                          isRecording === othersKey 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isRecording === othersKey ? 'Recording... Click to stop' : 'Click to record voice'}
                      >
                        <span className="text-sm">🎤</span>
                      </button>
                    </div>
                    {/* Character count - compact display (only if text exists) */}
                    {othersText && (
                      <div className="text-xs text-gray-400 mt-0.5 ml-0.5">
                        {othersText.length} chars
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          </>
          )}
        </div>
      ))}
      
      {/* Submit button - hidden after submission */}
      {!isSubmitted && displayedBlocks.length > 0 && (() => {
        // Check if all required blocks have answers
        const hasRequiredAnswers = displayedBlocks.every(block => {
          if (block.type === 'text') {
            // Text blocks require non-empty input
            const answer = answers[block.id] as string;
            return answer && answer.trim().length > 0;
          } else if (block.type === 'radio') {
            // Radio blocks require an answer
            const answer = answers[block.id];
            if (!answer) return false;
            // If "Others" is selected, require text input
            if (answer === 'Others' || answer === 'others') {
              const othersText = optionDetails[`${block.id}_others`] || optionDetails[`${block.id}_Others`] || '';
              return othersText.trim().length > 0;
            }
            return true;
          } else {
            // Checkbox blocks require at least one selection
            const answer = answers[block.id];
            return Array.isArray(answer) && answer.length > 0;
          }
        });
        
        return (
          <div className="mt-4">
            <button
              onClick={handleSubmit}
              disabled={!hasRequiredAnswers}
              className={`w-full py-2 rounded text-sm font-medium transition-colors ${
                hasRequiredAnswers
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {t('chat.chat.interactive.submit')}
            </button>
          {remainingBlocks.length > 0 && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              {t('chat.chat.interactive.moreQuestions').replace('{count}', remainingBlocks.length.toString()).replace('{plural}', remainingBlocks.length > 1 ? 's' : '')}
            </div>
          )}
          </div>
        );
      })()}
      
      {/* Show message after submission while waiting for API response */}
      {isSubmitted && displayedBlocks.length === 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center italic">
          {t('chat.messages.submitting')}
        </div>
      )}
    </div>
  );
}

// Main Chat Page
export default function ChatPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage(['common', 'chat']);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentThreadId, setCurrentThreadId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice recording for main text box - using SpeechRecognition API (same as options text box)
  const [isMainMicRecording, setIsMainMicRecording] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mainMicRecognitionRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Format duration helper
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const [newChatPosition, setNewChatPosition] = useState({ x: 20, y: 20 });
  const [freezeInput, setFreezeInput] = useState(false); // Freeze text box when MCPs are present
  const [hideInputSection, setHideInputSection] = useState(false); // Hide text box section for more screen space
  const [solutionDelivered, setSolutionDelivered] = useState(false); // Solution has been delivered
  const [chatFrozen, setChatFrozen] = useState(false); // Chat completely frozen (after PDF)
  const [newChatAvailable, setNewChatAvailable] = useState(false); // New chat button should glow

  const [userInfo, setUserInfo] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  
  // 🎟️ NEW: Dual-mode support
  const [mode, setMode] = useState<'personal' | 'caregiver'>('personal');
  const [supportedPersonId, setSupportedPersonId] = useState<string | undefined>();
  const [supportedPersonName, setSupportedPersonName] = useState<string | undefined>();

  // Initialize on mount
  useEffect(() => {
    const userInfoData = sessionStorage.getItem('userInfo');
    let userData: any = null;
    
    if (userInfoData && userInfoData.trim()) {
      try {
        userData = JSON.parse(userInfoData);
        setUserInfo(userData);
      } catch (e) {
        console.error('Failed to parse userInfo from sessionStorage:', e);
        // Clear invalid data
        try {
          sessionStorage.removeItem('userInfo');
        } catch (clearErr) {
          // Ignore storage errors
        }
      }
      
      // Get mode from URL params
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get('mode');
      if (urlMode === 'caregiver') {
        setMode('caregiver');
        setSupportedPersonId(params.get('supportedPersonId') || undefined);
        setSupportedPersonName(params.get('supportedPersonName') || undefined);
      }
      
      // Set language: Check cookie FIRST, then localStorage, then userData, then default
      const cookieLang = getLanguageFromCookie();
      const savedLanguage = cookieLang || localStorage.getItem('i18nextLng') || userData?.language || 'en';
      setLanguage(savedLanguage as any);
      
      // Initialize: messages are maintained purely from local state.
      // If we have a threadId (from sessionStorage), fetch history from GET /api/chat/messages.
      const existingThreadId = sessionStorage.getItem('currentThreadId');
      
      if (existingThreadId && existingThreadId.trim().length > 0) {
        setCurrentThreadId(existingThreadId);
        (async () => {
          try {
            const response = await fetch(`/api/chat/messages?threadId=${encodeURIComponent(existingThreadId)}`);
            if (response.ok) {
              const data = await response.json();
              if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
                setMessages(
                  data.messages.map((m: { role: string; content: string }) => ({
                    role: m.role,
                    content: m.content,
                    timestamp: new Date(),
                  }))
                );
              }
            }
          } catch (err) {
            console.warn('Failed to load message history:', err);
          }
          setIsInitialized(true);
        })();
      } else {
        // No threadId: start with empty messages. Thread is created on first send; API returns threadId + message.
        const name = mode === 'caregiver' ? (supportedPersonName || 'your loved one') : (userData?.first_name || userData?.firstName || 'there');
        const greeting = mode === 'caregiver'
          ? t('chat.chat.greeting.caregiver').replace('{name}', name)
          : t('chat.chat.greeting.personal').replace('{name}', name);
        setMessages([{
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        }]);
        setIsInitialized(true);
      }
    } else {
      // No user data, redirect back
      router.push('/apps/mode-selection');
    }
  }, [router, mode]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle deleting a message
  const handleDeleteMessage = async (messageId: string | undefined, messageIndex: number) => {
    if (!messageId) {
      // If no messageId, just remove from local state (for messages not yet saved to DB)
      setMessages(prev => prev.filter((_, idx) => idx !== messageIndex));
      return;
    }

    try {
      const userId = userInfo?.id || userInfo?.user_id || sessionStorage.getItem('userId') || 'anon';
      
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Remove message from local state
        setMessages(prev => prev.filter((_, idx) => idx !== messageIndex));
      } else {
        alert(data.error || t('chat.chat.errors.deleteFailed'));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert(t('chat.chat.errors.deleteError'));
    }
  };

  // Check if message is recent (within 1 minute)
  const isRecentMessage = (timestamp: Date): boolean => {
    const now = new Date();
    const minutesAgo = (now.getTime() - timestamp.getTime()) / (1000 * 60);
    return minutesAgo <= 1;
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || freezeInput || chatFrozen) return; // Don't allow input if frozen

    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      id: undefined // Will be set when message is saved to DB
    }]);
    setIsLoading(true);
    setError('');

    try {
      const userId = userInfo?.id || userInfo?.user_id || sessionStorage.getItem('userId') || 'anon';
      let header: string | undefined;
      if (userInfo) {
        const headerParts: string[] = [
          userInfo.language || language || 'en',
          userInfo.age || '',
          userInfo.gender || '',
          userInfo.city || '',
          userInfo.country || '',
          userInfo.dob || userInfo.date_of_birth || '',
          userInfo.time_of_birth || '',
          userInfo.place_of_birth || '',
        ];
        header = headerParts.join('|');
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          threadId: currentThreadId || undefined,
          message: userMessage,
          header,
          language: language || 'en',
        }),
      });

      if (response.status === 402) {
        let errorData: { redirectTo?: string } = {};
        try {
          const responseText = await response.text();
          if (responseText?.trim()) errorData = JSON.parse(responseText);
          else errorData = { redirectTo: '/priceplan#main-plans' };
        } catch (e) {
          errorData = { redirectTo: '/priceplan#main-plans' };
        }
        alert(t('chat.chat.errors.insufficientCredits'));
        window.location.href = errorData.redirectTo || '/priceplan#main-plans';
        return;
      }

      let data: { success?: boolean; threadId?: string; message?: string; error?: string; freezeInput?: boolean; hideInputSection?: boolean; solutionDelivered?: boolean; pdfReportAvailable?: boolean; chatFrozen?: boolean; newChatAvailable?: boolean } = {};
      try {
        const responseText = await response.text();
        if (!responseText?.trim()) {
          data = { success: false, error: t('chat.chat.errors.emptyResponse') };
        } else {
          data = JSON.parse(responseText);
        }
      } catch (parseError: unknown) {
        const err = parseError as Error;
        if (err?.message?.includes('<!DOCTYPE')) {
          setError(t('chat.chat.errors.serverError'));
        } else {
          setError(t('chat.chat.errors.parseError'));
        }
        setIsLoading(false);
        return;
      }

      if (data.success && data.threadId) {
        setCurrentThreadId(data.threadId);
        sessionStorage.setItem('currentThreadId', data.threadId);
      }
      if (data.success || data.message) {
        const responseContent = data.message || '';
        if (data.freezeInput !== undefined) setFreezeInput(data.freezeInput);
        if (data.hideInputSection !== undefined) setHideInputSection(data.hideInputSection);
        if (data.solutionDelivered !== undefined) setSolutionDelivered(data.solutionDelivered);
        if (data.pdfReportAvailable !== undefined) setPdfAvailable(data.pdfReportAvailable);
        if (data.chatFrozen !== undefined) setChatFrozen(data.chatFrozen);
        if (data.newChatAvailable !== undefined) setNewChatAvailable(data.newChatAvailable);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
        }]);
      } else {
        setError(data.error || 'Failed to get response');
      }
    } catch (err) {
      setError(t('chat.chat.errors.communicationError'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form answers - format with comments and submit to API
  const handleFormAnswers = async (answers: Record<string, string | string[]>, optionDetails?: Record<string, string>) => {
    console.log('📝 handleFormAnswers called with:', { answers, optionDetails });
    
    // Format answers for DISPLAY (just answers, no question text)
    const displayAnswers: string[] = [];
    
    // Format answers for API (with question text for context)
    const apiAnswers: string[] = [];
    
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0];
    let allBlocks: any[] = [];
    if (lastAssistantMessage) {
      allBlocks = parseInteractiveBlocks(lastAssistantMessage.content);
      console.log('📝 Found blocks:', allBlocks);
      allBlocks.forEach((block, idx) => {
        console.log(`  📝 Block ${idx + 1}: ${block.question?.substring(0, 60)}...`);
      });
    } else {
      console.warn('⚠️ No assistant message found to get blocks from');
    }
    
    // Check if answers object is empty
    if (!answers || Object.keys(answers).length === 0) {
      console.warn('⚠️ No answers provided to handleFormAnswers');
      return;
    }
    
    // Calculate the starting answer number by counting existing answer messages
    // Look for messages that start with "A" followed by a number
    let startingAnswerNumber = 1;
    messages.forEach(msg => {
      if (msg.role === 'user' && msg.content) {
        // Check if message starts with "A" followed by a number pattern
        const answerMatch = msg.content.match(/^A(\d+):/);
        if (answerMatch) {
          const answerNum = parseInt(answerMatch[1], 10);
          if (answerNum >= startingAnswerNumber) {
            startingAnswerNumber = answerNum + 1;
          }
        }
      }
    });
    
    console.log(`📝 Starting answer number: ${startingAnswerNumber}`);
    
    // Sort by the order they appear in allBlocks
    const sortedAnswers = Object.entries(answers).sort(([aId], [bId]) => {
      const aIndex = allBlocks.findIndex((b: any) => b.id === aId);
      const bIndex = allBlocks.findIndex((b: any) => b.id === bId);
      return aIndex - bIndex;
    });
    
    let answerNumber = startingAnswerNumber;
    sortedAnswers.forEach(([blockId, answer]) => {
      console.log(`📝 Processing block ${blockId} with answer:`, answer);
      
      // Find the block to get the question text
      const block = allBlocks.find((b: any) => b.id === blockId);
      const questionText = block?.question || `Question ${blockId}`;
      
      if (Array.isArray(answer)) {
        // Multiple selections (checkbox) with details
        if (answer.length === 0) {
          console.log(`⚠️ Block ${blockId} has empty array, skipping`);
          return; // Skip empty arrays
        }
        
        const answerParts = answer.map(opt => {
          if (!opt || (typeof opt === 'string' && opt.trim().length === 0)) {
            console.log(`⚠️ Empty option in block ${blockId}, skipping`);
            return null;
          }
          const detailKey = `${blockId}_${opt}`;
          const detail = optionDetails?.[detailKey] || '';
          return detail ? `${opt} (${detail})` : opt;
        }).filter(part => part !== null);
        
        if (answerParts.length > 0) {
          const selectedOptions = answerParts.join(', ');
          console.log(`✅ Block ${blockId} formatted as:`, selectedOptions);
          // Display: with answer number (A1:, A2:, etc.) - increments across entire conversation
          displayAnswers.push(`A${answerNumber}: ${selectedOptions}`);
          // API: with question text
          apiAnswers.push(`${questionText}: ${selectedOptions}`);
          answerNumber++;
        }
      } else {
        // Single selection (radio) or text with detail
        if (!answer || (typeof answer === 'string' && answer.trim().length === 0)) {
          console.log(`⚠️ Block ${blockId} has empty answer, skipping`);
          return; // Skip empty answers
        }
        
        const detailKey = `${blockId}_${answer}`;
        const detail = optionDetails?.[detailKey] || '';
        const finalAnswer = detail ? `${answer} (${detail})` : answer;
        console.log(`✅ Block ${blockId} formatted as:`, finalAnswer);
        // Display: with answer number (A1:, A2:, etc.) - increments across entire conversation
        displayAnswers.push(`A${answerNumber}: ${finalAnswer}`);
        // API: with question text
        apiAnswers.push(`${questionText}: ${finalAnswer}`);
        answerNumber++;
      }
    });
    
    const displayText = displayAnswers.join('\n');
    const apiText = apiAnswers.join('\n\n');
    
    console.log('📝 Formatted displayText:', displayText);
    console.log('📝 Formatted apiText:', apiText);
    
    // Ensure we have content to display
    if (!displayText || displayText.trim().length === 0) {
      console.error('❌ No answers to display after formatting - answers:', answers, 'displayAnswers:', displayAnswers);
      return;
    }
    
    // Add user message to chat (display format - just answers)
    const userMessage = {
      role: 'user' as const,
      content: displayText.trim(),
      timestamp: new Date()
    };
    
    console.log('📝 Adding user message:', userMessage);
    setMessages(prev => [...prev, userMessage]);
    
    // Submit to API (which will use model configuration per stage) - with question context
    // Set inputValue and call handleSendMessage, but it will skip adding another user message
    // since we already added it above
    const originalInputValue = inputValue;
    setInputValue(apiText);
    
    // Call handleSendMessage which will send to API
    // Note: handleSendMessage will add another user message, so we need to prevent that
    // by temporarily setting a flag or by calling the API directly
    try {
      const userId = userInfo?.id || userInfo?.user_id || sessionStorage.getItem('userId') || 'anon';
      setIsLoading(true);
      setError('');
      let header: string | undefined;
      if (userInfo) {
        const headerParts = [
          userInfo.language || language || 'en',
          userInfo.age || '',
          userInfo.gender || '',
          userInfo.city || '',
          userInfo.country || '',
          userInfo.dob || userInfo.date_of_birth || '',
          userInfo.time_of_birth || '',
          userInfo.place_of_birth || '',
        ];
        header = headerParts.join('|');
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          threadId: currentThreadId || undefined,
          message: apiText,
          header,
          language: language || 'en',
        }),
      });

      if (response.status === 402) {
        let errorData: { redirectTo?: string } = {};
        try {
          const text = await response.text();
          if (text?.trim()) errorData = JSON.parse(text);
          else errorData = { redirectTo: '/priceplan#main-plans' };
        } catch (e) {
          errorData = { redirectTo: '/priceplan#main-plans' };
        }
        alert(t('chat.chat.errors.insufficientCredits'));
        window.location.href = errorData.redirectTo || '/priceplan#main-plans';
        return;
      }

      let data: { success?: boolean; threadId?: string; message?: string; error?: string; freezeInput?: boolean; hideInputSection?: boolean; solutionDelivered?: boolean; pdfReportAvailable?: boolean; chatFrozen?: boolean; newChatAvailable?: boolean } = {};
      try {
        const text = await response.text();
        if (!text?.trim()) data = { success: false, error: t('chat.chat.errors.emptyResponse') };
        else data = JSON.parse(text);
      } catch (parseError: unknown) {
        const err = parseError as Error;
        setError(err?.message?.includes('<!DOCTYPE') ? 'Server error occurred. Please try again.' : 'Failed to parse server response');
        setIsLoading(false);
        setInputValue(originalInputValue);
        return;
      }

      if (data.success && data.threadId) {
        setCurrentThreadId(data.threadId);
        sessionStorage.setItem('currentThreadId', data.threadId);
      }
      if (data.success || data.message) {
        const responseContent = data.message || '';
        if (data.freezeInput !== undefined) setFreezeInput(data.freezeInput);
        if (data.hideInputSection !== undefined) setHideInputSection(data.hideInputSection);
        if (data.solutionDelivered !== undefined) setSolutionDelivered(data.solutionDelivered);
        if (data.pdfReportAvailable !== undefined) setPdfAvailable(data.pdfReportAvailable);
        if (data.chatFrozen !== undefined) setChatFrozen(data.chatFrozen);
        if (data.newChatAvailable !== undefined) setNewChatAvailable(data.newChatAvailable);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
        }]);
      } else {
        setError(data.error || 'Failed to get response');
      }
    } catch (err) {
      setError(t('chat.chat.errors.communicationError'));
      console.error(err);
    } finally {
      setIsLoading(false);
      setInputValue(originalInputValue);
    }
  };

  // Get speech recognition language code (same as options text box)
  const getSpeechRecognitionLang = (langCode: string) => {
    const langMap: Record<string, string> = {
      'en': 'en-US', 'hi': 'hi-IN', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
      'it': 'it-IT', 'pt': 'pt-PT', 'ru': 'ru-RU', 'ja': 'ja-JP', 'ko': 'ko-KR',
      'zh': 'zh-CN', 'ar': 'ar-SA'
    };
    return langMap[langCode] || 'en-US';
  };

  // Handle voice recording toggle - using SpeechRecognition API (same as options text box)
  const handleVoiceRecordingToggle = () => {
    if (freezeInput || chatFrozen) {
      console.log('⚠️ Voice recording disabled - input is frozen');
      return;
    }
    
    // Stop if already recording
    if (isMainMicRecording && mainMicRecognitionRef.current) {
      console.log('🛑 Stopping voice recording...');
      try {
        mainMicRecognitionRef.current.stop();
      } catch (e) {
        console.log('Error stopping recognition:', e);
      }
      mainMicRecognitionRef.current = null;
      setIsMainMicRecording(false);
      setIsVoiceProcessing(false);
      // Stop duration counter
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      setRecordingDuration(0);
      return;
    }
    
    // Start recording using SpeechRecognition API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getSpeechRecognitionLang(language as string);
      
      recognition.onstart = () => {
        console.log('🎤 Voice recognition started');
        setIsMainMicRecording(true);
        setIsVoiceProcessing(false);
        // Start duration counter
        recordingStartTimeRef.current = Date.now();
        setRecordingDuration(0);
        durationIntervalRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          setRecordingDuration(elapsed);
        }, 1000);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('✅ Voice recognition result:', transcript);
        const currentText = inputValue || '';
        const newText = currentText ? `${currentText} ${transcript}` : transcript;
        setInputValue(newText);
        setIsMainMicRecording(false);
        setIsVoiceProcessing(false);
        // Stop duration counter
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        setRecordingDuration(0);
      };
      
      recognition.onerror = (event: any) => {
        console.error('❌ Voice recognition error:', event.error);
        setIsMainMicRecording(false);
        setIsVoiceProcessing(false);
        mainMicRecognitionRef.current = null;
        // Stop duration counter
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        setRecordingDuration(0);
        
        if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected');
        } else {
          alert(`Voice recognition error: ${event.error}`);
        }
      };
      
      recognition.onend = () => {
        console.log('🛑 Voice recognition ended');
        setIsMainMicRecording(false);
        setIsVoiceProcessing(false);
        mainMicRecognitionRef.current = null;
        // Stop duration counter
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        setRecordingDuration(0);
      };
      
      mainMicRecognitionRef.current = recognition;
      
      try {
        console.log('🎤 Starting voice recognition...');
        recognition.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        alert('Failed to start voice recognition. Please check your microphone permissions.');
        setIsMainMicRecording(false);
        setIsVoiceProcessing(false);
        mainMicRecognitionRef.current = null;
      }
    } else {
      alert('Speech recognition is not supported in your browser. Please use a modern browser like Chrome, Edge, or Safari.');
    }
  };

  // Cleanup: Stop recognition when component unmounts or input is frozen
  useEffect(() => {
    return () => {
      if (mainMicRecognitionRef.current) {
        try {
          mainMicRecognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
        mainMicRecognitionRef.current = null;
      }
      // Clear duration interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, []);

  // Stop recognition if input is frozen
  useEffect(() => {
    if ((freezeInput || chatFrozen) && mainMicRecognitionRef.current) {
      try {
        mainMicRecognitionRef.current.stop();
      } catch (e) {
        // Ignore errors
      }
      mainMicRecognitionRef.current = null;
      setIsMainMicRecording(false);
      setIsVoiceProcessing(false);
      // Stop duration counter
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      setRecordingDuration(0);
    }
  }, [freezeInput, chatFrozen]);

  // NOTE: The old handleVoiceTranscription function has been removed.
  // Main text box now uses browser's SpeechRecognition API directly (same as options text box),
  // which works without needing an API key or server-side transcription.

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearAndGoBack = () => {
    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('selectedMode');
    // Clear caregiver-related items to ensure new chats start with registered user details
    sessionStorage.removeItem('recipientName');
    sessionStorage.removeItem('recipientProfile');
    sessionStorage.removeItem('currentThreadId');
    sessionStorage.removeItem('initialGreeting');
    document.cookie = 'selectedMode=; path=/; max-age=0'; // Clear cookie
    router.push('/apps/mode-selection');
  };

  // Mouse-based drag handlers for New Chat button (better click detection)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setHasDragged(false);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    });
    setMouseDownPos({
      x: e.clientX,
      y: e.clientY
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && mouseDownPos) {
        // Check if user has actually moved the button (more than 5px)
        const moveDistance = Math.sqrt(
          Math.pow(e.clientX - mouseDownPos.x, 2) + 
          Math.pow(e.clientY - mouseDownPos.y, 2)
        );
        
        if (moveDistance > 5) {
          setHasDragged(true);
        }
        
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Get viewport dimensions
        const buttonSize = 64; // Approximate button size (including padding)
        const maxX = window.innerWidth - buttonSize;
        const maxY = window.innerHeight - buttonSize;
        
        // Constrain to screen boundaries
        const constrainedX = Math.max(0, Math.min(newX, maxX));
        const constrainedY = Math.max(0, Math.min(newY, maxY));
        
        setNewChatPosition({
          x: constrainedX,
          y: constrainedY
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Note: hasDragged and mouseDownPos will be checked in onClick handler
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, mouseDownPos]);

  const generatePDF = () => {
    if (pdfAvailable) {
      // Generate PDF from chat messages
      console.log('Generating PDF report...');
      // Implement PDF generation logic
    }
  };

  if (!isInitialized) {
    return <div className="flex items-center justify-center h-screen"><p>{t('chat.messages.loading')}</p></div>;
  }

  return (
    <>
      {/* Mode Indicator Header */}
      {isInitialized && (
        <div className="bg-green-600 text-white px-4 py-2 text-center text-sm">
          {mode === 'personal' ? t('chat.chat.header.personal') : t('chat.chat.header.caregiver').replace('{name}', supportedPersonName || 'Loved One')}
        </div>
      )}
      
      {/* Messages Container - Scrollable */}
      <div className="overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100vh - 64px - 100px)' }}>
        {messages.map((msg, index) => {
          const canDelete = msg.role === 'user' && isRecentMessage(msg.timestamp);
          
          return (
            <div key={index}>
              <div
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} px-4`}
              >
                <div
                  className={`relative max-w-4xl px-6 py-4 rounded-lg group ${
                    msg.role === 'user'
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: '#0B4422' } : {}}
                >
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id, index)}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg"
                      title={t('chat.chat.actions.delete')}
                      aria-label="Delete message"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                  {msg.role === "assistant" ? (
                    <InteractiveBlockRenderer 
                      content={msg.content} 
                      onSubmit={handleFormAnswers} 
                      selectedLanguage={language as string}
                      onBlocksPresent={(hasBlocks) => setHideInputSection(hasBlocks)}
                    />
                  ) : (
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {msg.content || t('chat.chat.input.noContent')}
                    </div>
                  )}
                  <div className={`text-xs mt-1 opacity-70 ${
                    msg.role === 'user' ? 'text-white' : 'text-gray-500'
                  }`}>
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>{t('chat.messages.thinking')}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input Container - Hidden when MCPs are present, shown when solution delivered */}
      {(!hideInputSection || solutionDelivered) && (
      <div className="fixed bottom-0 left-0 right-0 border-t bg-gray-50 px-2 py-1" style={{ height: '100px', marginBottom: '-32px' }}>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={freezeInput || chatFrozen ? t('chat.chat.input.placeholderFrozen') : t('chat.chat.input.placeholder')}
              disabled={freezeInput || chatFrozen}
              className={`w-full px-6 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                freezeInput || chatFrozen ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
              }`}
              rows={1}
              style={{
                minHeight: '44px',
                maxHeight: '120px',
                overflowY: 'auto'
              }}
            />
            {/* Mic/Stop Button - Changes icon based on state */}
            <button
              type="button"
              onClick={handleVoiceRecordingToggle}
              disabled={isVoiceProcessing || freezeInput || chatFrozen}
              className={`absolute right-2 top-3 p-1.5 rounded-full transition-all z-10 ${
                isMainMicRecording
                  ? 'bg-red-500 text-white animate-pulse shadow-lg hover:bg-red-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              } ${isVoiceProcessing || freezeInput || chatFrozen ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={isMainMicRecording ? 'Click to stop recording' : isVoiceProcessing ? t('chat.messages.processing') : t('chat.chat.voice.start')}
            >
              {isMainMicRecording ? '⏹️' : '🎤'}
            </button>

            {/* Recording Animation - Show when recording */}
            {isMainMicRecording && (
              <>
                <div 
                  className="absolute right-1 top-2 w-8 h-8 border-2 border-red-500 rounded-full animate-ping opacity-75"
                ></div>
                <div 
                  className="absolute right-12 top-3 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded"
                >
                  {formatDuration(recordingDuration)}
                </div>
              </>
            )}

            
            {/* Processing Indicator */}
            {isVoiceProcessing && (
              <div 
                className="absolute right-12 top-3 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1"
              >
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                {t('chat.messages.transcribing')}
              </div>
            )}
          </div>
          
          {/* PDF Button - Only visible when report is available */}
          {pdfAvailable && (
            <button
              onClick={generatePDF}
              className="flex items-center justify-center w-11 h-11 rounded-lg transition-colors"
              style={{ backgroundColor: '#0B4422', color: 'white' }}
              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#1a5f3a'}
              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#0B4422'}
              title={t('chat.chat.pdf.generate')}
            >
              <span>📄</span>
            </button>
          )}
          
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim() || freezeInput || chatFrozen}
            className="px-6 py-2 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors h-11"
            style={{ backgroundColor: '#0B4422' }}
            onMouseEnter={(e) => !(e.target as HTMLButtonElement).disabled && ((e.target as HTMLButtonElement).style.backgroundColor = '#1a5f3a')}
            onMouseLeave={(e) => !(e.target as HTMLButtonElement).disabled && ((e.target as HTMLButtonElement).style.backgroundColor = '#0B4422')}
          >
            {isLoading ? t('chat.chat.input.sending') : t('chat.chat.input.send')}
          </button>
        </div>
      </div>
      )}
      {/* Draggable New Chat Button - Glows when new chat is available */}
      <button
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          // Only trigger navigation if it wasn't a drag operation
          if (!hasDragged && mouseDownPos) {
            const moveDistance = Math.sqrt(
              Math.pow(e.clientX - mouseDownPos.x, 2) + 
              Math.pow(e.clientY - mouseDownPos.y, 2)
            );
            if (moveDistance <= 5) {
              clearAndGoBack();
            }
          }
          // Reset after click check
          setMouseDownPos(null);
          setHasDragged(false);
        }}
        className={`fixed text-white rounded-full shadow-lg p-4 hover:shadow-xl transition-all z-50 cursor-move ${
          newChatAvailable 
            ? 'bg-gradient-to-br from-green-500 to-teal-500 animate-pulse ring-4 ring-green-300 ring-opacity-75' 
            : 'bg-gradient-to-br from-green-600 to-teal-600'
        }`}
        style={{
          left: `${newChatPosition.x}px`,
          top: `${newChatPosition.y}px`,
          transform: isDragging ? 'scale(1.1)' : (newChatAvailable ? 'scale(1.15)' : 'scale(1)')
        }}
        title={newChatAvailable ? "✨ Start New Chat (Click to begin)" : "Start New Chat (Drag to move)"}
      >
        <span className="text-2xl">💬</span>
      </button>
    </>
  );
}