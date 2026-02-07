'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface YouTubeVideoProps {
  videoId: string;
  title?: string;
  width?: string | number;
  height?: string | number;
  autoplay?: boolean;
  controls?: boolean;
  showInfo?: boolean;
  rel?: boolean;
  fullscreen?: boolean;
  fallbackImage?: string;
  onReady?: (player: any) => void;
  onStateChange?: (state: number) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function YouTubeVideo({
  videoId,
  title = 'DrishiQ Video',
  width = '100%',
  height = '400',
  autoplay = false,
  controls = true,
  showInfo = false,
  rel = false,
  fullscreen = true,
  fallbackImage = '/assets/video-placeholder.jpg',
  onReady,
  onStateChange,
  onError,
  className = ''
}: YouTubeVideoProps) {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const playerRef = useRef<HTMLDivElement>(null);
  const i18n = {};

  // Load YouTube IFrame API
  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (typeof window !== 'undefined' && !(window as any).YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    };

    loadYouTubeAPI();

    // Initialize YouTube player when API is ready
    (window as any).onYouTubeIframeAPIReady = () => {
      if (!playerRef.current) return;

      const ytPlayer = new (window as any).YT.Player(playerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: controls ? 1 : 0,
          rel: rel ? 1 : 0,
          showinfo: showInfo ? 1 : 0,
          fs: fullscreen ? 1 : 0,
          cc_load_policy: 1, // Force captions to be shown
          cc_lang_pref: 'en', // Set preferred caption language
          hl: 'en', // Set interface language
          iv_load_policy: 3, // Hide video annotations
          modestbranding: 1, // Hide YouTube logo
          playsinline: 1, // Play inline on mobile
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            setIsLoading(false);
            setPlayer(event.target);
            
            // Try to set captions for the selected language
            try {
              event.target.setOption('captions', 'track', {'languageCode': 'en'});
              event.target.loadModule('captions');
              event.target.setOption('captions', 'reload', true);
            } catch (error) {
              console.log('Captions not available for language:', 'en');
            }
            
            onReady?.(event.target);
          },
          onStateChange: (event: any) => {
            // YouTube player states: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            onStateChange?.(event.data);
          },
          onError: (event: any) => {
            const errorMessages: { [key: number]: string } = {
              2: 'Invalid video ID',
              5: 'HTML5 player error',
              100: 'Video not found',
              101: 'Embedding not allowed',
              150: 'Embedding not allowed'
            };
            const errorMessage = errorMessages[event.data] || 'Unknown error occurred';
            setError(errorMessage);
            setIsLoading(false);
            onError?.(errorMessage);
          }
        },
      });
    };

    // Cleanup function
    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [videoId, autoplay, controls, showInfo, rel, fullscreen, onReady, onStateChange, onError]);

  // Player controls
  const playVideo = () => {
    if (player && isPlayerReady) {
      player.playVideo();
    }
  };

  const pauseVideo = () => {
    if (player && isPlayerReady) {
      player.pauseVideo();
    }
  };

  const stopVideo = () => {
    if (player && isPlayerReady) {
      player.stopVideo();
    }
  };

  const seekTo = (seconds: number) => {
    if (player && isPlayerReady) {
      player.seekTo(seconds, true);
    }
  };

  const setVolume = (volume: number) => {
    if (player && isPlayerReady) {
      player.setVolume(volume);
    }
  };

  const mute = () => {
    if (player && isPlayerReady) {
      player.mute();
    }
  };

  const unMute = () => {
    if (player && isPlayerReady) {
      player.unMute();
    }
  };

  // Error state
  if (error) {
    return (
      <div className={`youtube-video-error ${className}`} style={{ width, height }}>
        <div className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-lg p-8">
          <Image
            src={fallbackImage}
            alt="Video not available"
            width={200}
            height={150}
            className="mb-4 rounded"
          />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Video Not Available</h3>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`youtube-video-loading ${className}`} style={{ width, height }}>
        <div className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`youtube-video-container ${className}`} style={{ width, height }}>
      <div 
        ref={playerRef}
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '300px' }}
      />
      
      {/* Optional: Custom controls */}
      {isPlayerReady && (
        <div className="mt-4 flex justify-center space-x-2">
          <button
            onClick={playVideo}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Play
          </button>
          <button
            onClick={pauseVideo}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
          >
            Pause
          </button>
          <button
            onClick={stopVideo}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );
}

// Helper function to extract YouTube video ID from URL
export function extractYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper function to get YouTube embed URL
export function getYouTubeEmbedUrl(videoId: string, options: {
  autoplay?: boolean;
  controls?: boolean;
  cc_lang_pref?: string;
  hl?: string;
} = {}): string {
  const params = new URLSearchParams({
    autoplay: options.autoplay ? '1' : '0',
    controls: options.controls !== false ? '1' : '0',
    cc_load_policy: '1',
    modestbranding: '1',
    rel: '0',
    ...(options.cc_lang_pref ? { cc_lang_pref: options.cc_lang_pref } : {}),
    ...(options.hl ? { hl: options.hl } : {})
  });
  
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
} 
