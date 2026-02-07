'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Mark as dynamic to prevent SSR issues with localStorage
// Client component - no SSR needed
export const dynamic = 'force-dynamic';
// Prevent any prerendering attempts during build
export const prerender = false;

export default function QualificationCheckPage() {
  const router = useRouter();
  const t = (key: string) => key;
  const [currentStep, setCurrentStep] = useState('video');
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [qualified, setQualified] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    try {
      const invitationData = localStorage.getItem('invitation-data');
      if (invitationData && invitationData.trim()) {
        try {
          setUserInfo(JSON.parse(invitationData));
        } catch (e) {
          console.error('Failed to parse invitation-data from localStorage:', e);
          // Clear invalid data
          try {
            localStorage.removeItem('invitation-data');
          } catch (clearErr) {
            // Ignore storage errors
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load invitation data:', e);
    }
  }, [mounted]);

  const handleVideoComplete = () => {
    setVideoCompleted(true);
    setCurrentStep('checking');
    startQualificationCheck();
  };

  const startQualificationCheck = () => {
    if (typeof window === 'undefined') return; // Safety check for SSR
    
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += Math.random() * 15 + 5;
      setProgress(Math.min(progressValue, 100));
      
      if (progressValue >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          determineQualification();
        }, 1000);
      }
    }, 500);
  };

  const determineQualification = () => {
    // Safety: Never execute during SSR/build
    if (typeof window === 'undefined' || !mounted) {
      setQualified(true);
      setCurrentStep('result');
      setShowResult(true);
      return;
    }
    
    try {
      const qualificationFactors = {
        region: checkRegion(),
        email: checkEmailDomain(),
        timing: checkInvitationTiming(),
        randomFactor: typeof Math !== 'undefined' && Math.random ? Math.random() > 0.3 : true
      };

      const factorsArray = Object.values(qualificationFactors);
      if (!factorsArray || !Array.isArray(factorsArray) || typeof factorsArray.filter !== 'function') {
        setQualified(true);
        setCurrentStep('result');
        setShowResult(true);
        return;
      }
      
      const validFactors = factorsArray.filter(Boolean);
      if (!validFactors || typeof validFactors !== 'object' || typeof validFactors.length !== 'number') {
        setQualified(true);
        setCurrentStep('result');
        setShowResult(true);
        return;
      }
      
      const validFactorsLength = validFactors.length || 0;
      const isQualified = validFactorsLength >= 2;
      
      setQualified(isQualified);
      setCurrentStep('result');
      setShowResult(true);
    } catch (error) {
      console.error('Qualification check error:', error);
      // Default to qualified if there's an error
      setQualified(true);
      setCurrentStep('result');
      setShowResult(true);
    }
  };

  const checkRegion = () => {
    // Safety: Never execute during SSR/build
    if (typeof window === 'undefined' || !mounted) return true;
    
    try {
      const allowedRegions = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia'];
      if (!Array.isArray(allowedRegions)) return true;
      return userInfo?.location ? allowedRegions.includes(userInfo.location) : true;
    } catch (error) {
      console.error('Region check error:', error);
      return true;
    }
  };

  const checkEmailDomain = () => {
    // Safety: Never execute during SSR/build
    if (typeof window === 'undefined' || !mounted) return true;
    
    try {
      if (!userInfo?.email || typeof userInfo.email !== 'string') return true;
      const professionalDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'company.com'];
      if (!Array.isArray(professionalDomains)) return true;
      const emailStr = String(userInfo.email);
      return professionalDomains.some(domain => emailStr.includes(domain));
    } catch (error) {
      console.error('Email domain check error:', error);
      return true;
    }
  };

  const checkInvitationTiming = () => {
    // Safety: Never execute during SSR/build
    if (typeof window === 'undefined' || !mounted) return true;
    
    try {
      const now = new Date();
      const hour = now.getHours();
      return hour >= 9 && hour <= 21;
    } catch (error) {
      console.error('Timing check error:', error);
      return true;
    }
  };

  const handleContinue = () => {
    if (!isClient || !router) return;
    try {
      if (qualified) {
        router.push('/language-selection');
      } else {
        router.push('/invitation');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to window.location if router fails
      if (typeof window !== 'undefined') {
        window.location.href = qualified ? '/language-selection' : '/invitation';
      }
    }
  };

  const VideoSection = () => (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-[#0B4422] mb-6">
        Welcome to the DrishiQ Experience
      </h2>
      <p className="text-gray-600 mb-8">
        Watch this short video to learn more about what makes DrishiQ special
      </p>
      
      <div className="relative bg-black rounded-lg overflow-hidden mb-6 mx-auto max-w-2xl">
        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1"></div>
            </div>
            <p className="text-sm opacity-80">Click to play video</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setVideoCompleted(true)}
          className="px-6 py-2 text-[#0B4422] border border-[#0B4422] rounded-lg hover:bg-[#0B4422] hover:text-white transition-colors"
        >
          Skip Video
        </button>
        <button
          onClick={handleVideoComplete}
          className="px-6 py-3 bg-[#0B4422] text-white rounded-lg hover:bg-[#083318] transition-colors"
        >
          Continue After Video
        </button>
      </div>
    </div>
  );

  const CheckingSection = () => (
    <div className="text-center">
      <div className="animate-pulse mb-6">
        <div className="w-16 h-16 bg-[#0B4422] rounded-full mx-auto mb-4 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-[#0B4422] mb-4">
        Checking Your Qualification...
      </h2>
      
      <div className="max-w-md mx-auto mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-[#0B4422] to-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">{Math.round(progress)}% Complete</p>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        {[
          { id: 'verify', text: 'Verifying your information...', color: 'bg-green-500' },
          { id: 'check', text: 'Checking availability in your region...', color: 'bg-green-500' },
          { id: 'finalize', text: 'Finalizing qualification status...', color: 'bg-yellow-500', animate: true }
        ].map((item) => (
          <div key={item.id} className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 ${item.color} rounded-full ${item.animate ? 'animate-pulse' : ''}`}></div>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const ResultSection = () => (
    <div className="text-center">
      {qualified ? (
        <div className="animate-fade-in">
          <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-green-600 mb-4">
            🎉 Congratulations!
          </h2>
          
          <p className="text-lg text-gray-700 mb-6">
            You qualify for early access to DrishiQ! 
            <br />
            <span className="text-[#0B4422] font-semibold">
              Welcome to the future of intelligent perception.
            </span>
          </p>
          
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-green-800 mb-2">What&apos;s Next?</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Select your preferred language</li>
              <li>• Complete your profile setup</li>
              <li>• Start your DrishiQ journey</li>
            </ul>
          </div>
          
          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-[#0B4422] text-white rounded-lg hover:bg-[#083318] transition-colors font-semibold"
          >
            Continue to Language Selection
          </button>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="w-20 h-20 bg-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-orange-600 mb-4">
            Almost There!
          </h2>
          
          <p className="text-lg text-gray-700 mb-6">
            We&apos;re not quite ready for you yet, but don&apos;t worry!
            <br />
            <span className="text-[#0B4422] font-semibold">
              You&apos;re on our priority list for the next invitation round.
            </span>
          </p>
          
          <div className="bg-orange-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-orange-800 mb-2">What This Means</h3>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Your information is saved and verified</li>
              <li>• You&apos;ll be notified when the next round opens</li>
              <li>• Priority access based on your application</li>
            </ul>
          </div>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-[#0B4422] text-white rounded-lg hover:bg-[#083318] transition-colors"
            >
              Update My Information
            </button>
            <button
              onClick={() => {
                if (isClient && router) {
                  try {
                    router.push('/');
                  } catch (error) {
                    if (typeof window !== 'undefined') {
                      window.location.href = '/';
                    }
                  }
                }
              }}
              className="px-6 py-3 text-[#0B4422] border border-[#0B4422] rounded-lg hover:bg-[#0B4422] hover:text-white transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // During SSR/build, return a safe fallback
  if (!mounted || typeof window === 'undefined') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <Image
              src="/assets/logo/Logo.png"
              alt="DrishiQ Logo"
              width={180}
              height={80}
              className="mx-auto mb-4"
            />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Image
            src="/assets/logo/Logo.png"
            alt="DrishiQ Logo"
            width={180}
            height={80}
            className="mx-auto mb-4"
          />
          <p className="text-gray-600">
            We&apos;ve identified potential areas where DrishiQ can help based on your responses.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 min-h-[500px] flex items-center justify-center">
          {currentStep === 'video' && <VideoSection />}
          {currentStep === 'checking' && <CheckingSection />}
          {currentStep === 'result' && <ResultSection />}
        </div>

        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            {['video', 'checking', 'result'].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${currentStep === step ? 'bg-[#0B4422]' : 'bg-gray-300'}`}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
