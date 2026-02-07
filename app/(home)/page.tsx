'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Footer from '@/components/Footer';
import OptimizedButton from '@/components/OptimizedButton';
import ClickableCard from '@/components/ClickableCard';
import { useLanguage } from '@/lib/drishiq-i18n';
import { useButtonRedirect } from '@/hooks/useButtonRedirect';
// Dynamic import with chunk-load error handling (avoids crash when chunk is stale/missing)
const OnboardingConciergeOverlay = dynamic(
  () =>
    import('@/components/OnboardingConciergeOverlay').catch(() => ({
      default: () => null,
    })),
  { ssr: false, loading: () => null }
);

const BannerCarousel = dynamic(() => import('@/components/BannerCarousel'), {
  ssr: true,
});
const FeaturedBlogCards = dynamic(() => import('@/components/FeaturedBlogCards'), { ssr: true });
const ServicesFlipSlider = dynamic(() => import('@/components/ServicesFlipSlider'), { ssr: true });

/** Simple helper: initials */
const getInitials = (name?: string) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/** Checks whether a string is a usable image src */
const isValidImageSrc = (src?: string) => {
  if (!src) return false;
  return /^(https?:\/\/|\/|data:)/i.test(src);
};

/** Reusable 4px silver divider used after every section */
function SilverDivider({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`w-full h-[4px] ${className} bg-gradient-to-r from-[#d9d9db] via-[#ffffff] to-[#d9d9db]`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }}
    />
  );
}

/** Helper component for Hero section buttons with redirect support */
function HeroSectionButton({ buttonText }: { buttonText: string }) {
  // Check both 'Hero section' and 'banner' sections for redirects (always call hooks)
  const heroRedirect = useButtonRedirect('Hero section', buttonText, undefined);
  const bannerRedirect = useButtonRedirect('banner', buttonText, undefined);
  
  // Check if this is the "meet yourself" button (special case - open dropdown instead of redirecting)
  // Normalize: remove emojis, lowercase, trim, and normalize spaces
  const normalizedButtonText = buttonText
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim();
  
  const isMeetYourself = 
    normalizedButtonText.includes('meet your self') || 
    normalizedButtonText.includes('meet yourself') ||
    normalizedButtonText === 'meet your self' ||
    normalizedButtonText === 'meet yourself';
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find the Meet Yourself dropdown button in the header and click it
    const findAndClickDropdown = () => {
      // Try multiple selectors to find the dropdown trigger button
      const selectors = [
        'button.dropdown-trigger',
        '[class*="dropdown-trigger"]',
        'button[title*="Meet Yourself"]',
        'button[title*="meet yourself"]'
      ];
      
      for (const selector of selectors) {
        const buttons = document.querySelectorAll(selector);
        for (const button of Array.from(buttons)) {
          const buttonElement = button as HTMLButtonElement;
          const buttonText = buttonElement.textContent?.toLowerCase() || '';
          const buttonTitle = buttonElement.getAttribute('title')?.toLowerCase() || '';
          
          // Check if it's the Meet Yourself button
          if (buttonText.includes('meet yourself') || 
              buttonText.includes('meet your self') ||
              buttonTitle.includes('meet yourself') ||
              buttonTitle.includes('meet your self')) {
            buttonElement.click();
            return true;
          }
        }
      }
      return false;
    };
    
    // Try to find header element and scroll to it
    const header = document.querySelector('header') || 
                   document.querySelector('.header-container') ||
                   document.querySelector('[class*="header"]');
    
    if (header) {
      // Scroll to header smoothly
      header.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Try to click dropdown after scroll
      setTimeout(() => {
        if (!findAndClickDropdown()) {
          // Fallback: dispatch custom event
          const event = new CustomEvent('openMeetYourselfDropdown', { bubbles: true });
          window.dispatchEvent(event);
          document.dispatchEvent(event);
        }
      }, 500);
    } else {
      // If header not found, try to click immediately
      if (!findAndClickDropdown()) {
        // Fallback: dispatch custom event
        const event = new CustomEvent('openMeetYourselfDropdown', { bubbles: true });
        window.dispatchEvent(event);
        document.dispatchEvent(event);
      }
    }
  };
  
  if (isMeetYourself) {
    return (
      <button 
        type="button"
        onClick={handleClick} 
        className="banner-cta-button"
      >
        {buttonText}
      </button>
    );
  }
  
  const redirectUrl = heroRedirect || bannerRedirect || '/signup';
  return (
    <OptimizedButton href={redirectUrl} className="banner-cta-button">
      {buttonText}
    </OptimizedButton>
  );
}

/** Helper component for About section buttons with redirect support */
function AboutSectionButton({ buttonText }: { buttonText: string }) {
  const redirectUrl = useButtonRedirect('about', buttonText, '/request');
  return (
    <OptimizedButton
      href={redirectUrl}
      className="about-section__join-button inline-block ml-2"
    >
      {buttonText}
    </OptimizedButton>
  );
}

/** Helper component for Areas section buttons with redirect support */
function AreasSectionButton({ buttonText }: { buttonText: string }) {
  const redirectUrl = useButtonRedirect('Areas we', buttonText, '/request');
  return (
    <OptimizedButton href={redirectUrl} className="banner-cta-button">
      {buttonText}
    </OptimizedButton>
  );
}

