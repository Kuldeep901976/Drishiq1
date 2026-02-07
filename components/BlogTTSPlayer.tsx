'use client';

import { useState, useRef } from 'react';

interface BlogTTSPlayerProps {
  title?: string;
  content: string;
  language?: string;
}

function BlogTTSPlayer({ title, content, language = 'en' }: BlogTTSPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentChunkRef = useRef(0);
  const totalChunksRef = useRef(1);

  const stripHtmlAndEmojis = (text: string): string => {
    if (!text) return '';
    
    let cleaned = text.replace(/<[^>]*>/g, ' ');
    
    const textarea = document.createElement('textarea');
    textarea.innerHTML = cleaned;
    cleaned = textarea.value;
    
    cleaned = cleaned
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
      .replace(/[\u{200D}\u{FE0F}]/gu, '');
    
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    
    return cleaned;
  };

  const playChunk = async (textToRead: string, chunkIndex: number) => {
    try {
      console.log(`Playing chunk ${chunkIndex + 1}/${totalChunksRef.current}`);
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: textToRead, 
          language,
          chunkIndex,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      // Get chunk info from headers
      const totalChunks = parseInt(response.headers.get('X-Total-Chunks') || '1');
      totalChunksRef.current = totalChunks;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onplay = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };
      
      audio.onended = async () => {
        URL.revokeObjectURL(url);
        
        // Play next chunk if available
        currentChunkRef.current = chunkIndex + 1;
        
        if (currentChunkRef.current < totalChunks) {
          const progressPercent = (currentChunkRef.current / totalChunks) * 100;
          setProgress(progressPercent);
          
          // Play next chunk
          await playChunk(textToRead, currentChunkRef.current);
        } else {
          // All chunks done
          console.log('All chunks played!');
          setIsPlaying(false);
          setProgress(100);
          currentChunkRef.current = 0;
          
          // Reset progress after a short delay
          setTimeout(() => setProgress(0), 1000);
        }
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        setIsLoading(false);
      };

      await audio.play();
      
    } catch (error) {
      console.error('Chunk playback error:', error);
      throw error;
    }
  };

  const startTTS = async () => {
    setIsLoading(true);
    setProgress(0);
    currentChunkRef.current = 0;
    
    const spokenTitle = title ? stripHtmlAndEmojis(title) : '';
    const spokenContent = stripHtmlAndEmojis(content);
    const textToRead = spokenTitle ? `${spokenTitle}. ${spokenContent}` : spokenContent;
    
    console.log('Text length:', textToRead.length);
    console.log('Byte size:', new TextEncoder().encode(textToRead).length);
    
    if (!textToRead || textToRead.trim().length === 0) {
      alert('No content to read');
      setIsLoading(false);
      return;
    }
    
    try {
      await playChunk(textToRead, 0);
    } catch (error) {
      console.error('TTS error:', error);
      alert('Failed to generate speech. The content might be too long.');
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const stopTTS = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      URL.revokeObjectURL(audioRef.current.src);
    }
    setIsPlaying(false);
    setIsLoading(false);
    setProgress(0);
    currentChunkRef.current = 0;
  };

  return (
    <div className="tts">
      <div className="tts__row">
        <div className="tts__controls-container">
          {!isPlaying ? (
            <button
              onClick={startTTS}
              className="tts__btn tts__btn--primary"
              disabled={isLoading}
              title="Start Reading"
            >
              {isLoading ? '⏳' : '▶️'}
            </button>
          ) : (
            <button
              onClick={stopTTS}
              className="tts__btn tts__btn--danger"
              title="Stop"
            >
              ⏹️
            </button>
          )}
        </div>
        
        <div className="tts__inlineTitle">
          🎵 Listen: {title || ''}
          {isPlaying && totalChunksRef.current > 1 && (
            <span style={{ fontSize: '12px', marginLeft: '10px', opacity: 0.7 }}>
              Part {currentChunkRef.current + 1}/{totalChunksRef.current}
            </span>
          )}
        </div>
        
        <div 
          className="tts__progress"
          onClick={() => {
            if (!isPlaying && !isLoading) {
              startTTS();
            }
          }}
          role="button"
          title="Start Reading"
        >
          <div 
            className="tts__progress__bar" 
            style={{ 
              width: isPlaying ? `${progress || 100}%` : '0%',
              transition: 'width 0.5s ease'
            }} 
          />
        </div>
      </div>
    </div>
  );
}

export default BlogTTSPlayer;