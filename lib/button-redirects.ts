/**
 * Button Redirect Configuration
 * Maps buttons in specific sections to their target URLs and optional tabs
 */

export interface ButtonRedirectConfig {
  section: string;
  button: string;
  url: string;
  tab?: string;
}

/**
 * Configuration data from the migration table
 * Maps section + button text to target URL and optional tab
 */
export const BUTTON_REDIRECTS: ButtonRedirectConfig[] = [
  // About section
  {
    section: 'about',
    button: '🦋 Join early access',
    url: 'http://localhost:3000/request',
    tab: 'Trial Access',
  },
  {
    section: 'about',
    button: 'Join Now',
    url: 'http://localhost:3000/request',
    tab: 'Trial Access',
  },
  
  // Areas section
  {
    section: 'Areas we',
    button: '🦄 start now',
    url: 'http://localhost:3000/signup',
  },
  
  // Banner section
  {
    section: 'banner',
    button: '🐉 submit your challenge for support',
    url: 'http://localhost:3000/request',
    tab: 'Sponsor support',
  },
  {
    section: 'banner',
    button: '🦅 share your story',
    url: 'http://localhost:3000/share-experience#story',
  },
  {
    section: 'banner',
    button: '📣 share your story',
    url: 'http://localhost:3000/share-experience#story',
  },
  {
    section: 'banner',
    button: '🦉 sponsor a session now',
    url: 'http://localhost:3000/support',
  },
  {
    section: 'banner',
    button: '🐘 start your clarity session',
    url: 'http://localhost:3000/signup',
  },
  {
    section: 'banner',
    button: '🦒 explore your drishiq experience',
    url: 'http://localhost:3000/signup',
  },
  
  // Choose your path section
  {
    section: 'choose your path',
    button: '🐼 support',
    url: 'http://localhost:3000/support',
  },
  {
    section: 'choose your path',
    button: '🦁 gift',
    url: 'http://localhost:3000/priceplan#gift-section',
  },
  {
    section: 'choose your path',
    button: '🐨 early access',
    url: 'http://localhost:3000/request',
    tab: 'Trial Access',
  },
  {
    section: 'choose your path',
    button: '🦊 build',
    url: 'http://localhost:3000/grow-with-us/collaborators-creators',
  },
  
  // Features section
  {
    section: 'features',
    button: '🐸 try now',
    url: 'http://localhost:3000/signup',
  },
  
  // Grow with us section
  {
    section: 'grow with us',
    button: '🐧 join your movement',
    url: 'http://localhost:3000/signup',
    tab: 'grow',
  },
  
  // Hero section
  {
    section: 'Hero section',
    button: '🦜 take a closer look',
    url: 'http://localhost:3000/signup',
  },
  {
    section: 'Hero section',
    button: "🐝 Let's begin",
    url: 'http://localhost:3000/signup',
  },
  {
    section: 'Hero section',
    button: '🐬 drishiQ can help',
    url: 'http://localhost:3000/signup',
  },
  {
    section: 'Hero section',
    button: '🦈 Experience',
    url: 'http://localhost:3000/signup',
  },
  {
    section: 'Hero section',
    button: '🦩 Stand tall',
    url: 'http://localhost:3000/signup',
  },
  {
    section: 'Hero section',
    button: '🐙 meet your self',
    url: 'should open dropdown for meet yourself', // Special case - dropdown, not redirect
  },
  {
    section: 'Hero section',
    button: '🦐 just build',
    url: 'http://localhost:3000/grow-with-us/collaborators-creators',
  },
  {
    section: 'Hero section',
    button: '🦅 share your story',
    url: 'http://localhost:3000/share-experience#story',
  },
  {
    section: 'Hero section',
    button: '📣 share your story',
    url: 'http://localhost:3000/share-experience#story',
  },
  
  // Human connection section
  {
    section: 'human connection',
    button: '🦀 sponsor a session',
    url: 'http://localhost:3000/support',
  },
  {
    section: 'human connection',
    button: '🦞 Get Support',
    url: 'http://localhost:3000/request',
    tab: 'Sponsor support',
  },
  
  // Mental focus section
  {
    section: 'mental fo', // Note: truncated in table
    button: '🦭 start session',
    url: 'http://localhost:3000/signup',
  },
  
  // Testimonials section
  {
    section: 'Testimonials',
    button: '🦢 real stories from real people',
    url: 'http://localhost:3000/testimonials',
  },
];

/**
 * Normalizes button text for matching (case-insensitive, trimmed, emoji-stripped)
 */
export function normalizeButtonText(text: string): string {
  // Remove emojis and special characters, keep alphanumeric, spaces, and apostrophes
  const cleaned = text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
    .replace(/[^\w\s']/g, '') // Remove special characters except word chars, spaces, and apostrophes
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
  return cleaned;
}

/**
 * Normalizes section name for matching (case-insensitive, trimmed)
 */
function normalizeSectionName(section: string): string {
  return section.toLowerCase().trim();
}

/**
 * Gets the redirect URL for a button in a specific section
 * @param section - The section name (e.g., 'about', 'banner', 'Hero section')
 * @param buttonText - The button text to match
 * @returns The redirect URL with optional hash fragment, or null if no match
 */
export function getButtonRedirectUrl(
  section: string,
  buttonText: string
): string | null {
  const normalizedSection = normalizeSectionName(section);
  const normalizedButton = normalizeButtonText(buttonText);
  
  // Find matching config
  const config = BUTTON_REDIRECTS.find(
    (c) =>
      normalizeSectionName(c.section) === normalizedSection &&
      normalizeButtonText(c.button) === normalizedButton
  );
  
  if (!config) {
    return null;
  }
  
  // Handle special case for dropdown
  if (config.url === 'should open dropdown for meet yourself') {
    return null; // Return null to indicate no redirect needed (dropdown handled separately)
  }
  
  // Build URL with tab/hash if specified
  let url = config.url;
  
  // If tab is specified and URL doesn't already have a hash, add it
  if (config.tab && !url.includes('#')) {
    // Convert tab name to a valid hash (lowercase, replace spaces with hyphens)
    const hash = config.tab
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    url = `${url}#${hash}`;
  }
  
  // Remove localhost prefix if needed (for production)
  // You can customize this based on your environment
  if (url.startsWith('http://localhost:3000')) {
    url = url.replace('http://localhost:3000', '');
  }
  
  // Ensure URL starts with / if it's a relative path
  if (url && !url.startsWith('/') && !url.startsWith('http')) {
    url = '/' + url;
  }
  
  return url;
}

/**
 * Checks if a button should be redirected based on section and button text
 */
export function shouldRedirectButton(section: string, buttonText: string): boolean {
  return getButtonRedirectUrl(section, buttonText) !== null;
}

