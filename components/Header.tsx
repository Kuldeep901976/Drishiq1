'use client';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/lib/drishiq-i18n';
import { useUserProfile, calculateAge, getFirstName } from '@/lib/hooks/useUserProfile';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthState } from '@/components/auth/hooks/useAuthState';
// @ts-ignore - lucide-react exports; TS module resolution may not see them (runtime works)
import { User, Search, Sun, Moon, Info, FileText, LogOut, Lock, Menu, X } from 'lucide-react';
import { HeaderSearchModal } from '@/components/header/HeaderSearchModal';
import { HeaderQRModal } from '@/components/header/HeaderQRModal';
import { getMeetYourselfItems, getYourPathItems } from '@/components/header/nav-items';

// Reusable ProfileMenuItem component with icons
interface ProfileMenuItemProps {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  showArrow?: boolean;
}

const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({ icon, label, onClick, showArrow }) => (
  <button 
    className="profile-menu-item" 
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    type="button"
  >
    {icon && <div className="profile-menu-item-icon">{icon}</div>}
    <div className="profile-menu-item-content">
      <span className="profile-menu-item-label">{label}</span>
    </div>
    {showArrow && <span className="profile-menu-arrow">›</span>}
  </button>
);

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [profileIconError, setProfileIconError] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);
  const [guestProfileIconError, setGuestProfileIconError] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { user, profile, loading } = useUserProfile();
  const { language, setLanguage, t } = useLanguage(['header']);
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuthState();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Fallback translations with proper nested key access
  const getText = useCallback(
    (key: string, fallback: string) => {
      try {
        const value = t(`header.${key}`);
        return value || fallback;
      } catch {
        return fallback;
      }
    },
    [t]
  );

  // Initialize theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('drishiq-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Focus search input when search modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Don't close if clicking on profile menu items
      if (target && (target as Element).closest('.profile-menu-item')) {
        return;
      }
      if (headerRef.current && !headerRef.current.contains(target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Check for Super Admin
  useEffect(() => {
    const checkSuperAdmin = () => {
      const superAdminToken = localStorage.getItem('super_admin_token');
      setIsSuperAdmin(!!superAdminToken);
    };
    checkSuperAdmin();
    // Listen for storage changes
    window.addEventListener('storage', checkSuperAdmin);
    return () => window.removeEventListener('storage', checkSuperAdmin);
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery('');
        }
        if (isQRModalOpen) {
          setIsQRModalOpen(false);
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSearchOpen, isQRModalOpen]);

  const toggleDropdown = useCallback((dropdownName: string) => {
    setOpenDropdown(prev => (prev === dropdownName ? null : dropdownName));
  }, []);

  const toggleMobileDropdown = useCallback((dropdownName: string) => {
    setMobileDropdown(prev => (prev === dropdownName ? null : dropdownName));
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    setMobileDropdown(null);
  }, []);

  const handleSignOut = async () => {
    try {
      // Clear Super Admin token if present
      if (isSuperAdmin) {
        localStorage.removeItem('super_admin_token');
      }
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      // Silently handle sign out errors
    }
  };

  const toggleTheme = useCallback(() => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('drishiq-theme', newTheme);
  }, [isDarkMode]);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
    setOpenDropdown(null);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  const openQRModal = useCallback(() => {
    setIsQRModalOpen(true);
    setOpenDropdown(null);
  }, []);

  const closeQRModal = useCallback(() => {
    setIsQRModalOpen(false);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        setIsSearchOpen(false);
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchQuery('');
      }
    },
    [searchQuery, router]
  );

  // Handle language change - simple and direct
  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      if (newLanguage === language) return;
      setLanguage(newLanguage as any);
      window.location.href = window.location.pathname;
    },
    [setLanguage, language]
  );

  const handleProfileMenuItemClick = useCallback(
    (action: string) => {
      setOpenDropdown(null);
      
      // Small delay to ensure dropdown closes before navigation
      setTimeout(() => {
        switch (action) {
          case 'signup':
            router.push('/signup');
            break;
          case 'signin':
            router.push('/signin');
            break;
          case 'reset':
            router.push('/create-password');
            break;
          case 'search':
            openSearch();
            break;
          case 'theme':
            toggleTheme();
            break;
          case 'about':
            router.push('/terms');
            break;
          case 'logout':
            handleSignOut();
            break;
          case 'terms-conditions':
            router.push('/support-in-need');
            break;
          case 'profile-settings':
            router.push('/user/profile/settings');
            break;
          case 'dashboard':
            // Redirect to user's unique profile page using their ID
            if (authUser?.id) {
              router.push(`/user/${authUser.id}`);
            } else {
              // Fallback to dashboard if no user ID available
              router.push('/user/dashboard');
            }
            break;
          default:
            break;
        }
      }, 50);
    },
    [router, openSearch, toggleTheme, handleSignOut, authUser]
  );

  const scrollToSection = useCallback(
    (sectionId: string) => {
      // Always update URL first for immediate feedback
      const targetUrl = `/#${sectionId}`;
      const currentPath = pathname || window.location.pathname;
      
      if (currentPath === '/') {
        // Update URL immediately for instant feedback
        if (window.location.hash !== `#${sectionId}`) {
          window.history.pushState(null, '', targetUrl);
        }
        
        // Scroll to section immediately
        requestAnimationFrame(() => {
          const element = document.getElementById(sectionId);
          if (element) {
            const headerHeight = 80;
            const elementTop = element.offsetTop - headerHeight;
            window.scrollTo({ top: elementTop, behavior: 'smooth' });
          }
        });
      } else {
        // Navigate to homepage with hash
        router.push(targetUrl);
      }
    },
    [router, pathname]
  );

  const meetYourselfItems = getMeetYourselfItems(getText);
  const yourPathItems = getYourPathItems(getText);

  const displayName = user && profile ? getFirstName(profile.fullname || profile.email) : null;
  const userAge = user && profile?.date_of_birth ? calculateAge(profile.date_of_birth) : null;

  // Check if we're on a chat page
  const isChatPage = pathname?.includes('/chat') || pathname?.includes('/apps/chat');

  return (
    <>
      <header className="drishiq-header" ref={headerRef}>
        <div className="header-container">
          {/* Logo */}
          <div className="header-logo">
            <Link 
              href="/" 
              className="logo-link"
              onClick={(e) => {
                e.preventDefault();
                router.push('/');
              }}
            >
              <Image
                src="/assets/logo/Logo.png"
                alt={getText('logo_alt', 'DrishiQ logo')}
                width={120}
                height={50}
                unoptimized
                priority
                className="logo-image"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="header-right">
            <nav className="header-nav">
              {/* Meet Yourself Dropdown */}
              <div className="nav-dropdown">
                <button
                  className="dropdown-trigger"
                  onClick={() => toggleDropdown('meet-yourself')}
                  title={getText('meet_yourself.label', 'Meet Yourself')}
                >
                  {getText('meet_yourself.label', 'Meet Yourself')}{' '}
                  <span className="dropdown-arrow">▼</span>
                </button>
                <div
                  className={`dropdown-menu ${
                    openDropdown === 'meet-yourself' ? 'dropdown-open' : ''
                  }`}
                >
                  {meetYourselfItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="dropdown-link"
                      onClick={() => setOpenDropdown(null)}
                    >
                      <span className="dropdown-icon">{item.icon}</span> {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Other Navigation Items */}
              <button 
                className="nav-link" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('about');
                }}
                title={getText('drishiq_hover', 'Go to the DrishiQ homepage')}
              >
                {getText('drishiq', 'DrishiQ')}
              </button>

              <button 
                className="nav-link" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('blog-insights');
                }}
                title={getText('blog_hover', 'Read articles, stories and insights')}
              >
                {getText('blog', 'Blog')}
              </button>

              <button 
                className="nav-link" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('testimonials-usersay');
                }}
                title={getText('voice_hover', 'Hear perspectives and audio content')}
              >
                {getText('voice', 'Voice')}
              </button>

              <button 
                className="nav-link" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('grow-with-us');
                }}
                title={getText('grow_hover', 'Opportunities to learn, collaborate, and expand')}
              >
                {getText('grow', 'Grow')}
              </button>

              <button 
                className="nav-link" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('clarity-anchor');
                }}
                title={getText('bridge_hover', 'Connect with others and build community')}
              >
                {getText('bridge', 'Bridge')}
              </button>

              {/* Your Path Dropdown */}
              <div className="nav-dropdown">
                <button 
                  className="dropdown-trigger" 
                  onClick={() => toggleDropdown('your-path')}
                  title={getText('your_path_label', 'Your Path')}
                >
                  {getText('your_path_label', 'Your Path')}{' '}
                  <span className="dropdown-arrow">▼</span>
                </button>
                <div
                  className={`dropdown-menu ${openDropdown === 'your-path' ? 'dropdown-open' : ''}`}
                >
                  {yourPathItems.map(item => (
                    <Link
                      key={`${item.href}-${item.label}`}
                      href={item.href}
                      className="dropdown-link"
                      onClick={() => setOpenDropdown(null)}
                    >
                      <span className="dropdown-icon">{item.icon}</span> {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            {/* Language Selector - Using translation keys for language names */}
            <select
              value={language}
              onChange={e => handleLanguageChange(e.target.value)}
              className="language-select"
              aria-label={getText('language_button_label', 'Language')}
            >
              <option value="en">{getText('languages.en', 'English')}</option>
              <option value="hi">{getText('languages.hi', 'हिंदी')}</option>
              <option value="bn">{getText('languages.bn', 'বাংলা')}</option>
              <option value="ta">{getText('languages.ta', 'தமிழ்')}</option>
              <option value="ru">{getText('languages.ru', 'Русский')}</option>
              <option value="ar">{getText('languages.ar', 'العربية')}</option>
              <option value="es">{getText('languages.es', 'Español')}</option>
              <option value="de">{getText('languages.de', 'Deutsch')}</option>
              <option value="pt">{getText('languages.pt', 'Português')}</option>
              <option value="zh">{getText('languages.zh', '中文')}</option>
              <option value="ja">{getText('languages.ja', '日本語')}</option>
              <option value="fr">{getText('languages.fr', 'Français')}</option>
            </select>

            {/* Mobile Menu Toggle */}
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Profile Section */}
            <div className="header-profile">
              <button
                className="profile-button"
                onClick={() => toggleDropdown('profile')}
                aria-label={getText('profile_options_label', 'Profile options')}
              >
                {(() => {
                  const isUserAuthenticated = (user && profile) || (authUser && isAuthenticated);
                  
                  if (isUserAuthenticated) {
                    if (displayName) {
                      return <span className="profile-initial">{displayName[0].toUpperCase()}</span>;
                    }
                    if (authUser?.email) {
                      return <span className="profile-initial">{authUser.email[0].toUpperCase()}</span>;
                    }
                    if (profileIconError) {
                      return <span className="profile-initial">{(authUser?.email?.[0] || 'U').toUpperCase()}</span>;
                    }
                    return (
                      <Image
                        src="/assets/other-Icons/profileicon.webp"
                        alt="Profile"
                        width={40}
                        height={40}
                        className="profile-icon-img"
                        onError={() => setProfileIconError(true)}
                        unoptimized
                      />
                    );
                  }
                  
                  // Not authenticated
                  if (profileIconError) {
                    return <span className="profile-initial">G</span>;
                  }
                  return (
                    <Image
                      src="/assets/other-Icons/profileicon.webp"
                      alt="Profile"
                      width={40}
                      height={40}
                      className="profile-icon-img"
                      onError={() => setProfileIconError(true)}
                    />
                  );
                })()}
              </button>

              {/* Profile Dropdown */}
              <div
                className={`profile-dropdown ${
                  openDropdown === 'profile' ? 'profile-dropdown-open' : ''
                }`}
              >
                {(user && profile) || (authUser && isAuthenticated) || isSuperAdmin ? (
                  <>
                    {/* Logged In User Profile */}
                    <div className="profile-dropdown-header">
                      <div className="profile-avatar-circle">
                        {displayName?.[0]?.toUpperCase() || authUser?.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="profile-name">{displayName || authUser?.email || getText('profile.user_fallback', 'User')}</div>
                      {userAge && <div className="profile-age">{userAge} {getText('profile.years', 'years')}</div>}
                    </div>

                    <div className="profile-menu-section">
                      <ProfileMenuItem
                        icon={<User size={16} />}
                        label={getText('profile.user_profile', 'User Profile')}
                        onClick={() => handleProfileMenuItemClick('dashboard')}
                      />

                      <ProfileMenuItem
                        icon={<Search size={16} />}
                        label={getText('profile.search', 'Search')}
                        onClick={() => handleProfileMenuItemClick('search')}
                      />

                      <ProfileMenuItem
                        icon={isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                        label={isDarkMode ? getText('profile.light_mode', 'Light Mode') : getText('profile.dark_mode', 'Dark Mode')}
                        onClick={() => handleProfileMenuItemClick('theme')}
                      />

                      <ProfileMenuItem
                        icon={<Info size={16} />}
                        label={getText('profile.about', 'About')}
                        onClick={() => handleProfileMenuItemClick('about')}
                      />

                      <ProfileMenuItem
                        icon={<FileText size={16} />}
                        label={getText('profile.terms_conditions', 'Terms & Conditions')}
                        onClick={() => handleProfileMenuItemClick('terms-conditions')}
                      />

                      <ProfileMenuItem
                        icon={<LogOut size={16} />}
                        label={getText('profile.sign_out', 'Sign Out')}
                        onClick={() => handleProfileMenuItemClick('logout')}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Guest User Profile */}
                    <div className="profile-dropdown-header-guest">
                      {guestProfileIconError ? (
                        <div className="profile-avatar-circle">G</div>
                      ) : (
                        <Image
                          src="/assets/other-Icons/profileicon.webp"
                          alt="Profile"
                          width={70}
                          height={70}
                          className="profile-guest-icon"
                          unoptimized
                          onError={() => setGuestProfileIconError(true)}
                        />
                      )}
                    </div>

                    {/* QR Code and Sign Up Row */}
                    <div className="guest-signup-row">
                      <button
                        className="guest-qr-button"
                        onClick={openQRModal}
                        title={getText('profile.qr_enlarge_hover', 'Click to enlarge QR code')}
                      >
                        {qrImageError ? (
                          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>QR</span>
                        ) : (
                          <Image
                            src="/assets/images/QR.png"
                            alt="QR Code"
                            width={24}
                            height={24}
                            className="guest-qr-image"
                            onError={() => setQrImageError(true)}
                            unoptimized
                          />
                        )}
                      </button>
                      <button
                        className="guest-signup-button"
                        onClick={() => handleProfileMenuItemClick('signup')}
                      >
                        <span>{getText('profile.sign_up', 'Sign Up')}</span>
                        <span className="profile-menu-arrow">›</span>
                      </button>
                    </div>

                    <div className="profile-menu-section">
                      <ProfileMenuItem
                        icon={<Lock size={16} />}
                        label={getText('profile.sign_in', 'Sign In')}
                        showArrow
                        onClick={() => handleProfileMenuItemClick('signin')}
                      />

                      <ProfileMenuItem
                        icon={<Search size={16} />}
                        label={getText('profile.search', 'Search')}
                        onClick={() => handleProfileMenuItemClick('search')}
                      />

                      <ProfileMenuItem
                        icon={isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                        label={isDarkMode ? getText('profile.light_mode', 'Light Mode') : getText('profile.dark_mode', 'Dark Mode')}
                        onClick={() => handleProfileMenuItemClick('theme')}
                      />

                      <ProfileMenuItem
                        icon={<Info size={16} />}
                        label={getText('profile.about', 'About')}
                        onClick={() => handleProfileMenuItemClick('about')}
                      />

                      <ProfileMenuItem
                        icon={<FileText size={16} />}
                        label={getText('profile.terms_conditions', 'Terms & Conditions')}
                        onClick={() => handleProfileMenuItemClick('terms-conditions')}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
          <div>
            <button
              className="mobile-nav-item"
              onClick={() => toggleMobileDropdown('meet-yourself')}
            >
              {getText('meet_yourself.label', 'Meet Yourself')}{' '}
              {mobileDropdown === 'meet-yourself' ? '▲' : '▼'}
            </button>
            <div
              className={`mobile-dropdown-items ${
                mobileDropdown === 'meet-yourself' ? 'mobile-dropdown-open' : ''
              }`}
            >
              {meetYourselfItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mobile-dropdown-link"
                  onClick={closeMobileMenu}
                >
                  <span className="dropdown-icon">{item.icon}</span> {item.label}
                </Link>
              ))}
            </div>
          </div>

          <button
            className="mobile-nav-item"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('about');
              closeMobileMenu();
            }}
          >
            {getText('drishiq', 'DrishiQ')}
          </button>

          <button
            className="mobile-nav-item"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('blog-insights');
              closeMobileMenu();
            }}
          >
            {getText('blog', 'Blog')}
          </button>

          <button
            className="mobile-nav-item"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('testimonials-usersay');
              closeMobileMenu();
            }}
          >
            {getText('voice', 'Voice')}
          </button>

          <button
            className="mobile-nav-item"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('grow-with-us');
              closeMobileMenu();
            }}
          >
            {getText('grow', 'Grow')}
          </button>

          <button
            className="mobile-nav-item"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('clarity-anchor');
              closeMobileMenu();
            }}
          >
            {getText('bridge', 'Bridge')}
          </button>

          <div>
            <button className="mobile-nav-item" onClick={() => toggleMobileDropdown('your-path')}>
              {getText('your_path_label', 'Your Path')}{' '}
              {mobileDropdown === 'your-path' ? '▲' : '▼'}
            </button>
            <div
              className={`mobile-dropdown-items ${
                mobileDropdown === 'your-path' ? 'mobile-dropdown-open' : ''
              }`}
            >
              {yourPathItems.map(item => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="mobile-dropdown-link"
                  onClick={closeMobileMenu}
                >
                  <span className="dropdown-icon">{item.icon}</span> {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <HeaderSearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSubmit={handleSearch}
        inputRef={searchInputRef}
      />

      <HeaderQRModal
        isOpen={isQRModalOpen}
        onClose={closeQRModal}
        qrImageError={qrImageError}
        onQrImageError={() => setQrImageError(true)}
        getText={getText}
      />

      {/* Floating Social Icons - Hidden on chat pages */}
      {!isChatPage && (
        <div className="floating-social-icons">
          <a
            href="https://www.facebook.com/profile.php?id=61580140467817"
            target="_blank"
            rel="noopener noreferrer"
            className="floating-social-icon"
            aria-label="Facebook"
            title="Facebook"
          >
            <Image
              src="/assets/social-icons/facebook.png"
              alt="Facebook"
              width={36}
              height={36}
              unoptimized
            />
          </a>
          <a
            href="https://www.youtube.com/watch?v=BoGI6nn3Mz0&list=PLkvOieJ_pAbDGUm6laWiJtbxTGoNZjKkN&index=2"
            target="_blank"
            rel="noopener noreferrer"
            className="floating-social-icon"
            aria-label="YouTube"
            title="YouTube"
          >
            <Image
              src="/assets/social-icons/youtube.jpg"
              alt="YouTube"
              width={36}
              height={36}
              unoptimized
            />
          </a>
          <a
            href="https://www.linkedin.com/company/drishiq"
            target="_blank"
            rel="noopener noreferrer"
            className="floating-social-icon"
            aria-label="LinkedIn"
            title="LinkedIn"
          >
            <Image
              src="/assets/social-icons/linkedin.png"
              alt="LinkedIn"
              width={36}
              height={36}
              unoptimized
            />
          </a>
        </div>
      )}
    </>
  );
};

export default Header;