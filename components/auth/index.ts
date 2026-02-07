// Core Authentication Components
export { default as PhoneCaptureAuth } from './PhoneCaptureAuthSimple';
export { default as EmailAuth } from './EmailAuth';
export { default as ChecklistAuth } from './ChecklistAuth';

// Helper Components
export { default as ProviderLinkResolverDialog } from './ProviderLinkResolverDialog';
export { default as MagicLinkCompleteGate, withMagicLinkHandling } from './MagicLinkCompleteGate';
export { default as ReauthenticateDialog, useReauthentication } from './ReauthenticateDialog';

// Authentication Hooks
export * from './hooks';

// Types
export * from './types';
