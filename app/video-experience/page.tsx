'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
// Header component will be added here

interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  transcript: TranscriptSegment[];
}

interface TranscriptSegment {
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

interface BlogTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const VideoExperience = () => {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);

  const sections = [
    {
      title: "Welcome to DrishiQ",
      video: "/assets/videos/intro.mp4",
      transcript: "Welcome to DrishiQ, where we're breaking down language barriers through intelligent communication. Let's explore how DrishiQ transforms the way we connect across languages and cultures.",
    },
    {
      title: "Real-time Translation",
      video: "/assets/videos/translation-demo.mp4",
      transcript: "Watch as DrishiQ instantly translates conversations in real-time, maintaining context and cultural nuances. Our AI understands not just words, but meaning.",
    },
    {
      title: "Smart AI Features",
      video: "/assets/videos/ai-features.mp4",
      transcript: "Experience our context-aware AI in action. See how it adapts to different communication styles and preserves the authenticity of your message across languages.",
    },
    {
      title: "Use Cases",
      video: "/assets/videos/use-cases.mp4",
      transcript: "From business meetings to education and personal connections, discover how DrishiQ is transforming communication across various sectors.",
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
      setIsPlaying(true);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4422] mx-auto mb-4"></div>
          <p className="text-[#0B4422]">Loading Experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header will be added here */}

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Video Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={sections[currentSection].video}
                  className="w-full aspect-video"
                  autoPlay
                  playsInline
                  onEnded={handleNext}
                />
                
                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="flex items-center justify-between text-white">
                    <button
                      onClick={togglePlayPause}
                      className="hover:text-gray-300 transition-colors"
                    >
                      {isPlaying ? '⏸️' : '▶️'}
                    </button>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handlePrevious}
                        disabled={currentSection === 0}
                        className={`${currentSection === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-300'} transition-colors`}
                      >
                        ⬅️
                      </button>
                      <span>{currentSection + 1} / {sections.length}</span>
                      <button
                        onClick={handleNext}
                        disabled={currentSection === sections.length - 1}
                        className={`${currentSection === sections.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-300'} transition-colors`}
                      >
                        ➡️
                      </button>
                    </div>
                    
                    <button
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="hover:text-gray-300 transition-colors"
                    >
                      {showTranscript ? '📝' : '📄'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-[#0B4422] mb-4">
                {sections[currentSection].title}
              </h2>
              
              {showTranscript && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Transcript</h3>
                  <p className="text-gray-600">{sections[currentSection].transcript}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sections</h3>
                <div className="space-y-2">
                  {sections.map((section, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSection(index)}
                      className={`w-full text-left p-3 rounded-md transition-colors ${
                        currentSection === index
                          ? 'bg-[#0B4422] text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
                {/* Join Us Button */}
                <button
                  onClick={() => router.push('/verify-phone')}
                  className="w-full mt-8 bg-[#0B4422] text-white font-bold py-3 rounded-lg shadow-lg hover:bg-[#083318] transition-colors text-lg"
                  style={{ marginTop: '2rem' }}
                >
                  Join Us
                </button>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center bg-[#0B4422] text-white py-12 px-4 rounded-2xl">
            <h2 className="text-3xl font-bold mb-4">Ready to Experience DrishiQ?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Join our growing community and start breaking down language barriers today.
            </p>
            <button
                              onClick={() => router.push('/invitation')}
              className="bg-white text-[#0B4422] px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoExperience;