/** Helper component for Choose Path section buttons with redirect support */
function ChoosePathButton({ buttonKey, buttonText }: { buttonKey: string; buttonText: string }) {
  const redirectUrl = useButtonRedirect('choose your path', buttonText, undefined);
  // If no redirect, use default paths based on key
  const defaultHref = redirectUrl || (
    buttonKey === 'build' ? '/grow-with-us/collaborators-creators' :
    buttonKey === 'early_access' ? '/request' :
    buttonKey === 'support' ? '/support' :
    buttonKey === 'gift' ? '/priceplan#gift-section' :
    '/request'
  );
  return (
    <OptimizedButton href={defaultHref} className="banner-cta-button">
      {buttonText}
    </OptimizedButton>
  );
}

/** Helper component for Choose Path section cards with redirect support */
function ChoosePathCard({ cardKey, cardTitle, children }: { cardKey: string; cardTitle: string; children: React.ReactNode }) {
  const redirectUrl = useButtonRedirect('choose your path', cardTitle, undefined);
  // If no redirect, use default paths based on key
  const defaultHref = redirectUrl || (
    cardKey === 'build' ? '/grow-with-us/collaborators-creators' :
    cardKey === 'early_access' ? '/request' :
    cardKey === 'support' ? '/support' :
    cardKey === 'gift' ? '/priceplan#gift-section' :
    '/request'
  );
  return (
    <ClickableCard href={defaultHref} className="choose-path-section__card group relative p-6 border rounded-lg bg-white shadow-sm">
      {children}
    </ClickableCard>
  );
}

/** Helper component for Features section buttons with redirect support */
function FeaturesSectionButton({ buttonText }: { buttonText: string }) {
  const redirectUrl = useButtonRedirect('features', buttonText, '/request');
  return (
    <OptimizedButton href={redirectUrl} className="banner-cta-button">
      {buttonText}
    </OptimizedButton>
  );
}

/** Helper component for Grow With Us section buttons with redirect support */
function GrowWithUsButton({ buttonText }: { buttonText: string }) {
  const redirectUrl = useButtonRedirect('grow with us', buttonText, '/signup#grow');
  return (
    <OptimizedButton href={redirectUrl} className="banner-cta-button">
      {buttonText}
    </OptimizedButton>
  );
}

/** Helper component for Human Connection section buttons with redirect support */
function HumanConnectionButton({ buttonText }: { buttonText: string }) {
  const redirectUrl = useButtonRedirect('human connection', buttonText, '/support');
  return (
    <OptimizedButton href={redirectUrl} className="banner-cta-button">
      {buttonText}
    </OptimizedButton>
  );
}

/** Helper component for Mental Focus section buttons with redirect support */
function MentalFocusButton({ buttonText }: { buttonText: string }) {
  const redirectUrl = useButtonRedirect('mental fo', buttonText, '/request');
  return (
    <OptimizedButton href={redirectUrl} className="banner-cta-button">
      {buttonText}
    </OptimizedButton>
  );
}

/** Helper component for Testimonials section buttons with redirect support */
function TestimonialsSectionButton({ buttonText }: { buttonText: string }) {
  // Check 'banner', 'Testimonials' sections for button redirects
  const bannerRedirect = useButtonRedirect('banner', buttonText, undefined);
  const testimonialsRedirect = useButtonRedirect('Testimonials', buttonText, undefined);
  const redirectUrl = testimonialsRedirect || bannerRedirect || '/testimonials/submit';
  return (
    <OptimizedButton href={redirectUrl} className="banner-cta-button">
      {buttonText}
    </OptimizedButton>
  );
}

/** Helper component for Testimonials inline link buttons */
function TestimonialsLinkButton({ buttonText }: { buttonText: string }) {
  const redirectUrl = useButtonRedirect('Testimonials', buttonText, '/testimonials');
  return (
    <OptimizedButton 
      href={redirectUrl} 
      className="inline text-emerald-600 hover:text-emerald-700 underline decoration-2 underline-offset-2 font-semibold transition-colors duration-200 cursor-pointer bg-transparent border-0 p-0 m-0"
    >
      {buttonText}
    </OptimizedButton>
  );
}

// Guide Button Component with gender-based avatar
function GuideButton({ onOpen }: { onOpen: () => void }) {
  const [gender, setGender] = useState<string | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string>('/assets/avatar/users/avatar confide.png');

  useEffect(() => {
    // Get gender from sessionStorage (userInfo) or localStorage
    const getUserGender = () => {
      try {
        // Check sessionStorage first (from user-info page)
        const userInfoStr = sessionStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          if (userInfo.gender) {
            return userInfo.gender.toLowerCase();
          }
        }
        
        // Check localStorage (from profile)
        const profileStr = localStorage.getItem('userProfile');
        if (profileStr) {
          const profile = JSON.parse(profileStr);
          if (profile.gender) {
            return profile.gender.toLowerCase();
          }
        }
      } catch (e) {
        console.warn('Failed to parse user info for gender:', e);
      }
      return null;
    };

    const userGender = getUserGender();
    setGender(userGender);
    
    // Set avatar based on gender
    const isFemale = userGender === 'female' || userGender === 'f';
    setAvatarSrc(isFemale 
      ? '/assets/avatar/users/girlcurly.png'
      : '/assets/avatar/users/avatar confide.png'
    );
  }, []);

  return (
    <button
      onClick={onOpen}
      className="fixed right-6 z-50 bg-green-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center gap-2"
      aria-label="Talk to a guide"
      style={{ bottom: '100px' }} // Well above footer (100px from bottom)
    >
      <Image
        src={avatarSrc}
        alt="Guide"
        width={24}
        height={24}
        className="w-6 h-6 rounded-full object-cover"
        unoptimized
      />
      <span className="text-sm font-medium">Talk to a guide</span>
    </button>
  );
}

