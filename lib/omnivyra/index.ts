/**
 * Omnivyra Integration Module
 * 
 * Handles communication between Drishiq and Omnivyra middleware.
 * 
 * Endpoints:
 * - /api/uda/bounded - Home page chat (6-9 clarification rounds)
 * - /api/uda/open-solution - Main chat (alignment + solutions)
 */

export { OmnivyraClient, createOmnivyraClient, getOmnivyraClient } from './client';
export {
  toOmnivyraUserProfile,
  toOmnivyraConversationHistory,
  buildOmnivyraRequest,
  formatOmnivyraResponseForUser,
} from './client';

export type {
  // Request types
  OmnivyraRequest,
  OmnivyraBaseRequest,
  OmnivyraUserProfile,
  OmnivyraConversationEntry,
  OmnivyraCHIE,
  OmnivyraMetadata,
  OmnivyraDomain,
  OmnivyraMode,
  
  // Response types
  OmnivyraResponse,
  OmnivyraBaseResponse,
  OmnivyraBoundedResponse,
  OmnivyraOpenSolutionResponse,
  OmnivyraDiagnostic,
  OmnivyraSolution,
  OmnivyraPlan,
  
  // Error types
  OmnivyraErrorResponse,
  OmnivyraErrorType,
  
  // Client types
  OmnivyraClientConfig,
  OmnivyraHeaders,
  OmnivyraResult,
} from './types';
