'use client';

import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import OptimizedButton from '@/components/OptimizedButton';
import ClickableCard from '@/components/ClickableCard';
import { 
  getAllPricingPlans, 
  detectUserCountry, 
  getCountryInfo, 
  getCurrencyRate,
  DEFAULT_CURRENCY_RATES,
  type CountryInfo,
  type CurrencyRate 
} from '@/lib/pricing-utils';
// Note: Removed auto-language switching to prevent chunk loading errors
// Users can manually change language via header selector
import { useLanguage } from '@/lib/drishiq-i18n';
import { 
  Sparkles, Target, Building2, Flower, Rocket, Waves, Heart,
  Sunrise, Telescope, Gift, Check, ArrowRight
} from 'lucide-react';

// Lazy load heavy components
const CheckoutButton = dynamic(() => import('@/components/CheckoutButton'), {
  loading: () => <div className="h-12 bg-gray-200 animate-pulse rounded" />
});

// Country to Language mapping
const COUNTRY_LANGUAGE_MAP: Record<string, 'en' | 'hi' | 'bn' | 'ta' | 'es'> = {
  'US': 'en', 'CA': 'en', 'GB': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en', 'ZA': 'en',
  'IN': 'hi', 'NP': 'hi', // Hindi speaking countries
  'BD': 'bn', 'IN-BN': 'bn', // Bengali
  'IN-TA': 'ta', 'LK': 'ta', 'SG': 'ta', // Tamil
  'MX': 'es', 'AR': 'es', 'CO': 'es', 'CL': 'es', 'PE': 'es', 'VE': 'es', 'EC': 'es', 'BO': 'es', 'PY': 'es', 'UY': 'es', 'CR': 'es', 'PA': 'es', 'DO': 'es', 'CU': 'es', 'GT': 'es', 'HN': 'es', 'SV': 'es', 'NI': 'es', 'ES': 'es', // Spanish
};

// Test countries for selector
const TEST_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
];

