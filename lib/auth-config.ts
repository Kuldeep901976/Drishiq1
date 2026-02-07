export const authConfig = {
  providers: {
    email: {
      enabled: true,
      requireVerification: true
    },
    magicLink: {
      enabled: true,
      redirectTo: '/auth/callback'
    }
  },
  social: {
    enabled: true,
    providers: {
      google: {
        enabled: true,
        name: 'Google',
        color: '#4285F4',
        icon: '/icons/google.svg'
      },
      facebook: {
        enabled: true,
        name: 'Facebook',
        color: '#1877F2',
        icon: '/icons/facebook.svg'
      },
      github: {
        enabled: true,
        name: 'GitHub',
        color: '#333333',
        icon: '/icons/github.svg'
      }
    }
  },
  magicLink: {
    enabled: true,
    redirectTo: '/auth/callback'
  },
  passwordSignup: {
    enabled: true
  },
  invitation: {
    enabled: true
  },
  ui: {
    showSeparators: true,
    showDescriptions: true,
    buttonSize: 'medium',
    maxColumns: 2
  },
  session: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60 // 1 day
  }
};

export const AUTH_CONFIG = authConfig;

export function getEnabledSignupMethods() {
  return [
    { type: 'social', providers: Object.entries(authConfig.social.providers).map(([key, provider]) => ({ ...provider, key })) },
    { type: 'magicLink' },
    { type: 'password' },
    { type: 'invitation' }
  ];
}
