'use client';

import { useState, useRef, useEffect } from 'react';

interface BlogTTSPlayerProps {
  title?: string;
  content: string;
  language?: string;
}

// Map app language code to Web Speech API (BCP-47) lang codes to try (first match wins).
const langToSpeechLangs: Record<string, string[]> = {
  en: ['en-IN', 'en-US', 'en-GB'],
  hi: ['hi-IN'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
  ta: ['ta-IN', 'ta'],
  te: ['te-IN', 'te'],
  mr: ['mr-IN', 'mr'],
  gu: ['gu-IN', 'gu'],
  kn: ['kn-IN', 'kn'],
  ml: ['ml-IN', 'ml'],
  pa: ['pa-IN', 'pa'],
  or: ['or-IN', 'or'],
  es: ['es-ES', 'es-MX', 'es'],
  fr: ['fr-FR', 'fr-CA', 'fr'],
  de: ['de-DE', 'de'],
  ar: ['ar-XA', 'ar-SA', 'ar'],
  zh: ['zh-CN', 'zh-TW', 'zh'],
  ja: ['ja-JP', 'ja'],
  ru: ['ru-RU', 'ru'],
  pt: ['pt-BR', 'pt-PT', 'pt'],
  it: ['it-IT', 'it'],
  ko: ['ko-KR', 'ko'],
  nl: ['nl-NL', 'nl'],
  pl: ['pl-PL', 'pl'],
  tr: ['tr-TR', 'tr'],
  vi: ['vi-VN', 'vi'],
  th: ['th-TH', 'th'],
  id: ['id-ID', 'id'],
  ms: ['ms-MY', 'ms'],
};

function getVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

function pickVoiceForLang(langCodes: string[], allowEnglishFallback: boolean): SpeechSynthesisVoice | null {
  const voices = getVoices();
  for (const code of langCodes) {
    const langLower = code.toLowerCase();
    const exact = voices.find((v) => v.lang.toLowerCase() === langLower);
    if (exact) return exact;
    const prefix = voices.find((v) => v.lang.toLowerCase().startsWith(langLower.split('-')[0]));
    if (prefix) return prefix;
  }
  if (!allowEnglishFallback) return null;
  const enVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
  return enVoice || voices[0] || null;
}

function hasNativeVoiceForLang(langCodes: string[]): boolean {
  const voices = getVoices();
  const wantPrefixes = langCodes.map((c) => c.toLowerCase().split('-')[0]);
  for (const v of voices) {
    const vLang = v.lang.toLowerCase();
    if (wantPrefixes.some((p) => vLang === p || vLang.startsWith(p + '-'))) return true;
  }
  return false;
}

function chunkForSpeech(text: string, maxLen: number = 200): string[] {
  const chunks: string[] = [];
  const re = /[^.!?।॥\n]+[.!?।॥]*|\n+/g;
  let m: RegExpExecArray | null;
  let current = '';
  while ((m = re.exec(text)) !== null) {
    const seg = m[0].trim();
    if (!seg) continue;
    if (current.length + seg.length + 1 <= maxLen) {
      current = current ? current + ' ' + seg : seg;
    } else {
      if (current) chunks.push(current);
      current = seg.length <= maxLen ? seg : seg.slice(0, maxLen);
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [text.slice(0, maxLen) || text];
}

function BlogTTSPlayer({ title, content, language = 'en' }: BlogTTSPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const currentChunkRef = useRef(0);
  const totalChunksRef = useRef(1);
  const cancelledRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    return cleaned.replace(/\s{2,}/g, ' ').trim();
  };

  const langCode = (language || 'en').toLowerCase().split(/[-_]/)[0];
  const langCodesToTry: string[] =
    langToSpeechLangs[langCode] ||
    (language && /^[a-z]{2,3}-[A-Za-z]{2,}$/i.test(language) ? [language] : ['en-IN', 'en-US']);

  const playChunkViaServer = async (textToRead: string, chunkIndex: number): Promise<void> => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textToRead, language: langCode, chunkIndex }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `TTS failed: ${res.status}`);
    }
    const totalChunks = parseInt(res.headers.get('X-Total-Chunks') || '1', 10);
    totalChunksRef.current = totalChunks;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => reject(new Error('Playback failed'));
      audio.play().catch(reject);
    });
  };

  const startTTS = () => {
    const spokenTitle = title ? stripHtmlAndEmojis(title) : '';
    const spokenContent = stripHtmlAndEmojis(content);
    const textToRead = spokenTitle ? `${spokenTitle}. ${spokenContent}` : spokenContent;
    if (!textToRead || !textToRead.trim()) {
      alert('No content to read');
      return;
    }
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Speech is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    window.speechSynthesis.cancel();
    cancelledRef.current = false;
    setIsLoading(true);
    setIsPlaying(true);
    setProgress(0);
    const chunks = chunkForSpeech(textToRead);
    totalChunksRef.current = chunks.length;
    currentChunkRef.current = 0;

    const runSpeakBrowser = () => {
      const voice = pickVoiceForLang(langCodesToTry, true);
      const speechLang = voice ? voice.lang : 'en-IN';
      let index = 0;
      const speakNext = () => {
        if (cancelledRef.current || index >= chunks.length) {
          setIsPlaying(false);
          setIsLoading(false);
          setProgress(index >= chunks.length ? 100 : 0);
          if (index >= chunks.length) setTimeout(() => setProgress(0), 1000);
          return;
        }
        const u = new SpeechSynthesisUtterance(chunks[index]);
        u.lang = speechLang;
        u.rate = 0.9;
        if (voice) u.voice = voice;
        u.onend = () => {
          index++;
          currentChunkRef.current = index;
          setProgress(chunks.length > 0 ? (index / chunks.length) * 100 : 100);
          speakNext();
        };
        u.onerror = () => {
          index++;
          speakNext();
        };
        window.speechSynthesis.speak(u);
        setIsLoading(false);
      };
      speakNext();
    };

    const runSpeakServer = async () => {
      try {
        let chunkIndex = 0;
        for (;;) {
          if (cancelledRef.current) break;
          await playChunkViaServer(textToRead, chunkIndex);
          setIsLoading(false);
          chunkIndex++;
          currentChunkRef.current = chunkIndex;
          setProgress(totalChunksRef.current > 0 ? (chunkIndex / totalChunksRef.current) * 100 : 100);
          if (chunkIndex >= totalChunksRef.current) break;
        }
        if (!cancelledRef.current) setProgress(100);
        setTimeout(() => setProgress(0), 1000);
      } catch (e) {
        console.warn('Server TTS failed:', e);
        if (!cancelledRef.current) {
          setIsPlaying(false);
          setIsLoading(false);
          alert(
            'Listen in this language needs Google TTS. Add GOOGLE_TTS_API_KEY to .env.local (and enable Cloud Text-to-Speech API), then restart the app.'
          );
        }
      } finally {
        if (!cancelledRef.current) {
          setIsPlaying(false);
          setIsLoading(false);
        }
      }
    };

    const decideAndRun = () => {
      const useBrowser = langCode === 'en' || hasNativeVoiceForLang(langCodesToTry);
      if (useBrowser) {
        console.log('[TTS] Using Web Speech (browser)', { language: langCode, langCodesToTry });
        runSpeakBrowser();
      } else {
        console.log('[TTS] Using Google API (server)', { language: langCode, langCodesToTry });
        runSpeakServer();
      }
    };

    if (getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        decideAndRun();
      };
    } else {
      decideAndRun();
    }
  };

  const stopTTS = () => {
    cancelledRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
    setProgress(0);
    currentChunkRef.current = 0;
  };

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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