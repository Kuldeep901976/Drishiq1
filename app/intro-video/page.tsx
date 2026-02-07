'use client';

import BannerAd from '@/components/BannerAd';
import YouTubeVideo from '@/components/YouTubeVideo';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function IntroVideoPage() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showAdBanner, setShowAdBanner] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [showSkipVideo, setShowSkipVideo] = useState(false);

  // On mount, check for selected language
  useEffect(() => {
    const storedLanguage = localStorage.getItem('selected-language');
    if (!storedLanguage) {
      router.push('/');
      return;
    }
    setSelectedLanguage(storedLanguage);
    
    // Show skip video button after 5 seconds
    setTimeout(() => setShowSkipVideo(true), 5000);
  }, [router]);

  // Ad banner countdown logic
  const startAdCountdown = () => {
    let countdown = 5;
    setAdCountdown(countdown);
    setCanSkip(false);
    const countdownInterval = setInterval(() => {
      countdown--;
      setAdCountdown(countdown);
      if (countdown === 2) {
        setCanSkip(true);
      }
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        router.push('/video-experience');
      }
    }, 1000);
  };

  const handleSkipVideo = () => {
    router.push('/video-experience');
  };

  const handleSkipAd = () => {
    router.push('/video-experience');
  };

  const handleVideoEnd = () => {
    setShowAdBanner(true);
    startAdCountdown();
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* Banner Ad - positioned at top with skip functionality */}
      <BannerAd />
      
      {/* Header */}
      <div style={{ 
        position: 'absolute', 
        top: '80px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 10
      }}>
        <Image
          src="/assets/logo/Logo.png"
          alt="DrishiQ Logo"
          width={180}
          height={80}
        />
      </div>

      {/* YouTube Video Container - Full Screen */}
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        position: 'fixed',
        top: 0,
        left: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1
      }}>
        {/* YouTube Player using new component */}
        <div style={{ width: '100%', height: '100%' }}>
          <YouTubeVideo
            videoId="JjMr3F-4Swg" // Your YouTube video ID
            width="100%"
            height="100%"
            autoplay={true}
            controls={true}
            onStateChange={(state) => {
              if (state === 0) { // Video ended
                handleVideoEnd();
              }
            }}
            onReady={() => {
              // Video is ready
            }}
            onError={(error) => {
              console.error('Video error:', error);
              // Handle video error - maybe show fallback or skip
              setTimeout(() => router.push('/video-experience'), 3000);
            }}
          />
        </div>
        
        {/* Skip Video Button */}
        {showSkipVideo && !showAdBanner && (
          <button
            onClick={handleSkipVideo}
            style={{
              position: 'absolute',
              top: '40px',
              right: '40px',
              background: '#0B4422',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              zIndex: 20
            }}
          >
            Skip Video
          </button>
        )}
      </div>

      {/* Ad Banner Overlay */}
      {showAdBanner && (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw', 
          height: '100vh', 
          background: 'linear-gradient(135deg, #0B4422 0%, #1a5d3a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: 'white',
          zIndex: 30
        }}>
          <div style={{
            position: 'relative',
            width: '200px',
            height: '200px',
            marginBottom: '40px'
          }}>
            <svg style={{
              width: '200px',
              height: '200px',
              transform: 'rotate(-90deg)'
            }}>
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="#fff"
                strokeWidth="16"
                fill="none"
                opacity="0.2"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="#FFD700"
                strokeWidth="16"
                fill="none"
                strokeDasharray={565.48}
                strokeDashoffset={565.48 * (adCountdown / 5)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#FFD700'
            }}>{adCountdown}</div>
          </div>
          <div style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Sponsored Message</div>
          <div style={{ fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '400px', textAlign: 'center' }}>
            Unlock your potential with DrishiQ! Join us for a journey of clarity and growth.
          </div>
          <button
            onClick={handleSkipAd}
            disabled={!canSkip}
            style={{
              background: canSkip ? '#FFD700' : '#ccc',
              color: canSkip ? '#0B4422' : '#888',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              cursor: canSkip ? 'pointer' : 'not-allowed',
              opacity: canSkip ? 1 : 0.7
            }}
          >
            {canSkip ? 'Skip Ad' : `Please wait...`}
          </button>
        </div>
      )}
    </div>
  );
} 