export default function PricePlanEnhanced() {
  const router = useRouter();
  const { t, language, setLanguage, isLoading: langLoading } = useLanguage(['payment', 'common']);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedSupport, setSelectedSupport] = useState<string | null>(null);
  const [useGiftPricing, setUseGiftPricing] = useState<boolean>(false);
  const [showStandardPricing, setShowStandardPricing] = useState<boolean>(false);
  const [showOffer, setShowOffer] = useState(true); // State to control offer visibility
  const [showDefaultPricingIndicator, setShowDefaultPricingIndicator] = useState<boolean>(true); // State to control default pricing indicator visibility
  const [defaultPricingMessage, setDefaultPricingMessage] = useState<string>(''); // State to control the message
  
  // Pricing management state
  const [pricingData, setPricingData] = useState<any[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [editingPricing, setEditingPricing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [showPricingTable, setShowPricingTable] = useState(false);
  
  // User and location state
  const [userCountry, setUserCountry] = useState('IN');
  const [userId, setUserId] = useState('guest');
  const [userEmail, setUserEmail] = useState('guest@example.com');
  const [userName, setUserName] = useState('Guest User');
  const [userPhone, setUserPhone] = useState('9999999999');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Early access state
  const [isEarlyAccess, setIsEarlyAccess] = useState(false);

  // Location-based pricing state
  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [locationPricing, setLocationPricing] = useState<any>(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  // Table-driven pricing state
  type PhasePrice = { base_minor: number; discount_minor: number | null; credits: number };
  const [phasePricing, setPhasePricing] = useState<Record<string, { pre?: PhasePrice; post?: PhasePrice }>>({});
  const [currencyInfo, setCurrencyInfo] = useState<{ code: string; symbol: string; decimals: number }>({ code: 'INR', symbol: '₹', decimals: 2 });
  const [pricingLoadError, setPricingLoadError] = useState<string | null>(null);


  // Initialize default pricing message
  useEffect(() => {
    if (!langLoading && t) {
      setDefaultPricingMessage(t('payment.pricing.defaultPricingIndicator.default'));
    }
  }, [langLoading, t]);

  // Auto-hide default pricing indicator after 2 seconds
  useEffect(() => {
    if (!useGiftPricing && !showStandardPricing) {
      const timer = setTimeout(() => {
        setShowDefaultPricingIndicator(false);
      }, 2000); // Reduced to 2 seconds
      
      return () => clearTimeout(timer);
    } else {
      setShowDefaultPricingIndicator(false); // Hide when pricing is selected
    }
  }, [useGiftPricing, showStandardPricing]);

  // Close country selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.country-selector-container')) {
        setShowCountrySelector(false);
      }
    };

    if (showCountrySelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountrySelector]);

  // Detect user location and load pricing with secure detection
  useEffect(() => {
    const loadLocationPricing = async () => {
      try {
        setPricingLoading(true);
        
        // Check for early access parameter
        const urlParams = new URLSearchParams(window.location.search);
        const earlyAccess = urlParams.get('earlyAccess');
        setIsEarlyAccess(earlyAccess === 'true');

        // Get user session
        const { data: { session } } = await (supabase as any).auth.getSession();
        
        if (session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          setUserEmail(session.user.email || 'user@example.com');
          setUserName(session.user.user_metadata?.full_name || 'User');
          setUserPhone(session.user.user_metadata?.phone || '9999999999');
          
          // Check phone verification status - redirect if not verified
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('phone_verified')
            .eq('id', session.user.id)
            .maybeSingle();
          
          // Also check temporary_signups as fallback
          const { data: tempData } = await supabase
            .from('temporary_signups')
            .select('phone_verified')
            .eq('email', session.user.email || '')
            .maybeSingle();
          
          const isPhoneVerified = userData?.phone_verified || tempData?.phone_verified;
          
          // If user is authenticated but phone is not verified, redirect to phone verification
          if (!isPhoneVerified) {
            console.log('⚠️ Phone not verified - redirecting to phone verification');
            router.push('/apps/phone-verification');
            return;
          }
        }

        // Detect country
        const detectedCountry = await detectUserCountry();
        setUserCountry(detectedCountry);

        // Load country info and currency rates
        const [countryData, ratesResponse] = await Promise.all([
          getCountryInfo(detectedCountry),
          fetch('/api/currency-rates')
        ]);

        if (countryData) {
          setCountryInfo(countryData);
        }

        // Load currency rates
        if (ratesResponse.ok) {
          const rates = await ratesResponse.json();
          setCurrencyRates(rates);
        }

        // Load pricing plans
        const pricingData = await getAllPricingPlans(detectedCountry, currencyRates);
        if (pricingData) {
          setLocationPricing(pricingData);
        }

      } catch (error) {
        console.error('Error loading location pricing:', error);
        setPricingLoadError('Failed to load pricing data');
      } finally {
        setPricingLoading(false);
      }
    };

    loadLocationPricing();
  }, []);

  // Function to handle clicking on the default pricing indicator
  const handleDefaultPricingClick = () => {
    setDefaultPricingMessage(t('payment.pricing.defaultPricingIndicator.clickInstructions'));
    setShowDefaultPricingIndicator(true);
    
    // Reset message and hide after 2 seconds
    setTimeout(() => {
      setDefaultPricingMessage(t('payment.pricing.defaultPricingIndicator.default'));
      setShowDefaultPricingIndicator(false);
    }, 2000);
  };

  // Helper function to get display price based on active pricing mode
  const getDisplayMinor = (planId: string) => {
    const entry = phasePricing[planId];
    if (!entry) return null;
    const phase = showStandardPricing ? entry.post : entry.pre;
    if (!phase) return null;
    return (showStandardPricing ? (phase.discount_minor ?? phase.base_minor) : (phase.discount_minor ?? phase.base_minor));
  };

  const getCurrency = () => ({ code: currencyInfo.code, symbol: currencyInfo.symbol });

  const getCredits = (planId: string) => {
    const entry = phasePricing[planId];
    const phase = showStandardPricing ? entry?.post : entry?.pre;
    return phase ? phase.credits : null;
  };

  // Handler for country selection
  const handleCountryChange = async (countryCode: string) => {
    setShowCountrySelector(false);
    setUserCountry(countryCode);
    
    // Store preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('userCountry', countryCode);
    }
    
    // Reload pricing for selected country
    try {
      setPricingLoading(true);
      
      // Try to get country info from API
      let countryData: CountryInfo | null = null;
      try {
        countryData = await getCountryInfo(countryCode);
      } catch (err) {
        console.warn('Failed to fetch country info from API:', err);
      }
      
        // Set country info (will be null if not in DB, that's OK - getAllPricingPlans handles it)
      setCountryInfo(countryData);

      // Fetch currency rates with fallback
      let rates: CurrencyRate[] = [];
      try {
        const ratesResponse = await fetch('/api/currency-rates');
        if (ratesResponse.ok) {
          rates = await ratesResponse.json();
        }
      } catch (err) {
        console.warn('Failed to fetch currency rates, using defaults:', err);
        rates = DEFAULT_CURRENCY_RATES;
      }
      
      setCurrencyRates(rates);
      
      // Get pricing plans (this will handle default country data if not in DB)
      const pricingData = await getAllPricingPlans(countryCode, rates);
      if (pricingData) {
        setLocationPricing(pricingData);
      } else {
        console.error('Failed to get pricing plans for country:', countryCode);
        // Create a fallback pricing structure
        const fallbackPricing = {
          mainPlans: [],
          giftPlans: [],
          supportPlans: []
        };
        setLocationPricing(fallbackPricing);
      }
    } catch (error) {
      console.error('Error loading pricing for selected country:', error);
      alert(t('payment.pricing.alerts.pricingLoadFailed'));
    } finally {
      setPricingLoading(false);
    }
  };

  // Function to activate gift pricing (Early Access Pricing - prelaunch)
  const activateGiftPricing = () => {
    console.log('[PricePlan] activateGiftPricing called - setting to prelaunch pricing');
    setUseGiftPricing(true);
    setShowStandardPricing(false); // This ensures prelaunch pricing is shown
    // Show default pricing indicator for 2 seconds
    setShowDefaultPricingIndicator(true);
    setDefaultPricingMessage(t('payment.pricing.defaultPricingIndicator.earlyAccess'));
    setTimeout(() => {
      if (!useGiftPricing && !showStandardPricing) {
        setShowDefaultPricingIndicator(false);
      }
    }, 2000);
  };

  // Function to activate standard pricing (Regular Pricing - postlaunch)
  const activateStandardPricing = () => {
    console.log('[PricePlan] activateStandardPricing called - setting to postlaunch pricing');
    setUseGiftPricing(false);
    setShowStandardPricing(true); // This ensures postlaunch pricing is shown
    // Show default pricing indicator for 2 seconds
    setShowDefaultPricingIndicator(true);
    setDefaultPricingMessage(t('payment.pricing.defaultPricingIndicator.regular'));
    setTimeout(() => {
      if (!useGiftPricing && !showStandardPricing) {
        setShowDefaultPricingIndicator(false);
      }
    }, 2000);
  };

  // Function to reset to default pricing
  const resetToDefaultPricing = () => {
    setUseGiftPricing(false);
    setShowStandardPricing(false);
  };

  // Gift pricing no longer computed; use table values only

  const isGiftEligiblePlan = (planId: string) => planId === 'first-light' || planId === 'steady-lens';

  // Load pricing data from database
  const loadPricingData = async () => {
    setLoadingPricing(true);
    try {
      const { data: countries, error: countriesError } = await (supabase as any)
        .from('countries')
        .select('*')
        .order('country_name');

      if (countriesError) throw countriesError;

      const { data: existingPricing, error: pricingError } = await (supabase as any)
        .from('global_pricing')
        .select(`
          *,
          countries(country_code, country_name, currency_code, currency_symbol, drishiq_category),
          pricing_modes(mode_name),
          plan_types(plan_code, plan_name)
        `);

      if (pricingError) throw pricingError;

      // Transform to display format
      const transformedPricing: any[] = [];
      
      countries?.forEach((country: any) => {
        ['postlaunch', 'prelaunch', 'gift', 'support'].forEach(mode => {
          ['free', 'first-light', 'steady-lens', 'enterprise'].forEach(plan => {
                        const existing = existingPricing?.find((ep: any) =>
              ep.countries?.country_code === (country as any).country_code &&
              ep.pricing_modes?.mode_name === mode &&
              ep.plan_types?.plan_code === plan
            );

            if (existing) {
              transformedPricing.push({
                id: existing.id,
                country_code: country.country_code,
                country_name: country.country_name,
                currency_code: country.currency_code,
                currency_symbol: country.currency_symbol,
                drishiq_category: country.drishiq_category,
                pricing_mode: mode,
                plan_type: plan,
                base_price_inr: existing.base_price || 0,
                discounted_price_inr: existing.discounted_price || 0,
                local_price: existing.discounted_price || 0,
                is_active: existing.is_active
              });
            }
          });
        });
      });

      setPricingData(transformedPricing);
    } catch (error) {
      console.error('Error loading pricing:', error);
    } finally {
      setLoadingPricing(false);
    }
  };

  // Start editing pricing
  const startEditPricing = (pricingId: string) => {
    const pricingItem = pricingData.find(p => p.id === pricingId);
    if (pricingItem) {
      setEditingPricing(pricingId);
      setEditValues({
        base_price_inr: pricingItem.base_price_inr,
        discounted_price_inr: pricingItem.discounted_price_inr,
        is_active: pricingItem.is_active
      });
    }
  };

  // Save pricing changes
  const savePricingChanges = async () => {
    if (!editingPricing) return;

    try {
      setLoadingPricing(true);
      
      const { error } = await (supabase as any)
        .from('global_pricing')
        .update({
          base_price: editValues.base_price_inr,
          discounted_price: editValues.discounted_price_inr,
          is_active: editValues.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPricing);

      if (error) throw error;

      // Reload data
      await loadPricingData();
      setEditingPricing(null);
      setEditValues({});
      alert(t('payment.pricing.alerts.pricingUpdated'));
    } catch (error) {
      console.error('Error saving pricing:', error);
      alert(t('payment.pricing.alerts.pricingSaveFailed'));
    } finally {
      setLoadingPricing(false);
    }
  };

  // Cancel editing
  const cancelEditPricing = () => {
    setEditingPricing(null);
    setEditValues({});
  };

  // Toggle pricing table visibility
  const togglePricingTable = () => {
    if (!showPricingTable) {
      loadPricingData();
    }
    setShowPricingTable(!showPricingTable);
  };
  
  const handlePlanClick = (planId: string, price: string, href: string) => {
    setSelectedPlan(planId);
    setSelectedSupport(null);
    // Extract amount from price string
    const amount = price.replace(/[^\d]/g, '');
    if (amount) {
      redirectToPayment(amount, `${planId} plan`, 'main');
    } else {
      // For free plan or custom pricing, redirect to the original href
      window.location.href = href;
    }
  };
  
  const handleSupportClick = (supportId: string, supportPlanId: string, amount: string, description: string) => {
    setSelectedSupport(supportId);
    setSelectedPlan(null);
    if (supportId === 'heart') {
      // For heart donation, redirect to a custom donation page
      window.location.href = `/support-details?type=donation`;
    } else {
      // Redirect to payment page with plan details (same as main plans)
      const params = new URLSearchParams({
        plan: supportPlanId, // e.g., 'support-gentle-nudge'
        category: 'support',
        country: userCountry || 'IN'
      });
      const paymentUrl = `/payment?${params.toString()}`;
      router.push(paymentUrl);
    }
  };
  
  const redirectToPayment = useCallback((amount: string, description: string, type: 'main' | 'gift' | 'support' = 'main') => {
    // Optimize redirect with immediate navigation
    const params = new URLSearchParams({
      amount: amount,
      description: description,
      purpose: type,
      supporter_name: userName,
      supporter_email: userEmail,
      support_level: type === 'support' ? 'general' : 'main'
    });
    const paymentUrl = `/payment-method?${params.toString()}`;
    
    // Use router.push for faster navigation
    router.push(paymentUrl);
  }, [router, userName, userEmail]);
  
  const handlePlaceholderClick = () => {
    // Scroll to support section with header offset
    const supportSection = document.querySelector('.support-section') as HTMLElement;
    if (supportSection) {
      const headerHeight = 76; // Match the CSS variable
      const elementTop = supportSection.offsetTop - headerHeight;
      window.scrollTo({
        top: elementTop,
        behavior: 'smooth'
      });
    }
  };

  const handleSupporterDoubleClick = () => {
    // Redirect to payment page when double-clicking on supporter images
    redirectToPayment('500', t('payment.pricing.supportSection.title').replace('🕊️', '').trim());
  };
  
  const getBadgeImage = (supportLevel: string) => {
    switch (supportLevel) {
      case 'seed':
        return '/images/badge-seed-support.png';
      case 'growth':
        return '/images/badge-growth-support.png';
      case 'wisdom':
        return '/images/badge-wisdom-support.png';
      case 'heart':
        return '/images/badge-heart-support.png';
      default:
        return '/images/badge-heart-support.png';
    }
  };

  const plans = useMemo(() => [
    {
      id: 'free-trial',
      name: t('payment.pricing.plans.freeTrial.name'),
      emotionLabel: t('payment.pricing.plans.freeTrial.emotionLabel'),
      price: '₹0',
      originalPrice: null,
      firstTimePrice: null,
      duration: t('payment.pricing.plans.freeTrial.duration'),
      validity: t('payment.pricing.plans.freeTrial.validity'),
      sessions: t('payment.pricing.plans.freeTrial.sessions'),
      features: [
        t('payment.pricing.plans.freeTrial.features.invitationBased'),
        t('payment.pricing.plans.freeTrial.features.featuredStory'),
        t('payment.pricing.plans.freeTrial.features.testimonial'),
        t('payment.pricing.plans.freeTrial.features.socialMedia'),
        t('payment.pricing.plans.freeTrial.features.sessionValidity')
      ],
      highlight: false,
      cta: t('payment.pricing.plans.freeTrial.cta'),
      href: '/checkout/free',
      icon: <Sparkles size={24} strokeWidth={1.5} />,
      description: t('payment.pricing.plans.freeTrial.description')
    },
    {
      id: 'first-light',
      name: t('payment.pricing.plans.firstLight.name'),
      emotionLabel: t('payment.pricing.plans.firstLight.emotionLabel'),
      price: '₹499',
      originalPrice: '₹600',
      firstTimePrice: '₹499',
      duration: t('payment.pricing.plans.firstLight.duration'),
      validity: t('payment.pricing.plans.firstLight.validity'),
      sessions: t('payment.pricing.plans.firstLight.sessions'),
      features: [
        t('payment.pricing.plans.firstLight.features.allFreePlan'),
        t('payment.pricing.plans.firstLight.features.sessionValidity'),
        t('payment.pricing.plans.firstLight.features.exportPdf'),
        t('payment.pricing.plans.firstLight.features.noRecurring'),
        t('payment.pricing.plans.firstLight.features.directAccess')
      ],
      highlight: false,
      cta: t('payment.pricing.plans.firstLight.cta'),
      href: '/checkout/first-light',
      icon: <Sunrise size={24} strokeWidth={1.5} />,
      description: t('payment.pricing.plans.firstLight.description')
    },
    {
      id: 'steady-lens',
      name: t('payment.pricing.plans.steadyLens.name'),
      emotionLabel: t('payment.pricing.plans.steadyLens.emotionLabel'),
      price: '₹2,249',
      originalPrice: '₹3,000',
      firstTimePrice: null,
      duration: t('payment.pricing.plans.steadyLens.duration'),
      validity: t('payment.pricing.plans.steadyLens.validity'),
      sessions: t('payment.pricing.plans.steadyLens.sessions'),
      features: [
        t('payment.pricing.plans.steadyLens.features.sessionsValidity'),
        t('payment.pricing.plans.steadyLens.features.allFirstLight'),
        t('payment.pricing.plans.steadyLens.features.sessionValidity')
      ],
      highlight: true,
      cta: t('payment.pricing.plans.steadyLens.cta'),
      href: '/checkout/steady-lens',
      icon: <Target size={24} strokeWidth={1.5} />,
      description: t('payment.pricing.plans.steadyLens.description')
    },
    {
      id: 'enterprise',
      name: t('payment.pricing.plans.enterprise.name'),
      emotionLabel: t('payment.pricing.plans.enterprise.emotionLabel'),
      price: '₹4,999',
      originalPrice: '₹6,000',
      firstTimePrice: null,
      duration: t('payment.pricing.plans.enterprise.duration'),
      validity: t('payment.pricing.plans.enterprise.validity'),
      sessions: t('payment.pricing.plans.enterprise.sessions'),
      features: [
        t('payment.pricing.plans.enterprise.features.sessionsValidity'),
        t('payment.pricing.plans.enterprise.features.adminDashboard'),
        t('payment.pricing.plans.enterprise.features.multiUser'),
        t('payment.pricing.plans.enterprise.features.reports')
      ],
      highlight: false,
      cta: t('payment.pricing.plans.enterprise.cta'),
      href: '/checkout/enterprise',
      icon: <Building2 size={24} strokeWidth={1.5} />,
      description: t('payment.pricing.plans.enterprise.description')
    }
  ], [t]);

  const giftLevels = useMemo(() => [
    {
      id: 'gentle-nudge',
      title: t('payment.pricing.supportSection.giftLevels.gentleNudge.title'),
      emotionLabel: t('payment.pricing.supportSection.giftLevels.gentleNudge.emotionLabel'),
      amount: '₹249',
      originalAmount: null,
      discount: null,
      sessions: t('payment.pricing.supportSection.giftLevels.gentleNudge.sessions'),
      validity: t('payment.pricing.supportSection.giftLevels.gentleNudge.validity'),
      description: t('payment.pricing.supportSection.giftLevels.gentleNudge.description'),
      icon: <Flower size={24} strokeWidth={1.5} />,
      badgeImage: '/assets/images/seedbadge.png',
      features: [t('payment.pricing.supportSection.giftLevels.gentleNudge.feature')]
    },
    {
      id: 'shift-forward',
      title: t('payment.pricing.supportSection.giftLevels.shiftForward.title'),
      emotionLabel: t('payment.pricing.supportSection.giftLevels.shiftForward.emotionLabel'),
      amount: '₹499',
      originalAmount: null,
      discount: null,
      sessions: t('payment.pricing.supportSection.giftLevels.shiftForward.sessions'),
      validity: t('payment.pricing.supportSection.giftLevels.shiftForward.validity'),
      description: t('payment.pricing.supportSection.giftLevels.shiftForward.description'),
      icon: <Rocket size={24} strokeWidth={1.5} />,
      badgeImage: '/assets/images/growthbadge.png',
      features: [t('payment.pricing.supportSection.giftLevels.shiftForward.feature')]
    },
    {
      id: 'deeper-space',
      title: t('payment.pricing.supportSection.giftLevels.deeperSpace.title'),
      emotionLabel: t('payment.pricing.supportSection.giftLevels.deeperSpace.emotionLabel'),
      amount: '₹1,249',
      originalAmount: null,
      discount: null,
      sessions: t('payment.pricing.supportSection.giftLevels.deeperSpace.sessions'),
      validity: t('payment.pricing.supportSection.giftLevels.deeperSpace.validity'),
      description: t('payment.pricing.supportSection.giftLevels.deeperSpace.description'),
      icon: <Waves size={24} strokeWidth={1.5} />,
      badgeImage: '/assets/images/wisdombadge.png',
      features: [t('payment.pricing.supportSection.giftLevels.deeperSpace.feature')]
    },
    {
      id: 'heart',
      title: t('payment.pricing.supportSection.giftLevels.heart.title'),
      emotionLabel: t('payment.pricing.supportSection.giftLevels.heart.emotionLabel'),
      amount: 'Custom',
      originalAmount: null,
      discount: null,
      sessions: t('payment.pricing.supportSection.giftLevels.heart.sessions'),
      validity: t('payment.pricing.supportSection.giftLevels.heart.validity'),
      description: t('payment.pricing.supportSection.giftLevels.heart.description'),
      icon: <Heart size={24} strokeWidth={1.5} />,
      badgeImage: '/assets/images/donationbadge.png',
      features: [t('payment.pricing.supportSection.giftLevels.heart.feature')]
    }
  ], [t]);

  const giftPlans = useMemo(() => [
    {
      id: 'first-light',
      name: t('payment.pricing.giftSection.giftPlans.firstLight.name'),
      emotionLabel: t('payment.pricing.giftSection.giftPlans.firstLight.emotionLabel'),
      icon: <Sunrise size={24} strokeWidth={1.5} />,
      description: t('payment.pricing.giftSection.giftPlans.firstLight.description'),
      sessions: t('payment.pricing.giftSection.giftPlans.firstLight.sessions'),
      validity: t('payment.pricing.giftSection.giftPlans.firstLight.validity'),
      features: [
        t('payment.pricing.giftSection.giftPlans.firstLight.features.allFreePlan'),
        t('payment.pricing.giftSection.giftPlans.firstLight.features.sessionValidity'),
        t('payment.pricing.giftSection.giftPlans.firstLight.features.exportPdf'),
        t('payment.pricing.giftSection.giftPlans.firstLight.features.noRecurring'),
        t('payment.pricing.giftSection.giftPlans.firstLight.features.directAccess')
      ]
    },
    {
      id: 'steady-lens',
      name: t('payment.pricing.giftSection.giftPlans.steadyLens.name'),
      emotionLabel: t('payment.pricing.giftSection.giftPlans.steadyLens.emotionLabel'),
      icon: <Target size={24} strokeWidth={1.5} />,
      description: t('payment.pricing.giftSection.giftPlans.steadyLens.description'),
      sessions: t('payment.pricing.giftSection.giftPlans.steadyLens.sessions'),
      validity: t('payment.pricing.giftSection.giftPlans.steadyLens.validity'),
      features: [
        t('payment.pricing.giftSection.giftPlans.steadyLens.features.sessionsValidity'),
        t('payment.pricing.giftSection.giftPlans.steadyLens.features.allFirstLight'),
        t('payment.pricing.giftSection.giftPlans.steadyLens.features.sessionValidity')
      ],
      highlight: true
    },
    {
      id: 'deeper-sense',
      name: t('payment.pricing.giftSection.giftPlans.deeperSense.name'),
      emotionLabel: t('payment.pricing.giftSection.giftPlans.deeperSense.emotionLabel'),
      icon: <Telescope size={24} strokeWidth={1.5} />,
      description: t('payment.pricing.giftSection.giftPlans.deeperSense.description'),
      sessions: t('payment.pricing.giftSection.giftPlans.deeperSense.sessions'),
      validity: t('payment.pricing.giftSection.giftPlans.deeperSense.validity'),
      features: [
        t('payment.pricing.giftSection.giftPlans.deeperSense.features.sessionsValidity'),
        t('payment.pricing.giftSection.giftPlans.deeperSense.features.allSteadyLens'),
        t('payment.pricing.giftSection.giftPlans.deeperSense.features.extendedValidity')
      ]
    }
  ], [t]);

  return (
    <div className="min-h-screen bg-white">


      {/* Enhanced Top Section */}
      <div className="bg-gradient-to-br from-[#1A3D2D] via-emerald-700 to-[#1A3D2D] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M30 30L60 0v60z'/%3E%3C/g%3E%3C/svg%3E")`}}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              <span className="block text-amber-400 flex items-center justify-center gap-2">
                <Sparkles size={32} /> {t('payment.pricing.title')}
              </span>
            </h1>
            <p className="text-xl text-emerald-100 max-w-4xl mx-auto mb-4 leading-relaxed">
              {t('payment.pricing.subtitle')}
            </p>
            
            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-center gap-8 mb-4 text-emerald-200">

              <div className="text-center">
                <div className="text-3xl font-bold">{t('payment.pricing.stats.findClarity')}</div>
                <div className="text-sm opacity-80">{t('payment.pricing.stats.findClarityLabel')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{t('payment.pricing.stats.alwaysAvailable')}</div>
                <div className="text-sm opacity-80">{t('payment.pricing.stats.alwaysAvailableLabel')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{t('payment.pricing.stats.moneyBack')}</div>
                <div className="text-sm opacity-80">{t('payment.pricing.stats.moneyBackLabel')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating First-Time Offer Banner */}
      {showOffer && (
        <div className="fixed top-24 right-4 z-50 max-w-sm">
          <div 
            className="bg-amber-100 border-2 border-amber-300 text-[#0B4422] rounded-2xl p-4 shadow-xl relative overflow-hidden cursor-pointer hover:border-amber-400 hover:bg-amber-200 transition-all"
            onClick={activateGiftPricing}
            title={t('payment.pricing.tooltips.activateGiftPricing')}
          >
            {/* Close Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the banner click
                console.log('Close button clicked!');
                setShowOffer(false);
              }} 
              className="absolute top-2 right-2 w-8 h-8 bg-red-400 hover:bg-red-500 rounded-full flex items-center justify-center text-white hover:text-white transition-colors cursor-pointer z-10"
              title={t('payment.pricing.offerBanner.close')}
            >
              ✕
            </button>
            <div className="relative flex items-center justify-center gap-3 flex-wrap">
              <Gift size={24} className="text-[#0B4422]" />
              <div className="text-center">
                <div className="text-lg font-bold">{t('payment.pricing.offerBanner.title')}</div>
                <div className="text-sm font-medium">
                  {t('payment.pricing.offerBanner.description')}
                </div>
              </div>
              <Sparkles size={24} className="text-[#0B4422]" />
            </div>
          </div>
        </div>
      )}

      {/* Floating Default Pricing Indicator */}
      {showDefaultPricingIndicator && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div 
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border-2 border-gray-300 shadow-lg cursor-pointer hover:bg-gray-200 transition-all"
            onClick={handleDefaultPricingClick}
            title={t('payment.pricing.tooltips.clickInstructions')}
          >
            <Sparkles size={18} />
            <span>{defaultPricingMessage}</span>
          </div>
        </div>
      )}

      {/* Plans Section - 3 Emotion-Based Cards */}
      <div id="main-plans" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Pre-Launch Honor Banner */}
            <div className="max-w-5xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 border-2 border-amber-300 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    {t('payment.pricing.foundingMemberOffer.badge')}
                  </span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Sparkles size={28} className="text-amber-500" />
                    <h3 className="text-2xl font-bold text-[#0B4422]">
                      {t('payment.pricing.foundingMemberOffer.title')}
                    </h3>
                    <Sparkles size={28} className="text-amber-500" />
                  </div>
                  <div className="max-w-4xl mx-auto">
                    <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                      <strong className="text-[#0B4422]">{t('payment.pricing.foundingMemberOffer.launchDate')}</strong> - {t('payment.pricing.foundingMemberOffer.description')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className={`bg-white rounded-2xl p-4 border-2 cursor-pointer hover:border-amber-400 transition-all ${
                        !showStandardPricing ? 'border-amber-400 bg-amber-50' : 'border-amber-200'
                      }`} onClick={() => {
                        console.log('[PricePlan] Early Access Pricing selected - setting showStandardPricing to false');
                        activateGiftPricing();
                      }}>
                        <div className="flex items-center gap-3 mb-2">
                          <Heart size={24} className="text-rose-500" />
                          <div className="font-bold text-[#0B4422]">{t('payment.pricing.foundingMemberOffer.earlyAccess.title')}</div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {t('payment.pricing.foundingMemberOffer.earlyAccess.description')}
                        </p>
                        {!showStandardPricing && (
                          <div className="mt-2 text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full text-center">
                            {t('payment.pricing.foundingMemberOffer.earlyAccess.active')}
                          </div>
                        )}
                      </div>
                      <div className={`bg-white rounded-2xl p-4 border-2 cursor-pointer hover:border-amber-400 transition-all ${
                        showStandardPricing ? 'border-amber-400 bg-amber-50' : 'border-amber-200'
                      }`} onClick={() => {
                        console.log('[PricePlan] Regular Pricing selected - setting showStandardPricing to true');
                        activateStandardPricing();
                      }}>
                        <div className="flex items-center gap-3 mb-2">
                          <Rocket size={24} className="text-emerald-600" />
                          <div className="font-bold text-[#0B4422]">{t('payment.pricing.foundingMemberOffer.regular.title')}</div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {t('payment.pricing.foundingMemberOffer.regular.description')}
                        </p>
                        {showStandardPricing && (
                          <div className="mt-2 text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full text-center">
                            {t('payment.pricing.foundingMemberOffer.regular.active')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 cursor-pointer hover:border-emerald-300" onClick={activateGiftPricing}>
                      <p className="text-[#0B4422] font-semibold text-center">
                        {t('payment.pricing.foundingMemberOffer.highlight')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Your Clarity Pass Section */}
          <div id="clarity-pass" className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B4422] mb-4">
              {t('payment.pricing.clarityPass.title')}
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-xl text-gray-600 leading-relaxed mb-4">
                <span className="italic text-emerald-700">"{t('payment.pricing.clarityPass.quote')}"</span>
              </p>
              <p className="text-lg text-gray-600">
                {t('payment.pricing.clarityPass.description')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl shadow-xl border-2 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl ${
                  plan.highlight ? 'border-[#0B4422] bg-white scale-105 ring-2 ring-[#0B4422]/20' : 'border-gray-200 hover:border-[#0B4422]'
                } ${selectedPlan === plan.id ? 'ring-4 ring-emerald-400/50' : ''}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      {t('payment.pricing.plans.mostPopular')}
                    </span>
                  </div>
                )}

                {/* First Light badge removed as per latest spec (no discount badge) */}

                {/* Free Badge for Free Trial */}
                {plan.id === 'free-trial' && (
                  <div className="absolute -top-3 -right-3">
                    <div className="bg-[#0B4422] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                      {t('payment.pricing.plans.free')}
                    </div>
                  </div>
                )}

                <div className="p-8 flex flex-col h-full">
                  {/* Icon and Plan Name */}
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">{plan.icon}</div>
                    <h3 className="text-2xl font-bold text-[#0B4422] mb-2">{plan.name}</h3>
                    <p className="text-lg font-medium text-emerald-600 italic">"{plan.emotionLabel}"</p>
                    <p className="text-sm text-gray-600 mt-2">
                      {plan.description}
                    </p>
                    {useGiftPricing && isGiftEligiblePlan(plan.id) && (
                      <div className="mt-2">
                        <span className="inline-block text-xs bg-amber-200 text-[#0B4422] px-3 py-1 rounded-full font-bold">{t('payment.pricing.plans.firstLight.foundingSupport')}</span>
                      </div>
                    )}
                  </div>

                  {/* Price Display */}
                  <div className="text-center mb-6">
                    {(() => {
                      if (pricingLoading) {
                        return <div className="text-sm text-gray-500">{t('payment.pricing.plans.loadingPricing')}</div>;
                      }
                      
                      if (!locationPricing?.mainPlans) {
                        return <span className="text-sm text-gray-500">{t('payment.pricing.plans.pricingUnavailable')}</span>;
                      }

                      const mainPlan = locationPricing.mainPlans.find((p: any) => p.id === plan.id);
                      if (!mainPlan) {
                        return <span className="text-sm text-gray-500">{t('payment.pricing.plans.pricingUnavailable')}</span>;
                      }

                      const pricing = showStandardPricing ? mainPlan.postlaunch : mainPlan.prelaunch;
                      
                      return (
                        <>
                          <span className="text-4xl font-bold text-[#0B4422]">{pricing.discountedPrice}</span>
                          <div className="text-lg text-gray-500 line-through mt-1">{pricing.basePrice}</div>
                        </>
                      );
                    })()}
                    <p className="text-sm text-gray-500 font-medium mt-2">{plan.sessions} {plan.sessions === '1' ? t('payment.pricing.plans.freeTrial.sessionsLabel') : t('payment.pricing.plans.freeTrial.sessionsPlural')}</p>
                    <p className="text-sm text-gray-500">{plan.validity}</p>
                  </div>

                  {/* Features (first item replaced by dynamic credits if available) */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        </div>
                          <span className="text-gray-700 font-medium" title={plan.id === 'free-trial' && feature.toLowerCase().includes('social media challenge') ? t('payment.pricing.supportSection.socialMediaTooltip') : undefined}>
                            {plan.id === 'free-trial' && feature.toLowerCase().includes('invitation-based') ? (
                              <a 
                                className="text-emerald-700 underline cursor-pointer" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  router.push('/request#trial-access');
                                }}
                              >
                                {feature}
                              </a>
                            ) : plan.id === 'free-trial' && feature.toLowerCase().includes('featured story') ? (
                              <a className="text-emerald-700 underline" href="/share-experience?type=story">{feature}</a>
                            ) : plan.id === 'free-trial' && feature.toLowerCase().includes('testimonial') ? (
                              isAuthenticated ? (
                                <a className="text-emerald-700 underline cursor-pointer" href="/share-experience?type=testimonial">{feature}</a>
                              ) : (
                                <span 
                                  className="text-gray-500 cursor-not-allowed relative group" 
                                  title="This feature is only available for authenticated users. Please sign in to submit a testimonial."
                                >
                                  {feature}
                                  <span className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 pointer-events-none">
                                    This feature is only available for authenticated users. Please sign in to submit a testimonial.
                                    <span className="absolute top-full left-4 border-4 border-transparent border-t-gray-800"></span>
                                  </span>
                                </span>
                              )
                            ) : index === 0 && getCredits(plan.id) ? (
                              `${getCredits(plan.id)} Sessions`
                            ) : (
                              feature
                            )}
                          </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {plan.id === 'free-trial' ? (
                    <button
                      className="mt-auto w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 bg-[#0B4422] text-white hover:bg-[#0B4422]/90"
                      onClick={() => router.push('/request#trial-access')}
                    >
                      {plan.cta}
                    </button>
                  ) : (
                    <div className="mt-auto">
                      {(() => {
                        // Use the same logic as pricing display: showStandardPricing determines prelaunch vs postlaunch
                        const category = showStandardPricing ? 'postlaunch' : 'prelaunch';
                        const displayedPrice = showStandardPricing ? 'postlaunch' : 'prelaunch';
                        console.log(`[PricePlan] Rendering CheckoutButton for ${plan.id}:`, {
                          showStandardPricing,
                          category,
                          displayedPrice,
                          'Will use': category === 'prelaunch' ? '₹249 (prelaunch)' : '₹499 (postlaunch)'
                        });
                        return (
                          <CheckoutButton
                            planId={plan.id}
                            planName={plan.name}
                            basePrice={(getDisplayMinor(plan.id) || 0) / 100}
                            userCountry={userCountry}
                            userId={userId}
                            userEmail={userEmail}
                            userName={userName}
                            userPhone={userPhone}
                            currencyCode={currencyInfo.code}
                            type={'main'}
                            pricingCategory={category}
                            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                              plan.highlight
                                ? 'bg-[#0B4422] text-white hover:bg-[#0B4422]/90'
                                : plan.id === 'first-light'
                                ? 'bg-amber-200 text-[#0B4422] hover:bg-amber-300'
                                : 'bg-[#0B4422] text-white hover:bg-[#0B4422]/90'
                            }`}
                          >
                            {plan.cta}
                          </CheckoutButton>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Additional Options */}
          <div className="text-center mt-16">
            <div className="max-w-6xl mx-auto">
              {/* Trust Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <div className="font-semibold text-[#0B4422]">{t('payment.pricing.trustIndicators.securePayment.title')}</div>
                    <div className="text-sm text-gray-600">{t('payment.pricing.trustIndicators.securePayment.description')}</div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <div className="font-semibold text-[#0B4422]">{t('payment.pricing.trustIndicators.flexiblePlans.title')}</div>
                    <div className="text-sm text-gray-600">{t('payment.pricing.trustIndicators.flexiblePlans.description')}</div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  <span className="text-2xl">💬</span>
                  <div>
                    <div className="font-semibold text-[#0B4422]">{t('payment.pricing.trustIndicators.support.title')}</div>
                    <div className="text-sm text-gray-600">{t('payment.pricing.trustIndicators.support.description')}</div>
                  </div>
                </div>
              </div>

              {/* Customized Package Info */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-2xl p-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-[#0B4422] mb-4">
                    {t('payment.pricing.customPackage.title')}
                  </h3>
                  <p className="text-gray-700 mb-6">
                    {t('payment.pricing.customPackage.description')}
                  </p>
                  <div className="bg-white rounded-2xl p-4 border border-emerald-200 mb-4">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">📧</span>
                      <div>
                        <div className="font-bold text-[#0B4422]">{t('payment.pricing.customPackage.getInTouch')}</div>
                        <a href={`mailto:${t('payment.pricing.customPackage.email')}`} className="text-emerald-600 hover:text-emerald-700 font-medium">
                          {t('payment.pricing.customPackage.email')}
                        </a>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm italic">
                    {t('payment.pricing.customPackage.subtext')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>      {/* Gift a Moment of Clarity Section - For Current Plan Holders */}
      <div id="gift-section" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 rounded-full px-4 py-2 mb-6">
              <Sparkles size={18} />
              <span className="text-sm font-medium">{t('payment.pricing.giftSection.badge')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B4422] mb-6">
              {t('payment.pricing.giftSection.title')}
            </h2>
            <div className="max-w-4xl mx-auto mb-8">
              <p className="text-xl text-gray-600 leading-relaxed mb-4">
                <span className="italic text-emerald-700">"{t('payment.pricing.giftSection.quote')}"</span>
              </p>
              <p className="text-lg text-gray-600">
                {t('payment.pricing.giftSection.description')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {giftPlans.map((plan) => (
                <div
                  key={`gift-${plan.id}`}
                  className={`relative bg-white rounded-3xl shadow-xl border-2 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl ${
                    plan.highlight ? 'border-[#0B4422] bg-white ring-2 ring-[#0B4422]/20' : 'border-gray-200 hover:border-[#0B4422]'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                        {t('payment.pricing.giftSection.mostGifted')}
                      </span>
                    </div>
                  )}

                  <div className="p-8 flex flex-col h-full">
                    {/* Gift Badge */}
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-xs font-bold">
                        {t('payment.pricing.giftSection.giftVersion')}
                      </div>
                    </div>

                    {/* Icon and Plan Name */}
                    <div className="text-center mb-6">
                      <div className="text-5xl mb-4">{plan.icon}</div>
                      <h3 className="text-xl font-bold text-[#0B4422] mb-2">{plan.name}</h3>
                      <p className="text-base font-medium text-emerald-600 italic">"{plan.emotionLabel}"</p>
                      <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                    </div>

                    {/* Gift Pricing - Special Rates */}
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {(() => {
                          if (pricingLoading) {
                            return <div className="text-sm text-gray-500">{t('payment.pricing.plans.loadingPricing')}</div>;
                          }
                          
                          if (!locationPricing?.giftPlans) {
                            return <span className="text-sm text-gray-500">{t('payment.pricing.plans.pricingUnavailable')}</span>;
                          }

                          const giftPlanId = plan.id === 'deeper-sense' ? 'gift-deeper-sense' : `gift-${plan.id}`;
                          const giftPlan = locationPricing.giftPlans.find((p: any) => p.id === giftPlanId);
                          if (!giftPlan) {
                            return <span className="text-sm text-gray-500">{t('payment.pricing.plans.pricingUnavailable')}</span>;
                          }

                          return (
                            <span className="text-3xl font-bold text-emerald-600">{giftPlan.pricing.discountedPrice}</span>
                          );
                        })()}
                      </div>
                      <p className="text-sm text-gray-500 font-medium">{plan.sessions} {plan.sessions === '1' ? t('payment.pricing.plans.freeTrial.sessionsLabel') : t('payment.pricing.plans.freeTrial.sessionsPlural')}</p>
                      <p className="text-sm text-gray-500">{plan.validity}</p>
                      <div className="mt-2">
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                          {t('payment.pricing.giftSection.premiumGiftBenefit')}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-2.5 h-2.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Gift CTA Button */}
                    <div className="mt-auto">
                      <CheckoutButton
                        planId={plan.id === 'deeper-sense' ? 'gift-deeper-sense' : `gift-${plan.id}`}
                        planName={t('payment.pricing.giftSection.giftPlans.' + (plan.id === 'deeper-sense' ? 'deeperSense' : plan.id) + '.cta')}
                        basePrice={plan.id === 'first-light' ? 299 : plan.id === 'steady-lens' ? 599 : 1499}
                        userCountry={userCountry}
                        userId={userId}
                        userEmail={userEmail}
                        userName={userName}
                        userPhone={userPhone}
                        type="gift"
                        className={`w-full py-3 rounded-2xl font-bold text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                          plan.highlight
                            ? 'bg-[#0B4422] text-white hover:bg-[#0B4422]/90'
                            : 'bg-[#0B4422] text-white hover:bg-[#0B4422]/90'
                        }`}
                      >
                        {t('payment.pricing.giftSection.giftPlans.' + (plan.id === 'deeper-sense' ? 'deeperSense' : plan.id) + '.cta')}
                      </CheckoutButton>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Gifting Process Steps */}
          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold text-[#0B4422] mb-8">{t('payment.pricing.giftSection.howItWorks.title')}</h3>
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl shadow-lg">
                  <div className="w-16 h-16 bg-[#0B4422] rounded-2xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <div>
                    <div className="font-bold text-[#0B4422] text-lg">{t('payment.pricing.giftSection.howItWorks.step1.title')}</div>
                    <div className="text-sm text-gray-600">{t('payment.pricing.giftSection.howItWorks.step1.description')}</div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl shadow-lg">
                  <div className="w-16 h-16 bg-[#0B4422] rounded-2xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <div>
                    <div className="font-bold text-[#0B4422] text-lg">{t('payment.pricing.giftSection.howItWorks.step2.title')}</div>
                    <div className="text-sm text-gray-600">{t('payment.pricing.giftSection.howItWorks.step2.description')}</div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl shadow-lg">
                  <div className="w-16 h-16 bg-[#0B4422] rounded-2xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <div>
                    <div className="font-bold text-[#0B4422] text-lg">{t('payment.pricing.giftSection.howItWorks.step3.title')}</div>
                    <div className="text-sm text-gray-600">{t('payment.pricing.giftSection.howItWorks.step3.description')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Someone's Need Section */}
      <div id="support-section" className="support-section bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 rounded-full px-4 py-2 mb-6">
              <Gift size={18} />
              <span className="text-sm font-medium">{t('payment.pricing.supportSection.badge')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B4422] mb-6">{t('payment.pricing.supportSection.title')}</h2>
            <div className="max-w-4xl mx-auto mb-8">
              <p className="text-xl text-gray-600 leading-relaxed mb-4">
                <span className="italic text-emerald-700">"{t('payment.pricing.supportSection.quote')}"</span>
              </p>
              <p className="text-lg text-gray-600">
                {t('payment.pricing.supportSection.description')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {giftLevels.map((gift, index) => (
              <div
                key={gift.id}
                className={`relative bg-white rounded-3xl shadow-xl border-2 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl ${
                  gift.id === 'heart' ? 'border-pink-400 bg-gradient-to-br from-pink-50 to-white' : 'border-purple-200 hover:border-purple-400'
                } ${selectedSupport === gift.id ? 'ring-4 ring-purple-400/50' : ''}`}
              >
                {/* Discount Badge */}
                {gift.discount && (
                  <div className="absolute -top-3 -right-3">
                    <div className="bg-orange-200 text-[#0B4422] px-3 py-1 rounded-full text-xs font-bold shadow-md">
                      {gift.discount}
                    </div>
                  </div>
                )}

                {/* Heart Badge for Donation */}
                {gift.id === 'heart' && (
                  <div className="absolute -top-3 -right-3">
                    <div className="bg-pink-200 text-[#0B4422] px-3 py-1 rounded-full text-xs font-bold shadow-md">
                      {t('payment.pricing.supportSection.anyAmount')}
                    </div>
                  </div>
                )}

                <div className="p-8 flex flex-col h-full">
                  {/* Badge Image and Title */}
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 mx-auto mb-4 relative">
                      <Image
                        src={gift.badgeImage}
                        alt={`${gift.title} Badge`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-[#0B4422] mb-2">{gift.title}</h3>
                    <p className="text-base font-medium text-purple-600 italic">"{gift.emotionLabel}"</p>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{gift.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {(() => {
                          if (pricingLoading) {
                            return <div className="text-sm text-gray-500">{t('payment.pricing.plans.loadingPricing')}</div>;
                          }
                          
                          if (!locationPricing?.supportPlans) {
                            return <span className="text-sm text-gray-500">{t('payment.pricing.plans.pricingUnavailable')}</span>;
                          }

                        const supportPlanId = `support-${gift.id}`;
                        const supportPlan = locationPricing.supportPlans.find((p: any) => p.id === supportPlanId);
                        if (!supportPlan) {
                          return <span className="text-sm text-gray-500">{t('payment.pricing.plans.pricingUnavailable')}</span>;
                        }

                        return (
                          <span className={`text-3xl font-bold ${gift.id === 'heart' ? 'text-pink-600' : 'text-[#0B4422]'}`}>
                            {supportPlan.pricing.discountedPrice}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-sm text-gray-500 font-medium">{gift.sessions}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-8">
                    {gift.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className={`w-4 h-4 ${gift.id === 'heart' ? 'bg-pink-100' : 'bg-purple-100'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <svg className={`w-2.5 h-2.5 ${gift.id === 'heart' ? 'text-pink-600' : 'text-purple-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => {
                      // Get the actual pricing from location-based data
                      const supportPlanId = `support-${gift.id}`;
                      const supportPlan = locationPricing?.supportPlans?.find((p: any) => p.id === supportPlanId);
                      const priceToUse = supportPlan?.pricing?.discountedPrice || gift.amount || '';
                      
                      if (gift.id === 'heart') {
                        window.location.href = `/support-details?type=donation`;
                      } else {
                        handleSupportClick(gift.id, supportPlanId, priceToUse, gift.description);
                      }
                    }}
                    className={`mt-auto w-full py-3 rounded-2xl font-bold text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                      gift.id === 'heart'
                        ? 'bg-pink-200 text-[#0B4422] hover:bg-pink-300'
                        : gift.discount
                        ? 'bg-orange-200 text-[#0B4422] hover:bg-orange-300'
                        : 'bg-[#0B4422] text-white hover:bg-[#0B4422]/90'
                    }`}
                    disabled={pricingLoading}
                  >
                    {gift.id === 'heart' ? t('payment.pricing.supportSection.donateNow') : t('payment.pricing.supportSection.giftThis')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Gift Features */}
          <div className="text-center mt-16">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl shadow-lg">
                  <div className="w-16 h-16 bg-[#0B4422] rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div>
                    <div className="font-bold text-[#0B4422] text-lg">{t('payment.pricing.supportSection.giftFeatures.personalNotes.title')}</div>
                    <div className="text-sm text-gray-600">{t('payment.pricing.supportSection.giftFeatures.personalNotes.description')}</div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl shadow-lg">
                  <div className="w-16 h-16 bg-[#0B4422] rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">🎭</span>
                  </div>
                  <div>
                    <div className="font-bold text-[#0B4422] text-lg">{t('payment.pricing.supportSection.giftFeatures.anonymous.title')}</div>
                    <div className="text-sm text-gray-600">{t('payment.pricing.supportSection.giftFeatures.anonymous.description')}</div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl shadow-lg">
                  <div className="w-16 h-16 bg-[#0B4422] rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <div className="font-bold text-[#0B4422] text-lg">{t('payment.pricing.supportSection.giftFeatures.instantAccess.title')}</div>
                    <div className="text-sm text-gray-600">{t('payment.pricing.supportSection.giftFeatures.instantAccess.description')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Note: Global Pricing Matrix moved to Admin Dashboard */}
    </div>
  );
} 
