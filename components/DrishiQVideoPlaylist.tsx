'use client';

import { useEffect, useState } from 'react';
import YouTubeVideo from './YouTubeVideo';

interface VideoItem {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: string;
  language?: string;
}

interface DrishiQVideoPlaylistProps {
  playlistId?: string;
  videos?: VideoItem[];
  preferredLanguage?: string;
  autoPlay?: boolean;
  showPlaylist?: boolean;
  className?: string;
}

// DrishiQ YouTube Playlist ID
const DRISHIQ_PLAYLIST_ID = 'PLkvOieJ_pAbDGUm6laWiJtbxTGoNZjKkN';

// Helper function to get playlist embed URL
function getYouTubePlaylistEmbedUrl(playlistId: string, options: {
  autoplay?: boolean;
  controls?: boolean;
  cc_lang_pref?: string;
  hl?: string;
} = {}): string {
  const params = new URLSearchParams({
    list: playlistId,
    autoplay: options.autoplay ? '1' : '0',
    controls: options.controls !== false ? '1' : '0',
    cc_load_policy: '1',
    modestbranding: '1',
    rel: '0',
    ...(options.cc_lang_pref ? { cc_lang_pref: options.cc_lang_pref } : {}),
    ...(options.hl ? { hl: options.hl } : {})
  });
  
  return `https://www.youtube.com/embed/videoseries?${params.toString()}`;
}

export default function DrishiQVideoPlaylist({
  playlistId = DRISHIQ_PLAYLIST_ID,
  videos,
  preferredLanguage = 'en',
  autoPlay = false,
  showPlaylist = true,
  className = ''
}: DrishiQVideoPlaylistProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [playlistVideos, setPlaylistVideos] = useState<VideoItem[]>(videos || []);
  const [isLoading, setIsLoading] = useState(false);

  // Use playlist embed URL when playlistId is provided
  const playlistEmbedUrl = playlistId 
    ? getYouTubePlaylistEmbedUrl(playlistId, {
        autoplay: autoPlay,
        controls: true,
        cc_lang_pref: preferredLanguage,
        hl: preferredLanguage
      })
    : null;

  const handleVideoEnd = () => {
    // Auto-play next video
    if (currentVideoIndex < playlistVideos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const handleVideoSelect = (index: number) => {
    setCurrentVideoIndex(index);
  };

  const handleNextVideo = () => {
    if (currentVideoIndex < playlistVideos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const handlePreviousVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  // If we have a playlist ID, use YouTube's native playlist embed
  if (playlistEmbedUrl) {
    return (
      <div className={`drishiq-video-playlist ${className}`}>
        <div className="mb-6">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={playlistEmbedUrl}
              title="DrishiQ Video Playlist"
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="mt-4 text-center">
            <a
              href={`https://www.youtube.com/playlist?list=${playlistId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0B4422] hover:underline text-sm font-medium"
            >
              View full playlist on YouTube →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to individual video player if videos array is provided
  if (isLoading) {
    return (
      <div className={`drishiq-playlist-loading ${className}`}>
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading DrishiQ playlist...</p>
        </div>
      </div>
    );
  }

  // Safety check: ensure we have a valid current video
  const currentVideo = playlistVideos[currentVideoIndex];
  if (!currentVideo || !playlistVideos || playlistVideos.length === 0) {
    return (
      <div className={`drishiq-video-playlist ${className}`}>
        <div className="flex flex-col items-center justify-center p-8">
          <p className="text-gray-600">No videos available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`drishiq-video-playlist ${className}`}>
      {/* Main Video Player */}
      <div className="mb-6">
        <YouTubeVideo
          videoId={currentVideo.id}
          title={currentVideo.title}
          width="100%"
          height="400"
          autoplay={autoPlay}
          controls={true}
          onStateChange={(state) => {
            if (state === 0) { // Video ended
              handleVideoEnd();
            }
          }}
          onError={(error) => {
            console.error('Video error:', error);
            // Try next video if current one fails
            if (currentVideoIndex < playlistVideos.length - 1) {
              setCurrentVideoIndex(currentVideoIndex + 1);
            }
          }}
        />
        
        {/* Video Info */}
        <div className="mt-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {currentVideo.title}
          </h3>
          {currentVideo.description && (
            <p className="text-gray-600 mb-4">{currentVideo.description}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Video {currentVideoIndex + 1} of {playlistVideos.length}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handlePreviousVideo}
                disabled={currentVideoIndex === 0}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={handleNextVideo}
                disabled={currentVideoIndex === playlistVideos.length - 1}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist */}
      {showPlaylist && playlistVideos.length > 1 && (
        <div className="drishiq-playlist">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            DrishiQ Video Playlist
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlistVideos.map((video, index) => (
              <div
                key={video.id}
                onClick={() => handleVideoSelect(index)}
                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentVideoIndex
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="relative">
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.onerror = null;
                      img.src = '/assets/banners/images/mistycloud.webp';
                    }}
                  />
                  {index === currentVideoIndex && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                        Playing
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h5 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {video.title}
                  </h5>
                  {video.duration && (
                    <p className="text-xs text-gray-500 mt-1">{video.duration}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Export the helper function for external use
export { getYouTubePlaylistEmbedUrl };
