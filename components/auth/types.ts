// Remove Supabase import and create simple User interface
// import { User } from '@supabase/supabase-js';

// Simple User interface for testing
export interface User {
  uid: string;
  phoneNumber?: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  photoURL?: string;
  metadata?: any;
  providerData?: any[];
  refreshToken?: string;
  tenantId?: string | null;
  delete?: () => Promise<void>;
  getIdToken?: (forceRefresh?: boolean) => Promise<string>;
  getIdTokenResult?: (forceRefresh?: boolean) => Promise<any>;
  reload?: () => Promise<void>;
  toJSON?: () => object;
  isAnonymous?: boolean;
  providerId?: string;
  updateEmail?: (email: string) => Promise<void>;
  updatePassword?: (password: string) => Promise<void>;
  updatePhoneNumber?: (phoneNumber: any) => Promise<void>;
  updateProfile?: (profile: any) => Promise<void>;
  linkWithCredential?: (credential: any) => Promise<any>;
  linkWithPhoneNumber?: (phoneNumber: any) => Promise<any>;
  linkWithPopup?: (provider: any) => Promise<any>;
  linkWithRedirect?: (provider: any) => Promise<void>;
  reauthenticateWithCredential?: (credential: any) => Promise<any>;
  reauthenticateWithPhoneNumber?: (phoneNumber: any) => Promise<any>;
  reauthenticateWithPopup?: (provider: any) => Promise<any>;
  reauthenticateWithRedirect?: (provider: any) => Promise<void>;
  sendEmailVerification?: (actionCodeSettings?: any) => Promise<void>;
  unlink?: (provider: any) => Promise<any>;
  verifyBeforeUpdateEmail?: (email: string, actionCodeSettings?: any) => Promise<void>;
}

// Core authentication result types
export interface AuthSuccess {
  user: User;
  session: any;
  provider?: 'phone' | 'email' | 'social';
}

export interface LinkNeededInfo {
  type: 'phone' | 'email' | 'social';
  identifier: string;
  existingUser?: User;
  suggestedProvider?: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

// Phone authentication types
export interface PhoneAuthState {
  step: 'phone' | 'otp' | 'verifying' | 'success';
  phone: string;
  countryCode: string;
  otp: string[];
  isResending: boolean;
  resendCooldown: number;
  error?: AuthError;
}

// Email authentication types
export interface EmailAuthState {
  step: 'email' | 'password' | 'magic-link' | 'social' | 'success';
  email: string;
  password: string;
  error?: AuthError;
}

// Social provider types
export type SocialProvider = 'google' | 'apple' | 'github' | 'linkedin';

export interface SocialProviderConfig {
  key: SocialProvider;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

// Component props interfaces
export interface PhoneCaptureAuthProps {
  prefilledPhone?: string;
  requireRecaptcha?: boolean;
  onSuccess: (result: AuthSuccess) => void;
  onLinkNeeded: (info: LinkNeededInfo) => void;
  onCancel?: () => void;
  className?: string;
}

export interface EmailAuthProps {
  enablePassword?: boolean;
  enableMagicLink?: boolean;
  socialProviders?: SocialProvider[];
  onSuccess: (result: AuthSuccess) => void;
  onLinkNeeded: (info: LinkNeededInfo) => void;
  onCancel?: () => void;
  className?: string;
}

export interface ProviderLinkResolverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  linkInfo: LinkNeededInfo;
  onResolve: (provider: string, identifier: string) => Promise<void>;
}

export interface MagicLinkCompleteGateProps {
  children: React.ReactNode;
  onComplete: (result: AuthSuccess) => void;
  onError: (error: AuthError) => void;
}

export interface ReauthenticateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: AuthSuccess) => void;
  onCancel?: () => void;
  requiredMethods?: ('phone' | 'email')[];
}

// Rate limiting types
export interface RateLimitState {
  otp: {
    lastSent: number;
    attempts: number;
    cooldown: number;
  };
  email: {
    lastSent: number;
    attempts: number;
    cooldown: number;
  };
}

// Auth machine states
export type AuthMachineState = 
  | 'IDLE'
  | 'AUTH_PHONE'
  | 'AUTH_EMAIL'
  | 'LINK_RESOLVE'
  | 'DONE'
  | 'ERROR';

export interface AuthMachineContext {
  currentState: AuthMachineState;
  user?: User;
  error?: AuthError;
  linkInfo?: LinkNeededInfo;
}

// Country code types
export interface CountryCode {
  code: string;
  label: string;
  flag?: string;
}

// OTP verification types
export interface OTPVerificationResult {
  success: boolean;
  user?: User;
  needsLinking?: boolean;
  linkInfo?: LinkNeededInfo;
  error?: AuthError;
}
