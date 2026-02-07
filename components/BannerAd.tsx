'use client';

import { useEffect, useState } from 'react';

interface AdData {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  bg: string;
  icon: string;
  urgent?: boolean;
}

interface BannerAdProps {
  variant?: 'default' | 'compact';
  className?: string;
}

const t = (key: string): string => key;

const BannerAd: React.FC<BannerAdProps> = ({ variant = 'default', className = '' }) => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  const defaultAds: AdData[] = [
    {
      id: 'invitation',
      title: t('ads.invitation.title'),
      subtitle: t('ads.invitation.subtitle'),
      cta: t('ads.invitation.cta'),
      link: "/invitation",
      bg: "from-[#0B4422] to-green-600",
      icon: "lightning",
      urgent: true
    },
    {
      id: 'experience',
      title: t('ads.experience.title'),
      subtitle: t('ads.experience.subtitle'),
      cta: t('ads.experience.cta'),
      link: "/#about",
      bg: "from-blue-600 to-[#0B4422]",
      icon: "eye"
    },
    {
      id: 'early-access',
      title: t('ads.early_access.title'),
      subtitle: t('ads.early_access.subtitle'),
      cta: t('ads.early_access.cta'),
      link: "/",
      bg: "from-purple-600 to-[#0B4422]",
      icon: "star",
      urgent: true
    },
    {
      id: 'community',
      title: t('ads.community.title'),
      subtitle: t('ads.community.subtitle'),
      cta: t('ads.community.cta'),
      link: "/invitation",
      bg: "from-orange-600 to-[#0B4422]",
      icon: "users"
    }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % defaultAds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [mounted, defaultAds.length]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'lightning':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        );
      case 'eye':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        );
      case 'star':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      case 'users':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (!mounted || !isVisible) return null;

  const currentAd = defaultAds[currentAdIndex];

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r ${currentAd.bg} text-white p-4 rounded-lg shadow-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {getIcon(currentAd.icon)}
            </div>
            <div>
              <h3 className="text-sm font-semibold">{currentAd.title}</h3>
              <p className="text-xs opacity-90">{currentAd.subtitle}</p>
            </div>
          </div>
          <a
            href={currentAd.link}
            className="bg-white text-[#0B4422] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            {currentAd.cta}
          </a>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 text-white opacity-70 hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative bg-gradient-to-r ${currentAd.bg} text-white p-6 rounded-xl shadow-xl ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {getIcon(currentAd.icon)}
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">{currentAd.title}</h3>
            <p className="text-sm opacity-90">{currentAd.subtitle}</p>
          </div>
        </div>
        <a
          href={currentAd.link}
          className="bg-white text-[#0B4422] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          {currentAd.cta}
        </a>
      </div>
      
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-4 right-4 text-white opacity-70 hover:opacity-100 transition-opacity"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {currentAd.urgent && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          {t('common.urgent')}
        </div>
      )}
    </div>
  );
};

export default BannerAd;