function HomePageContent() {
  const router = useRouter();
  // load all namespaces we need
  const { t, language, isLoading, translationsLoaded } = useLanguage([
    'home_static',
    'home_dynamic',
    'areas',
    'footer',
    'common',
  ]);

  // Onboarding Concierge overlay state
  const [showOnboardingConcierge, setShowOnboardingConcierge] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('HomePage: Component mounted, language =', language);
  }, [language]);

  // Check if user has seen onboarding before (from localStorage)
  useEffect(() => {
    const hasSeen = localStorage.getItem('onboarding_concierge_seen');
    setHasSeenOnboarding(!!hasSeen);
    
    // Show on first visit (or when feature flag is enabled)
    // For now, show on first visit only
    if (!hasSeen && !showOnboardingConcierge) {
      // Small delay to let page load
      const timer = setTimeout(() => {
        setShowOnboardingConcierge(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Mark as seen when overlay is closed
  const handleOnboardingClose = () => {
    setShowOnboardingConcierge(false);
    localStorage.setItem('onboarding_concierge_seen', 'true');
    setHasSeenOnboarding(true);
  };

  // rolling hero messages - combine home.hero and banner as fallback
  const heroMessages = useMemo(() => {
    // home_static.hero messages expected as objects
    const homeMsgs = [
      t('home_static.hero.message1', { returnObjects: true }) || {},
      t('home_static.hero.message2', { returnObjects: true }) || {},
      t('home_static.hero.message3', { returnObjects: true }) || {},
      t('home_static.hero.message4', { returnObjects: true }) || {},
      t('home_static.hero.message5', { returnObjects: true }) || {},
      t('home_static.hero.message6', { returnObjects: true }) || {},
    ];

    // banner messages come in numeric keys; convert to array
    const bannerObj = t('home_dynamic.banner', { returnObjects: true }) || {};
    const bannerMsgs = Object.keys(bannerObj)
      .sort()
      .map(k => bannerObj[k])
      .filter(Boolean)
      .map((b: any) => ({
        title: b.title,
        subtitle: b.text,
        button: b.cta,
      }));

    // prefer home hero if populated, otherwise banner
    const merged = homeMsgs
      .map((m: any) => ({
        title: m.title || '',
        subtitle: m.subtitle || '',
        button: m.button || '',
      }))
      .filter((m: any) => m.title || m.subtitle || m.button);

    if (merged.length > 0) return merged.concat(bannerMsgs).slice(0, 6);
    return bannerMsgs.slice(0, 6);
  }, [t]);

  // rolling index
  const [currentMessage, setCurrentMessage] = useState(0);

  // testimonials
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  // fetch testimonials (with abort controller) - defer loading to not block initial render
  useEffect(() => {
    const ac = new AbortController();
    let didCancel = false;

    const fetchTestimonials = async () => {
      try {
        setLoadingTestimonials(true);
        const cacheKey = `testimonials.v3.${language}`; // Language-specific cache key
        let cached = null;
        if (typeof window !== 'undefined') {
          try {
            cached = sessionStorage.getItem(cacheKey);
          } catch (e) {
            // Ignore sessionStorage errors
          }
        }
        if (cached && cached.trim()) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              setTestimonials(parsed);
              setLoadingTestimonials(false);
              return; // Use cached data immediately
            }
          } catch (e) {
            // Ignore parsing errors - clear invalid cache
            console.warn('Failed to parse cached testimonials, clearing cache:', e);
            try {
              sessionStorage.removeItem(cacheKey);
            } catch (clearErr) {
              // Ignore storage errors
            }
          }
        }

        // Defer API call slightly to allow page to render first
        await new Promise(resolve => setTimeout(resolve, 100));

        if (didCancel) return;

        let res: Response;
        try {
          res = await fetch(
            `/api/testimonials?limit=3&featured=true&language=${language}&t=${Date.now()}&v=3`,
            { signal: ac.signal }
          );
        } catch (fetchError: any) {
          // Handle network errors (CORS, connection refused, etc.)
          if ((fetchError as any).name === 'AbortError') {
            throw fetchError; // Re-throw abort errors to be handled by outer catch
          }
          console.error('Network error fetching testimonials:', fetchError);
          // Don't throw - just use empty array as fallback
          if (!didCancel) {
            setTestimonials([]);
            setLoadingTestimonials(false);
          }
          return;
        }

        if (!res.ok) {
          let errorText = '';
          try {
            errorText = await res.text();
          } catch (e) {
            errorText = 'Unable to read error response';
          }
          console.error('Homepage testimonials API error:', res.status, errorText);
          // Don't throw - just use empty array as fallback
          if (!didCancel) {
            setTestimonials([]);
            setLoadingTestimonials(false);
          }
          return;
        }
        
        let payload;
        try {
          const responseText = await res.text();
          if (!responseText || !responseText.trim()) {
            console.warn('Empty response from testimonials API');
            payload = { testimonials: [] };
          } else {
            payload = JSON.parse(responseText);
          }
        } catch (parseError) {
          console.error('Failed to parse testimonials API response:', parseError);
          payload = { testimonials: [] };
        }
        
        const items = payload?.testimonials ?? [];
        console.log('Homepage - Fetched featured testimonials:', items.length, items);
        if (!didCancel) {
          setTestimonials(items);
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(items));
            } catch (e) {
              // Ignore sessionStorage errors
            }
          }
        }
      } catch (err) {
        if ((err as any).name !== 'AbortError') {
          console.error('Error fetching testimonials:', err);
        }
      } finally {
        if (!didCancel) setLoadingTestimonials(false);
      }
    };

    // Defer testimonials loading slightly to prioritize page render
    const timeoutId = setTimeout(fetchTestimonials, 50);
    
    return () => {
      didCancel = true;
      ac.abort();
      clearTimeout(timeoutId);
    };
  }, [language]); // Refetch when language changes

  // rotate hero/banner messages
  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % Math.max(1, heroMessages.length));
    }, 6000);
    return () => clearInterval(interval);
  }, [heroMessages.length]);

  // Avatar renderer
  const Avatar = ({ testimonial }: { testimonial: any }) => {
    const uploaded = testimonial?.user_image;
    const selected = testimonial?.selected_avatar;
    const name = testimonial?.user_name;
    const [imageError, setImageError] = useState(false);

    // If image error occurred, show initials
    if (imageError) {
      return <div className="testimonial-avatar">{getInitials(name)}</div>;
    }

    if (uploaded && uploaded.startsWith('data:') && isValidImageSrc(uploaded)) {
      return (
        <div className="testimonial-avatar-wrapper">
          <Image
            src={uploaded}
            alt={name || 'User'}
            width={48}
            height={48}
            className="testimonial-avatar-image"
            onError={() => setImageError(true)}
            unoptimized
          />
        </div>
      );
    }

    if (isValidImageSrc(selected)) {
      // Ensure avatar paths are absolute if they start with /assets
      const avatarSrc = selected.startsWith('/assets') ? selected : selected;
      return (
        <div
          className="testimonial-avatar-wrapper"
          style={{ position: 'relative', width: 48, height: 48 }}
        >
          <Image
            src={avatarSrc}
            alt={name || 'User'}
            width={48}
            height={48}
            className="testimonial-avatar-image"
            style={{ objectFit: 'cover', borderRadius: 8 }}
            onError={() => setImageError(true)}
            unoptimized
          />
        </div>
      );
    }

    return <div className="testimonial-avatar">{getInitials(name)}</div>;
  };

  // Show minimal loading state only if no translations at all are loaded
  // Allow progressive rendering - don't block the entire page
  const hasAnyTranslations = translationsLoaded || !isLoading;

  return (
    <>
      <main className="flex-grow" suppressHydrationWarning>
        {/* HERO SECTION - Using rotating hero messages */}
        <section className="hero-section">
          <div className="hero-section__container">
            {heroMessages.length > 0 && heroMessages[currentMessage] ? (
              <>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  {heroMessages[currentMessage].title || ''}
                </h1>
                <p className="hero-subtitle text-lg text-white mb-4">
                  {heroMessages[currentMessage].subtitle || ''}
                </p>
                {heroMessages[currentMessage].button && (
                  <div className="mt-4">
                    <HeroSectionButton buttonText={heroMessages[currentMessage].button} />
                  </div>
                )}
              </>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  {t('home_static.hero.message1.title', { defaultValue: 'Clarity that speaks your language' })}
                </h1>
                <p className="hero-subtitle text-lg text-white mb-4">
                  {t('home_static.hero.message1.subtitle', { defaultValue: 'When things feel unclear, find direction and move forward with confidence.' })}
                </p>
                <div className="mt-4">
                  <HeroSectionButton buttonText={t('home_static.hero.message1.button', { defaultValue: 'Get Started' })} />
                </div>
              </>
            )}
          </div>
        </section>

        {/* SEO CONTENT SECTIONS - Hidden visually but present for SEO */}
        <section className="section py-12 bg-white sr-only">
          <div className="max-w-4xl mx-auto px-4">
            <h2>What is Drishiq?</h2>
            <p>
              Drishiq is a multilingual clarity assistant that helps you think clearly, make better decisions,
              and take confident action. It works in 12 global languages, supports voice and text, and delivers
              personalised, culturally aware guidance based on your situation.
            </p>
          </div>
        </section>

        <section className="section py-12 bg-gray-50 sr-only">
          <div className="max-w-4xl mx-auto px-4">
            <h2>Why choose Drishiq?</h2>
            <p>
              When life feels confusing or overwhelming, you need clarity that truly understands you. 
              Drishiq helps you break confusion, find direction, and move forward with confidence — 
              all in the language you think and feel in. Whether you speak through voice or type your thoughts, 
              Drishiq listens deeply and gives you clear, actionable next steps that fit your reality.
            </p>
          </div>
        </section>

        <section className="section py-12 bg-white sr-only">
          <div className="max-w-4xl mx-auto px-4">
            <h2>Built for global accessibility</h2>
            <p>
              Drishiq supports 12 major world languages including English, Hindi, Spanish, Arabic, Chinese,
              Portuguese, French, Bengali, Tamil, Japanese, Russian, and German — enabling access to over 
              85% of the world's population. Wherever you are and whatever you speak, clarity is now within reach.
            </p>
          </div>
        </section>

        <SilverDivider />

        {/* Optional BannerCarousel component that can also read t('banner') */}
        <section className="w-full">
          <BannerCarousel />
        </section>

        <SilverDivider />

        {/* About */}
        <section id="about" className="section about-section py-12">
          <div className="max-w-4xl mx-auto px-4 about-section__container">
            <h2 className="about-section__title flex items-center justify-center gap-3 mb-6">
              <Image src="/assets/logo/favicon.png" alt="DrishiQ Logo" width={32} height={32} />
              <button
                className="text-left underline-offset-2 hover:underline"
                onClick={() => router.push('/request')}
              >
                <span
                  dangerouslySetInnerHTML={{
                    __html: t('home_static.about.heading') || '',
                  }}
                />
              </button>
            </h2>

            <p className="about-section__description mt-4">{t('home_static.about.description1')}</p>
            <p className="about-section__description mt-2">{t('home_static.about.description2')}</p>

            <p className="about-section__description mt-4">
              {t('home_static.about.description3.prefix')}{' '}
              <AboutSectionButton buttonText={t('home_static.about.join_button')} />
            </p>

            <p className="about-section__tagline mt-4 italic">{t('home_static.about.tagline')}</p>
          </div>
        </section>

        <SilverDivider />

        {/* Areas */}
        <section className="section areas-section py-12">
          <div className="max-w-6xl mx-auto px-4 areas-section__container">
            <h2 className="areas-section__title">🔍 {t('home_dynamic.areas.heading')}</h2>
            <p className="areas-section__subtitle mt-2">
              {t('home_dynamic.areas.areas_subtitle_long')}
            </p>
            <div className="mt-6">
              <ServicesFlipSlider />
            </div>
            <p className="areas-section__cta mt-6">
              {t('home_dynamic.areas.not_seeing_challenge')}{' '}
            </p>
            <div className="mt-4">
              <AreasSectionButton buttonText={`🚀 ${t('home_dynamic.areas.start_now')}`} />
            </div>
          </div>
        </section>

        <SilverDivider />

        {/* Choose Path */}
        <section className="section choose-path-section py-12">
          <div className="max-w-6xl mx-auto px-4 choose-path-section__container">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-4">
                <span className="choose-path-section__title-icon text-2xl">🚦</span>
                <h2 className="choose-path-section__title text-2xl font-semibold ml-3">
                  {t('home_static.choose_path.title')}
                </h2>
              </div>
              <p className="choose-path-section__description max-w-2xl mx-auto">
                {t('home_static.choose_path.description')}
              </p>
            </div>

            <div className="choose-path-section__grid grid grid-cols-1 md:grid-cols-4 gap-6">
              {Object.entries(
                t('home_static.choose_path.cards', { returnObjects: true }) || {}
              ).map(([k, v]: any) => {
                const emojiMap: { [key: string]: string } = {
                  build: '🔨',
                  early_access: '🔑',
                  support: '🤝',
                  gift: '🎁',
                };
                return (
                  <ChoosePathCard key={k} cardKey={k} cardTitle={v.title}>
                    <div className="choose-path-section__card-content">
                      <div className="choose-path-section__card-icon text-3xl">
                        {emojiMap[k] || '🔹'}
                      </div>
                      <h3 className="choose-path-section__card-title mt-3 text-lg font-medium">
                        {v.title}
                      </h3>
                      <p className="choose-path-section__card-subtitle mt-2 text-sm text-gray-600">
                        {v.subtitle}
                      </p>
                    </div>
                    <div className="choose-path-section__hover-message">
                      {v.hover_message}
                    </div>
                    <div className="choose-path-section__click-message">
                      {t('home_static.choose_path.click_to_know_more')}
                    </div>
                  </ChoosePathCard>
                );
              })}
            </div>
          </div>
        </section>

        <SilverDivider />

        {/* Features */}
        <section id="features" className="features-section py-12">
          <div className="max-w-6xl mx-auto px-4 features-section__container">
            <h2 className="features-section__title">
              ✨ {t('home_static.features.heading_features.title')}
            </h2>
            <p className="features-section__subtitle mt-2">
              {t('home_static.features.heading_features.line1')}
            </p>

            <div className="features-section__grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {[1, 2, 3, 4].map(num => {
                const colorClasses = [
                  'from-blue-50 to-indigo-50 hover:border-blue-200 from-blue-100/20 to-indigo-100/20 border-blue-100 text-blue-500',
                  'from-green-50 to-emerald-50 hover:border-green-200 from-green-100/20 to-emerald-100/20 border-green-100 text-green-500',
                  'from-purple-50 to-pink-50 hover:border-purple-200 from-purple-100/20 to-pink-100/20 border-purple-100 text-purple-500',
                  'from-orange-50 to-red-50 hover:border-orange-200 from-orange-100/20 to-red-100/20 border-orange-100 text-orange-500',
                ];
                const [bgGradient, hoverBorder, overlayGradient, borderColor, bulletColor] =
                  colorClasses[num - 1].split(' ');

                return (
                  <div
                    key={num}
                    className={`features-section__card group relative p-6 border-2 border-gray-100 rounded-2xl bg-gradient-to-br ${bgGradient} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:${hoverBorder}`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${overlayGradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    ></div>
                    <div className="relative z-10">
                      <h3 className="features-section__card-title text-xl font-bold text-gray-800 mb-4">
                        {t(`home_static.features.card${num}.title`)}
                      </h3>
                      <div className="features-section__card-description space-y-3 text-sm text-gray-700">
                        <div className="flex items-start">
                          <span className={`mr-3 ${bulletColor} font-bold`}>•</span>
                          <span>{t(`home_static.features.card${num}.bullet1`)}</span>
                        </div>
                        <div className="flex items-start">
                          <span className={`mr-3 ${bulletColor} font-bold`}>•</span>
                          <span>{t(`home_static.features.card${num}.bullet2`)}</span>
                        </div>
                      </div>
                      <div
                        className={`mt-4 p-3 bg-white/60 rounded-lg border border-${borderColor}`}
                      >
                        <p className="features-section__card-quote text-xs text-gray-600 font-medium">
                          {t(`home_static.features.card${num}.quote`)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="features-section__cta mt-6">
              {t('home_static.features.cta.description')}
            </p>
            <div className="mt-4">
              <FeaturesSectionButton buttonText={t('home_static.features.try_now.button')} />
            </div>
          </div>
        </section>

        <SilverDivider />

        {/* Blog */}
        <section id="blog-insights" className="blog-section py-12">
          <div className="max-w-6xl mx-auto px-4 blog-section__container">
            <h2
              className="blog-section__title text-2xl font-semibold cursor-pointer"
              onClick={() => router.push('/blog')}
            >
              {t('home_dynamic.blog.heading')}
            </h2>
            <p className="blog-section__subtitle mt-2">{t('home_dynamic.blog.subtitle')}</p>
            <div className="mt-6">
              <FeaturedBlogCards />
            </div>
            <div className="mt-6">
              <OptimizedButton href="/blog" className="banner-cta-button">
                {t('home_dynamic.blog.read_more_button')}
              </OptimizedButton>
            </div>
          </div>
        </section>

        <SilverDivider />

        {/* Testimonials */}
        <section id="testimonials-usersay" className="testimonials-section py-12">
          <div className="max-w-6xl mx-auto px-4 testimonials-section__container">
            <h2
              className="testimonials-section__title text-2xl font-semibold cursor-pointer"
              onClick={() => router.push('/testimonials')}
            >
              {' '}
              {t('home_dynamic.testimonials.heading')}
            </h2>
            <p className="testimonials-section__subtitle mt-2">
              ✨{' '}
              <TestimonialsLinkButton buttonText={t('home_dynamic.testimonials.real_stories')} />
              {t('home_dynamic.testimonials.real_stories_suffix')}
            </p>

            <div className="testimonials-grid mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {loadingTestimonials ? (
                <div className="testimonials-loading col-span-1 md:col-span-2 text-center">
                  <div className="loading-spinner mx-auto mb-2" />
                  <p>{t('common.loading')}</p>
                </div>
              ) : testimonials.length > 0 ? (
                testimonials.map((item: any, idx: number) => (
                  <div
                    key={item.id ?? idx}
                    className="testimonial-card p-4 border rounded-lg cursor-pointer"
                    onClick={() => router.push('/testimonials')}
                  >
                    <div className="testimonial-badge text-sm mb-2">
                      {idx === 0
                        ? t('home_dynamic.testimonials.featured_story')
                        : t('home_dynamic.testimonials.user_story')}
                    </div>
                    <div className="testimonial-rating-top text-yellow-500 mb-2">
                      <div className="testimonial-stars">{'★'.repeat(item.rating ?? 5)}</div>
                    </div>

                    <div className="testimonial-content">
                      <div className="testimonial-header flex items-center gap-3 mb-2">
                        <Avatar testimonial={item} />
                        <div className="testimonial-user-info">
                          <h4 className="font-medium">{item.user_name ?? 'User'}</h4>
                          <p className="text-sm text-gray-500">{item.user_role ?? 'Member'}</p>
                        </div>
                      </div>

                      <div className="testimonial-text text-sm">
                        "{item.content ?? t('home_dynamic.testimonials.default_content')}"
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // fallback
                <>
                  <div
                    className="testimonial-card p-4 border rounded-lg"
                    onClick={() => router.push('/testimonials')}
                  >
                    <div className="testimonial-badge mb-2">🌟 Be the First</div>
                    <div className="testimonial-rating-top mb-2">
                      <div className="testimonial-stars">{'★'.repeat(5)}</div>
                    </div>
                    <div className="testimonial-content">
                      <div className="testimonial-header flex items-center gap-3 mb-2">
                        <div className="testimonial-avatar">?</div>
                        <div className="testimonial-user-info">
                          <h4 className="font-medium">No testimonials yet</h4>
                          <p className="text-sm text-gray-500">Share your story first!</p>
                        </div>
                      </div>
                      <div className="testimonial-text text-sm">
                        "Be the first to share your DrishiQ experience!"
                      </div>
                    </div>
                  </div>

                  <div
                    className="testimonial-card p-4 border rounded-lg"
                    onClick={() => router.push('/testimonials')}
                  >
                    <div className="testimonial-badge mb-2">✨ Join Us</div>
                    <div className="testimonial-rating-top mb-2">
                      <div className="testimonial-stars">{'★'.repeat(5)}</div>
                    </div>
                    <div className="testimonial-content">
                      <div className="testimonial-header flex items-center gap-3 mb-2">
                        <div className="testimonial-avatar">+</div>
                        <div className="testimonial-user-info">
                          <h4 className="font-medium">Community</h4>
                          <p className="text-sm text-gray-500">Growing together</p>
                        </div>
                      </div>
                      <div className="testimonial-text text-sm">
                        "Join our community and share your growth!"
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="testimonials-section__cta mt-8 text-center">
              <h3 className="text-lg font-medium">
                {(t('home_dynamic.testimonials.one_story') || '').replace(' —', '')}
              </h3>
              <div className="mt-3">
                <TestimonialsSectionButton buttonText={`✨ ${t('home_dynamic.testimonials.share_story')}`} />
              </div>
            </div>
          </div>
        </section>

        <SilverDivider />

        {/* Grow With Us */}
        <section id="grow-with-us" className="grow-with-us-section py-12">
          <div className="max-w-6xl mx-auto px-4 grow-with-us-section__container">
            <div className="text-center mb-12">
              <h2 className="grow-with-us-section__title text-2xl font-semibold">
                <span className="grow-with-us-section__title-icon">✨</span>{' '}
                {t('home_static.grow_with_us.title')}
              </h2>
              <p className="grow-with-us-section__description mt-2">
                {t('home_static.grow_with_us.subtitle')}
              </p>
            </div>

            <div className="grow-with-us-section__pathways-row grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(
                t('home_static.grow_with_us.roles', { returnObjects: true }) || {}
              ).map(([key, role]: any) => {
                // Map role keys to their respective page paths (supports both singular and plural)
                const roleToPath: { [key: string]: string } = {
                  ambassadors: '/grow-with-us/ambassadors',
                  ambassador: '/grow-with-us/ambassadors',
                  affiliates: '/grow-with-us/affiliates',
                  affiliate: '/grow-with-us/affiliates',
                  collaborators: '/grow-with-us/collaborators-creators',
                  creator: '/grow-with-us/collaborators-creators',
                  investors: '/grow-with-us/investors',
                  investor: '/grow-with-us/investors',
                  promoters: '/grow-with-us/promoters',
                  promoter: '/grow-with-us/promoters',
                  referrers: '/grow-with-us/referrals',
                  referral: '/grow-with-us/referrals',
                };

                // Define icons and colors for each role (supports both singular and plural keys)
                const roleConfig: {
                  [key: string]: {
                    icon: string;
                    gradient: string;
                    bgGradient: string;
                  };
                } = {
                  ambassadors: {
                    icon: '🌍',
                    gradient: 'from-purple-500 to-pink-500',
                    bgGradient: 'from-purple-50 to-pink-50',
                  },
                  ambassador: {
                    icon: '🌍',
                    gradient: 'from-purple-500 to-pink-500',
                    bgGradient: 'from-purple-50 to-pink-50',
                  },
                  affiliates: {
                    icon: '🤝',
                    gradient: 'from-green-500 to-emerald-500',
                    bgGradient: 'from-green-50 to-emerald-50',
                  },
                  affiliate: {
                    icon: '🤝',
                    gradient: 'from-green-500 to-emerald-500',
                    bgGradient: 'from-green-50 to-emerald-50',
                  },
                  collaborators: {
                    icon: '🎨',
                    gradient: 'from-orange-500 to-red-500',
                    bgGradient: 'from-orange-50 to-red-50',
                  },
                  creator: {
                    icon: '🎨',
                    gradient: 'from-orange-500 to-red-500',
                    bgGradient: 'from-orange-50 to-red-50',
                  },
                  investors: {
                    icon: '💡',
                    gradient: 'from-blue-500 to-indigo-500',
                    bgGradient: 'from-blue-50 to-indigo-50',
                  },
                  investor: {
                    icon: '💡',
                    gradient: 'from-blue-500 to-indigo-500',
                    bgGradient: 'from-blue-50 to-indigo-50',
                  },
                  promoters: {
                    icon: '📢',
                    gradient: 'from-pink-500 to-rose-500',
                    bgGradient: 'from-pink-50 to-rose-50',
                  },
                  promoter: {
                    icon: '📢',
                    gradient: 'from-pink-500 to-rose-500',
                    bgGradient: 'from-pink-50 to-rose-50',
                  },
                  referrers: {
                    icon: '🔗',
                    gradient: 'from-cyan-500 to-teal-500',
                    bgGradient: 'from-cyan-50 to-teal-50',
                  },
                  referral: {
                    icon: '🔗',
                    gradient: 'from-cyan-500 to-teal-500',
                    bgGradient: 'from-cyan-50 to-teal-50',
                  },
                };

                const config = roleConfig[key] || {
                  icon: '✨',
                  gradient: 'from-gray-500 to-gray-600',
                  bgGradient: 'from-gray-50 to-gray-100',
                };

                return (
                  <div
                    key={key}
                    className={`group relative bg-gradient-to-br ${config.bgGradient} rounded-xl p-6 pb-5 cursor-pointer hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 hover:border-gray-200 text-center`}
                    onClick={() =>
                      router.push(
                        roleToPath[key] || `/grow-with-us/interest?role=${encodeURIComponent(key)}`
                      )
                    }
                  >
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Icon with gradient background */}
                    <div
                      className={`relative z-10 w-12 h-12 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center text-xl mb-3 mx-auto group-hover:scale-110 transition-transform duration-300`}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex flex-col h-full">
                      <h3 className="text-sm font-bold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors duration-200">
                        {role.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-4 leading-tight group-hover:text-gray-700 transition-colors duration-200 flex-grow">
                        {role.description}
                      </p>

                      {/* CTA Arrow */}
                      <div className="flex items-center justify-center text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200 mt-auto pb-1">
                        <span>{t('home_static.grow_with_us.learn_more')}</span>
                        <svg
                          className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <p className="grow-with-us-section__closing-line">
                {t('home_static.grow_with_us.cards_cta')}
              </p>
              <div className="mt-4">
                <GrowWithUsButton buttonText={t('home_static.grow_with_us.join_button')} />
              </div>
            </div>
          </div>
        </section>

        <SilverDivider />

        {/* CTA / Features bridge */}
        <section id="clarity-anchor" className="cta-section py-12">
          <div className="max-w-6xl mx-auto px-4 cta-section__container">
            <h2
              className="cta-section__heading text-2xl font-semibold cursor-pointer"
              onClick={() => router.push('/request')}
            >
              {t('home_static.features.heading_bridge') || 'Human Connection'}
            </h2>
            <p className="cta-section__description mt-2">{t('home_static.features.description')}</p>

            <div className="cta-section__cards-container grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <ClickableCard
                href="/support"
                className="cta-section__card p-6 border rounded-lg"
              >
                <h3 className="text-lg font-medium">
                  {' '}
                  {t('home_static.features.giver_card.title')}
                </h3>
                {(() => {
                  const textLines = t('home_static.features.giver_card.text_lines', {
                    returnObjects: true,
                  });
                  if (Array.isArray(textLines)) {
                    return textLines.map((ln: string, i: number) => (
                      <p key={i} className="mt-2 text-sm">
                        {ln}
                      </p>
                    ));
                  }
                  return null;
                })()}
                <div className="mt-4">
                  <HumanConnectionButton buttonText={t('home_static.features.giver_card.button')} />
                </div>
              </ClickableCard>

              <ClickableCard href="/request" className="cta-section__card p-6 border rounded-lg">
                <h3 className="text-lg font-medium">
                  {' '}
                  {t('home_static.features.needy_card.title')}
                </h3>
                {(() => {
                  const textLines = t('home_static.features.needy_card.text_lines', {
                    returnObjects: true,
                  });
                  if (Array.isArray(textLines)) {
                    return textLines.map((ln: string, i: number) => (
                      <p key={i} className="mt-2 text-sm">
                        {ln}
                      </p>
                    ));
                  }
                  return null;
                })()}
                <div className="mt-4">
                  <OptimizedButton href="/request#sponsor support" className="banner-cta-button">
                    {t('home_static.features.needy_card.button')}
                  </OptimizedButton>
                </div>
              </ClickableCard>
            </div>

            <p className="cta-section__footer-text mt-4 text-sm text-gray-600">
              {t('home_static.features.footer_text')}
            </p>
          </div>
        </section>

        <SilverDivider />

        {/* Mental Fog CTA */}
        <section className="mental-fog-cta py-12">
          <div className="max-w-4xl mx-auto px-4 mental-fog-cta__container text-center">
            <h2 className="mental-fog-cta__title">
              🧠 {t('home_static.mental_fog.title') || 'Ready to clear the mental fog?'}
            </h2>
            <p className="mental-fog-cta__description mt-2">
              {t('home_static.mental_fog.description') ||
                'Start a session with DrishiQ and experience clarity through intelligent reflection.'}
            </p>
            <div className="mt-4">
              <MentalFocusButton buttonText={t('home_static.mental_fog.button') || 'Start session'} />
            </div>
          </div>
        </section>

        <SilverDivider />

        {/* Footer brand box + Footer */}
        <div className="footer-brand-box py-6 flex items-center justify-center gap-3">
          <Image
            src="/assets/logo/favicon.png"
            alt="DrishiQ"
            width={24}
            height={24}
            className="footer-brand-logo"
            unoptimized
          />
          <p className="footer-brand-text">{t('home_static.tagline')}</p>
        </div>

        <SilverDivider />

        <Footer />
      </main>

      {/* Onboarding Concierge Overlay */}
      <OnboardingConciergeOverlay
        isOpen={showOnboardingConcierge}
        onClose={handleOnboardingClose}
      />

      {/* Floating "Talk to a guide" button (shown after dismissing overlay) */}
      {hasSeenOnboarding && !showOnboardingConcierge && (
        <GuideButton onOpen={() => setShowOnboardingConcierge(true)} />
      )}
    </>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
